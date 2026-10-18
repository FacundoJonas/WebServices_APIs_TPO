#!/usr/bin/env bash
# =============================================================================
#  Diagnóstico de una VM Debian del ecosistema DeliveryGo.
#
#  Revisa, en orden, todo lo que suele romper la comunicación entre VMs:
#  red, gateway, DNS, hora, Java, servicio, puerto, firewall y la otra VM.
#
#  Uso:
#     ./despliegue/diagnostico-vm.sh                      # sólo esta VM
#     ./despliegue/diagnostico-vm.sh 192.168.1.22 8082    # + prueba hacia otra VM
#
#  Con sudo muestra más datos (procesos de cada puerto, reglas de firewall).
#  No modifica nada: sólo lee.
# =============================================================================
set -uo pipefail

DESTINO_IP="${1:-}"
DESTINO_PUERTO="${2:-}"
ERRORES=0
AVISOS=0

if [[ -t 1 ]]; then V='\033[32m'; R='\033[31m'; A='\033[33m'; N='\033[0m'; else V=''; R=''; A=''; N=''; fi
ok()     { echo -e "  ${V}[OK]${N}    $*"; }
falla()  { echo -e "  ${R}[FALLA]${N} $*"; ERRORES=$((ERRORES + 1)); }
aviso()  { echo -e "  ${A}[AVISO]${N} $*"; AVISOS=$((AVISOS + 1)); }
info()   { echo "          $*"; }
titulo() { echo; echo "── $* ──────────────────────────────────────────"; }

tcp_abierto() { timeout 3 bash -c "</dev/tcp/$1/$2" 2>/dev/null; }

# -----------------------------------------------------------------------------
titulo "1. Sistema"
info "Host:   $(hostname)"
info "SO:     $(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME")"
info "Kernel: $(uname -r)"
if [[ -r /sys/class/dmi/id/product_name ]]; then
  info "Virt.:  $(cat /sys/class/dmi/id/product_name 2>/dev/null) $(systemd-detect-virt 2>/dev/null)"
fi
MEM_LIBRE=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
if [[ "$MEM_LIBRE" -lt 300 ]]; then
  falla "Memoria disponible: ${MEM_LIBRE} MB (cada servicio usa hasta ~400 MB). Subí la RAM de la VM en Proxmox."
else
  ok "Memoria disponible: ${MEM_LIBRE} MB"
fi
# Se mira /var porque ahí se guardan los datos (/var/lib/deliverygo) y los logs
DISCO=$(df -P /var | awk 'NR==2 {print $5}' | tr -d '%')
[[ "$DISCO" -gt 90 ]] && falla "Disco de /var al ${DISCO}%: las bases H2 y los logs pueden fallar" || ok "Disco de /var al ${DISCO}%"

# -----------------------------------------------------------------------------
titulo "2. Red de la VM"
IPS=$(ip -4 -o addr show scope global | awk '{print $2" "$4}')
if [[ -z "$IPS" ]]; then
  falla "La VM no tiene IPv4. Revisar la placa de red en Proxmox (Hardware > Network Device, bridge vmbr0) y /etc/network/interfaces o DHCP."
else
  while read -r linea; do ok "Interfaz $linea"; done <<< "$IPS"
fi
if [[ $(echo "$IPS" | grep -c .) -gt 1 ]]; then
  aviso "Hay más de una IP: asegurate de usar en RECEPTOR_URL la que está en la red de las otras VMs."
fi

GATEWAY=$(ip route | awk '/^default/ {print $3; exit}')
if [[ -z "$GATEWAY" ]]; then
  falla "No hay ruta por defecto (gateway). Sin esto sólo se llega a la propia subred."
else
  ok "Gateway: $GATEWAY"
  if ping -c1 -W2 "$GATEWAY" >/dev/null 2>&1; then ok "Responde ping al gateway"; else aviso "El gateway no responde ping (puede estar filtrado)"; fi
fi

# Proxmox clona VMs: si dos VMs comparten machine-id, el DHCP puede darles la MISMA IP
info "machine-id: $(cat /etc/machine-id 2>/dev/null)  (debe ser DISTINTO en cada VM)"

# -----------------------------------------------------------------------------
titulo "3. DNS y hora"
if getent hosts deb.debian.org >/dev/null 2>&1; then ok "DNS resuelve deb.debian.org"; else aviso "DNS no resuelve nombres externos (usar IPs en RECEPTOR_URL o revisar /etc/resolv.conf)"; fi
if getent hosts "$(hostname)" >/dev/null 2>&1; then ok "El propio hostname se resuelve"; else aviso "$(hostname) no está en /etc/hosts: Java puede tardar al arrancar. Agregar: 127.0.1.1 $(hostname)"; fi
if command -v timedatectl >/dev/null 2>&1; then
  if timedatectl show -p NTPSynchronized --value 2>/dev/null | grep -q yes; then
    ok "Hora sincronizada ($(date -u +%H:%M:%S) UTC)"
  else
    aviso "Hora NO sincronizada. Con JWT, una diferencia de minutos entre VMs invalida tokens: apt install systemd-timesyncd"
  fi
fi

# -----------------------------------------------------------------------------
titulo "4. Java"
if command -v java >/dev/null 2>&1; then
  VERSION=$(java -XshowSettings:properties -version 2>&1 | awk -F'= ' '/java.specification.version/ {print $2}')
  if [[ "${VERSION%%.*}" -ge 17 ]]; then ok "Java $VERSION"; else falla "Java $VERSION: se necesita 17 o superior (apt install default-jre-headless)"; fi
else
  falla "Java no está instalado: sudo apt install default-jre-headless"
fi

# -----------------------------------------------------------------------------
titulo "5. Servicios DeliveryGo"
ENCONTRADO=0
for SERVICIO in deliverygo-emisor deliverygo-receptor; do
  if systemctl list-unit-files "$SERVICIO.service" >/dev/null 2>&1 && systemctl cat "$SERVICIO" >/dev/null 2>&1; then
    ENCONTRADO=1
    MODULO=$([[ $SERVICIO == *emisor ]] && echo emisor-pedidos || echo receptor-notificaciones)
    ENV="/etc/deliverygo/$MODULO.env"
    PUERTO=$(grep -E '^PUERTO=' "$ENV" 2>/dev/null | cut -d= -f2)
    PUERTO="${PUERTO:-$([[ $SERVICIO == *emisor ]] && echo 8081 || echo 8082)}"

    if systemctl is-active --quiet "$SERVICIO"; then
      ok "$SERVICIO activo"
    else
      falla "$SERVICIO NO está activo. Ver: journalctl -u $SERVICIO -n 50"
      journalctl -u "$SERVICIO" -n 5 --no-pager 2>/dev/null | sed 's/^/          /'
      continue
    fi

    ESCUCHA=$(ss -Htln "sport = :$PUERTO" 2>/dev/null | awk '{print $4}')
    if [[ -z "$ESCUCHA" ]]; then
      falla "Nada escucha en el puerto $PUERTO (¿todavía arrancando? ¿PUERTO distinto en $ENV?)"
    # Java puede mostrarla como 127.0.0.1, [::ffff:127.0.0.1] (IPv4 en formato IPv6) o [::1]
    elif ! echo "$ESCUCHA" | grep -qvE '127\.0\.0\.1|\[::1\]'; then
      falla "Escucha sólo en $ESCUCHA: otras PCs NO pueden entrar. Poner HOST=0.0.0.0 en $ENV"
    else
      ok "Escucha en $ESCUCHA (accesible desde la red)"
    fi

    if curl -sf -m 3 "http://127.0.0.1:$PUERTO/api/v1/ping" >/dev/null; then
      ok "http://127.0.0.1:$PUERTO/api/v1/ping responde"
    else
      falla "El puerto $PUERTO está abierto pero /api/v1/ping no responde"
    fi

    if [[ $SERVICIO == *emisor ]]; then
      URL=$(grep -E '^RECEPTOR_URL=' "$ENV" 2>/dev/null | cut -d= -f2-)
      info "RECEPTOR_URL=$URL"
      [[ "$URL" == *localhost* || "$URL" == *127.0.0.1* ]] && aviso "RECEPTOR_URL apunta a esta misma VM"
      CODIGO=$(curl -s -m 20 -o /tmp/diag-deliverygo.json -w '%{http_code}' "http://127.0.0.1:$PUERTO/api/v1/diagnostico")
      if [[ "$CODIGO" == "200" ]]; then
        ok "Diagnóstico emisor -> receptor: los 5 pasos OK"
      else
        falla "Diagnóstico emisor -> receptor falló (HTTP $CODIGO). Paso con problema:"
        python3 - <<'EOF' 2>/dev/null || cat /tmp/diag-deliverygo.json
import json
d = json.load(open("/tmp/diag-deliverygo.json"))
for p in d["pasos"]:
    if not p["ok"]:
        print("          ", p["nombre"], "->", p["detalle"])
        print("           Sugerencia:", p["sugerencia"])
EOF
      fi
    fi
  fi
done
[[ $ENCONTRADO -eq 0 ]] && aviso "No hay servicios DeliveryGo instalados (sudo ./despliegue/instalar-debian.sh emisor|receptor)"

# -----------------------------------------------------------------------------
titulo "6. Firewall de la VM"
if command -v ufw >/dev/null 2>&1; then
  ESTADO=$(ufw status 2>/dev/null | head -1)
  if [[ "$ESTADO" == *active* && "$ESTADO" != *inactive* ]]; then
    aviso "ufw activo. Reglas:"; ufw status 2>/dev/null | sed 's/^/          /'
  else
    ok "ufw inactivo"
  fi
fi
if command -v nft >/dev/null 2>&1 && [[ $EUID -eq 0 ]]; then
  if nft list ruleset 2>/dev/null | grep -qE 'policy drop|reject|drop'; then
    aviso "nftables tiene reglas que descartan/rechazan tráfico: nft list ruleset"
  else
    ok "nftables sin reglas de bloqueo"
  fi
fi
info "Recordá que Proxmox tiene su PROPIO firewall (Datacenter > Firewall, Nodo > Firewall y VM > Firewall)."
info "Si está activo en la VM, hay que agregar una regla IN ACCEPT para el puerto (8081/8082)."

# -----------------------------------------------------------------------------
if [[ -n "$DESTINO_IP" ]]; then
  titulo "7. Hacia la otra VM ($DESTINO_IP${DESTINO_PUERTO:+:$DESTINO_PUERTO})"
  if ip -4 -o addr show | grep -q " $DESTINO_IP/"; then
    aviso "$DESTINO_IP es una IP de ESTA misma VM"
  fi
  RUTA=$(ip route get "$DESTINO_IP" 2>/dev/null | head -1)
  info "Ruta: $RUTA"
  if echo "$RUTA" | grep -q " via "; then
    aviso "Se llega a través de un router: la otra VM está en OTRA subred. Lo normal es que estén en el mismo bridge/subred."
  fi
  if ping -c2 -W2 "$DESTINO_IP" >/dev/null 2>&1; then
    ok "Responde ping"
  else
    aviso "No responde ping (puede estar apagada, en otra red o el ICMP filtrado)"
  fi
  VECINO=$(ip neigh show "$DESTINO_IP" 2>/dev/null)
  [[ -n "$VECINO" ]] && info "ARP: $VECINO"
  if echo "$VECINO" | grep -q FAILED; then
    falla "ARP FAILED: no hay ninguna máquina con esa IP en el segmento (VM apagada, IP errónea o bridge distinto)"
  fi

  if [[ -n "$DESTINO_PUERTO" ]]; then
    if tcp_abierto "$DESTINO_IP" "$DESTINO_PUERTO"; then
      ok "Puerto TCP $DESTINO_PUERTO abierto"
      RESP=$(curl -s -m 5 "http://$DESTINO_IP:$DESTINO_PUERTO/api/v1/ping")
      if [[ -n "$RESP" ]]; then
        ok "Respuesta de /api/v1/ping: $RESP"
      else
        falla "TCP abierto pero /api/v1/ping no responde: ¿es el servicio correcto?"
      fi
    else
      falla "Puerto $DESTINO_PUERTO cerrado o filtrado. En la otra VM: systemctl status deliverygo-*, ss -tlnp, firewall."
    fi
  fi
fi

# -----------------------------------------------------------------------------
titulo "Resumen"
if [[ $ERRORES -eq 0 ]]; then
  echo -e "  ${V}Sin fallas${N} ($AVISOS aviso/s)."
else
  echo -e "  ${R}$ERRORES falla/s${N}, $AVISOS aviso/s. Corregir de arriba hacia abajo: la primera falla suele causar las siguientes."
fi
exit $ERRORES
