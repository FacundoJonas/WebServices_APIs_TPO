#!/usr/bin/env bash
# =============================================================================
#  Instala UNO de los módulos de la prueba como servicio systemd en Debian.
#
#  Uso (en la VM, dentro del repositorio clonado):
#     sudo ./despliegue/instalar-debian.sh receptor
#     sudo ./despliegue/instalar-debian.sh emisor
#
#  Qué hace:
#    1. Instala Java (y Maven si hay que compilar) con apt.
#    2. Compila el módulo, o usa el JAR si ya está en <modulo>/target/.
#    3. Crea el usuario de sistema "deliverygo" (el servicio no corre como root).
#    4. Copia el JAR a /opt/deliverygo/<modulo>/.
#    5. Crea /etc/deliverygo/<modulo>.env con la configuración (sólo si no existe).
#    6. Crea y arranca el servicio systemd deliverygo-<modulo>.
#    7. Abre el puerto en ufw si ufw está activo.
#    8. Verifica que /api/v1/ping responda.
#
#  Se puede ejecutar varias veces: actualiza el JAR y conserva la configuración.
# =============================================================================
set -euo pipefail

ROL="${1:-}"
case "$ROL" in
  emisor)   MODULO="emisor-pedidos";          PUERTO_DEFECTO=8081 ;;
  receptor) MODULO="receptor-notificaciones"; PUERTO_DEFECTO=8082 ;;
  *) echo "Uso: sudo $0 emisor|receptor"; exit 1 ;;
esac

if [[ $EUID -ne 0 ]]; then
  echo "Este script necesita root: sudo $0 $ROL"
  exit 1
fi

DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR_PROYECTO="$(dirname "$DIR_SCRIPT")"
SERVICIO="deliverygo-$ROL"
USUARIO="deliverygo"
DIR_APP="/opt/deliverygo/$MODULO"
DIR_DATOS="/var/lib/deliverygo/$MODULO"
ARCHIVO_ENV="/etc/deliverygo/$MODULO.env"
JAR_ORIGEN="$DIR_PROYECTO/$MODULO/target/$MODULO.jar"

paso() { echo; echo "==> $*"; }

# ---------------------------------------------------------------- 1. Java
paso "Verificando Java"
if ! command -v java >/dev/null 2>&1; then
  apt-get update -qq
  # default-jre-headless: Java 17 en Debian 12, Java 21 en Debian 13
  apt-get install -y -qq default-jre-headless
fi
java -version 2>&1 | head -1

VERSION_JAVA=$(java -XshowSettings:properties -version 2>&1 | awk -F'= ' '/java.specification.version/ {print $2}')
if [[ "${VERSION_JAVA%%.*}" -lt 17 ]]; then
  echo "ERROR: se necesita Java 17 o superior (hay $VERSION_JAVA)."
  exit 1
fi

# ---------------------------------------------------------------- 2. JAR
paso "Preparando el JAR de $MODULO"
if [[ ! -f "$JAR_ORIGEN" ]]; then
  echo "No existe $JAR_ORIGEN: se compila con Maven."
  if ! command -v mvn >/dev/null 2>&1 || ! command -v javac >/dev/null 2>&1; then
    apt-get update -qq
    apt-get install -y -qq default-jdk-headless maven
  fi
  # Se compila con el usuario dueño del repositorio, no como root
  DUENO=$(stat -c '%U' "$DIR_PROYECTO")
  sudo -u "$DUENO" mvn -q -B -f "$DIR_PROYECTO/pom.xml" -pl "$MODULO" -am -DskipTests package
fi
ls -lh "$JAR_ORIGEN"

# ---------------------------------------------------------------- 3. Usuario
paso "Usuario de sistema $USUARIO"
id "$USUARIO" >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin "$USUARIO"

# ---------------------------------------------------------------- 4. Archivos
paso "Copiando a $DIR_APP"
install -d -o root -g root -m 755 "$DIR_APP"
install -o root -g root -m 644 "$JAR_ORIGEN" "$DIR_APP/$MODULO.jar"
install -d -o "$USUARIO" -g "$USUARIO" -m 750 "$DIR_DATOS"

# ---------------------------------------------------------------- 5. Config
paso "Configuración $ARCHIVO_ENV"
install -d -m 755 /etc/deliverygo
if [[ ! -f "$ARCHIVO_ENV" ]]; then
  install -o root -g "$USUARIO" -m 640 "$DIR_SCRIPT/$ROL.env.ejemplo" "$ARCHIVO_ENV"
  echo "Creado desde $ROL.env.ejemplo."
  if [[ "$ROL" == "emisor" ]]; then
    echo
    echo "  ¡IMPORTANTE! Editá RECEPTOR_URL con la IP de la VM receptora:"
    echo "     sudo nano $ARCHIVO_ENV"
    echo "     sudo systemctl restart $SERVICIO"
  fi
else
  echo "Ya existe: se conserva tal cual."
fi
PUERTO=$(grep -E '^PUERTO=' "$ARCHIVO_ENV" | cut -d= -f2 || true)
PUERTO="${PUERTO:-$PUERTO_DEFECTO}"

# ---------------------------------------------------------------- 6. systemd
paso "Servicio systemd $SERVICIO"
cat > "/etc/systemd/system/$SERVICIO.service" <<EOF
[Unit]
Description=DeliveryGo prueba de integración - $MODULO
# Espera a que la red esté configurada (si no, puede arrancar sin IP)
After=network-online.target
Wants=network-online.target

[Service]
User=$USUARIO
Group=$USUARIO
WorkingDirectory=$DIR_DATOS
EnvironmentFile=$ARCHIVO_ENV
ExecStart=/usr/bin/env java -Xms128m -Xmx384m -jar $DIR_APP/$MODULO.jar
# Si se cae, systemd lo vuelve a levantar a los 5 segundos
Restart=on-failure
RestartSec=5
# 143 = terminó por SIGTERM (systemctl stop): no es un error
SuccessExitStatus=143
# Endurecimiento básico
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --quiet "$SERVICIO"
systemctl restart "$SERVICIO"

# ---------------------------------------------------------------- 7. Firewall
paso "Firewall"
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow "$PUERTO/tcp" comment "DeliveryGo $ROL" >/dev/null
  echo "ufw: puerto $PUERTO/tcp abierto."
else
  echo "ufw no está activo. Si usás nftables/iptables o el Firewall de Proxmox, abrí $PUERTO/tcp ahí."
fi

# ---------------------------------------------------------------- 8. Verificación
paso "Esperando a que responda http://localhost:$PUERTO/api/v1/ping"
for _ in $(seq 1 60); do
  if curl -sf "http://localhost:$PUERTO/api/v1/ping" >/dev/null 2>&1; then
    curl -s "http://localhost:$PUERTO/api/v1/ping"; echo
    echo
    echo "LISTO. $SERVICIO está corriendo."
    echo "  Desde otra PC:  curl http://$(hostname -I | awk '{print $1}'):$PUERTO/api/v1/ping"
    echo "  Swagger:        http://$(hostname -I | awk '{print $1}'):$PUERTO/swagger-ui.html"
    echo "  Logs:           journalctl -u $SERVICIO -f"
    exit 0
  fi
  sleep 1
done

echo "ERROR: el servicio no respondió en 60 s. Últimas líneas del log:"
journalctl -u "$SERVICIO" -n 40 --no-pager
exit 1
