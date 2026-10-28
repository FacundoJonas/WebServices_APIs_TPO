#!/usr/bin/env bash
# =============================================================================
#  Prueba de integración de punta a punta, desde CUALQUIER PC de la red.
#
#  Uso:
#     ./despliegue/probar-integracion.sh http://IP_EMISOR:8081 http://IP_RECEPTOR:8082
#
#  Pasos:
#    1. Las dos VMs responden /api/v1/ping desde esta PC.
#    2. El emisor llega al receptor (/api/v1/diagnostico).
#    3. Se crea un pedido en el emisor.
#    4. Se verifica, preguntándole DIRECTAMENTE al receptor, que la
#       notificación de ese pedido llegó (con el mismo correlationId).
#    5. El error normalizado funciona (pedido inexistente -> 404).
#    6. El receptor tiene activa la plantilla que usa el emisor y devuelve
#       los campos que consume el Portal (type, title, action). No escribe nada.
#
#  Requiere: curl y python3. Devuelve 0 si todo salió bien.
# =============================================================================
set -uo pipefail

EMISOR="${1:-}"
RECEPTOR="${2:-}"
if [[ -z "$EMISOR" || -z "$RECEPTOR" ]]; then
  echo "Uso: $0 http://IP_EMISOR:8081 http://IP_RECEPTOR:8082"
  exit 1
fi

FALLAS=0
CID="prueba-$(date +%Y%m%d-%H%M%S)-$RANDOM"
USUARIO="usuario-$CID"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

ok()    { echo "  [OK]    $*"; }
falla() { echo "  [FALLA] $*"; FALLAS=$((FALLAS + 1)); }
json()  { python3 -c "import json,sys; d=json.load(open('$1')); print($2)" 2>/dev/null; }

echo "Emisor:   $EMISOR"
echo "Receptor: $RECEPTOR"
echo "Correlation-Id de esta prueba: $CID"

echo; echo "1. Ping desde esta PC"
for URL in "$EMISOR" "$RECEPTOR"; do
  # Justo después de un systemctl restart, Spring Boot tarda ~15 s en atender: se espera hasta 30 s
  RESPONDE=no
  for INTENTO in $(seq 1 30); do
    if curl -sf -m 5 "$URL/api/v1/ping" -o "$TMP/ping.json"; then RESPONDE=si; break; fi
    [[ $INTENTO -eq 1 ]] && echo "  ...esperando a que $URL arranque (hasta 30 s)"
    sleep 1
  done
  if [[ "$RESPONDE" == "si" ]]; then
    ok "$URL -> módulo $(json "$TMP/ping.json" 'd["module"]') en $(json "$TMP/ping.json" 'd["hostname"]') (me vio como $(json "$TMP/ping.json" 'd["clientIp"]'))"
  else
    falla "$URL no responde. Correr en esa VM: ./despliegue/diagnostico-vm.sh"
  fi
done

echo; echo "2. El emisor llega al receptor"
CODIGO=$(curl -s -m 30 -o "$TMP/diag.json" -w '%{http_code}' "$EMISOR/api/v1/diagnostico")
if [[ "$CODIGO" == "200" ]]; then
  ok "Diagnóstico completo OK (DNS, TCP, HTTP, contrato)"
else
  falla "Diagnóstico HTTP $CODIGO:"
  python3 - "$TMP/diag.json" <<'EOF' 2>/dev/null
import json, sys
for p in json.load(open(sys.argv[1]))["pasos"]:
    print("          %-45s %s  %s" % (p["nombre"], "OK" if p["ok"] else "FALLA", p["detalle"]))
    if not p["ok"]:
        print("          Sugerencia:", p["sugerencia"])
EOF
fi

echo; echo "3. Crear pedido en el emisor"
CODIGO=$(curl -s -m 30 -o "$TMP/pedido.json" -w '%{http_code}' -X POST "$EMISOR/api/v1/orders" \
  -H "Content-Type: application/json" -H "X-Correlation-Id: $CID" \
  -d "{\"userId\":\"$USUARIO\",\"merchantId\":\"m-1\",\"deliveryAddressId\":\"d-1\",
       \"items\":[{\"productId\":\"p-1\",\"quantity\":2,\"unitPrice\":7800},{\"productId\":\"p-4\",\"quantity\":1,\"unitPrice\":3900}]}")
PEDIDO=$(json "$TMP/pedido.json" 'd["id"]')
ESTADO=$(json "$TMP/pedido.json" 'd["notification"]["status"]')
if [[ "$CODIGO" == "201" ]]; then
  ok "Pedido $PEDIDO creado, total $(json "$TMP/pedido.json" 'd["total"]') ARS"
  if [[ "$ESTADO" == "ENVIADA" ]]; then
    ok "El emisor informa la notificación como ENVIADA (id en el receptor: $(json "$TMP/pedido.json" 'd["notification"]["notificationId"]'))"
  else
    falla "Notificación $ESTADO: $(json "$TMP/pedido.json" 'd["notification"]["lastError"]')"
  fi
else
  falla "HTTP $CODIGO al crear el pedido: $(cat "$TMP/pedido.json")"
fi

echo; echo "4. Verificar en el receptor (sin pasar por el emisor)"
if curl -sf -m 5 "$RECEPTOR/api/v1/users/$USUARIO/notifications" -o "$TMP/notif.json"; then
  CANTIDAD=$(json "$TMP/notif.json" 'len(d)')
  if [[ "$CANTIDAD" == "1" ]]; then
    ok "El receptor tiene la notificación: \"$(json "$TMP/notif.json" 'd[0]["message"]')\""
    [[ "$(json "$TMP/notif.json" 'd[0]["correlationId"]')" == "$CID" ]] \
      && ok "Mismo correlationId en ambas VMs ($CID)" \
      || falla "El correlationId no viajó entre las VMs"
    ok "El receptor vio la petición venir de $(json "$TMP/notif.json" 'd[0]["originIp"]') (debería ser la IP del emisor)"
    if [[ -n "$(json "$TMP/notif.json" 'd[0]["type"] and d[0]["title"]')" ]]; then
      ok "Trae los campos del Portal: type=$(json "$TMP/notif.json" 'd[0]["type"]'), title=\"$(json "$TMP/notif.json" 'd[0]["title"]')\""
    else
      falla "La notificación no trae type/title: ¿el receptor tiene la versión con plantillas?"
    fi
  else
    falla "El receptor tiene $CANTIDAD notificaciones para $USUARIO (se esperaba 1)"
  fi
else
  falla "No se pudo consultar el receptor"
fi

echo; echo "5. Error normalizado"
CODIGO=$(curl -s -m 5 -o "$TMP/err.json" -w '%{http_code}' "$EMISOR/api/v1/orders/999999999")
if [[ "$CODIGO" == "404" && "$(json "$TMP/err.json" 'd["code"]')" == "PEDIDO_INEXISTENTE" ]]; then
  ok "404 con {timestamp, status, code, message, path, correlationId}"
else
  falla "Se esperaba 404 PEDIDO_INEXISTENTE y llegó HTTP $CODIGO: $(cat "$TMP/err.json")"
fi

echo; echo "6. Plantillas del receptor (sólo lectura)"
CODIGO=$(curl -s -m 5 -o "$TMP/plantilla.json" -w '%{http_code}' "$RECEPTOR/api/v1/templates/PEDIDO_CREADO")
if [[ "$CODIGO" == "200" && "$(json "$TMP/plantilla.json" 'd["active"]')" == "True" ]]; then
  ok "PEDIDO_CREADO activa, exige: $(json "$TMP/plantilla.json" '", ".join(d["requiredData"])')"
elif [[ "$CODIGO" == "200" ]]; then
  falla "PEDIDO_CREADO está desactivada: el emisor va a recibir 422. Activala desde la página del receptor"
else
  falla "GET /api/v1/templates/PEDIDO_CREADO devolvió HTTP $CODIGO (¿receptor sin la versión con plantillas?)"
fi

echo
if [[ $FALLAS -eq 0 ]]; then
  echo "RESULTADO: integración OK entre $EMISOR y $RECEPTOR"
else
  echo "RESULTADO: $FALLAS falla/s. Buscar en los logs: journalctl -u deliverygo-emisor -u deliverygo-receptor | grep $CID"
fi
exit $FALLAS
