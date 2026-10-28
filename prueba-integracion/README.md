# Prueba de integración entre VMs (Proxmox + Debian)

> Branch: `feature/prueba-integracion-proxmox`
> Objetivo: verificar que las máquinas virtuales Debian del Proxmox pueden **exponer una API Java** y **consumirse entre sí por la red**, y encontrar rápido qué está mal cuando no pueden.

> 🖥️ **Páginas web:** el emisor (`http://IP_EMISOR:8081/`) carga pedidos como cliente y verifica que llegaron. El receptor (`http://IP_RECEPTOR:8082/`) es donde **se modifica**: plantillas, reintentos, canales caídos, y una *Vista del Portal* con el JSON exacto que consume el front.
>
> 🔎 **Especificación y auditoría** de cada módulo (para comparar con los módulos de los compañeros): [`docs/especificacion-y-auditoria-modulos.md`](docs/especificacion-y-auditoria-modulos.md)
>
> 📘 **Guía completa paso a paso** (cómo funciona por dentro, crear las VMs en Proxmox, plan de pruebas con planilla de resultados y diagnóstico de defectos): [`docs/guia-completa-proxmox.md`](docs/guia-completa-proxmox.md)

La prueba usa dos módulos reales del TPO, reducidos a lo mínimo:

| Rol | Módulo del TPO | Qué hace | Puerto |
|---|---|---|---|
| **Emisor** | Equipo 3 - Pedidos | Crea un pedido y le pide al otro módulo que notifique al usuario | `8081` |
| **Receptor** | Equipo 6 - Notificaciones | Recibe la solicitud, la valida y la guarda en **su propia** base | `8082` |

Respeta las reglas de la consigna:
- Base `/api/v1`, JSON, rutas obligatorias de cada equipo.
- Base de datos independiente por módulo.
- DTO distintos de las entidades JPA.
- Error normalizado `{timestamp, status, code, message, path, correlationId}`.
- `X-Correlation-Id` propagado entre módulos.
- Timeouts y fallas parciales contemplados.
- Swagger disponible.

---

## Índice

1. [Cómo se conecta todo](#1-cómo-se-conecta-todo)
2. [Preparar las VMs en Proxmox](#2-preparar-las-vms-en-proxmox)
3. [Instalar en cada VM](#3-instalar-en-cada-vm)
4. [Probar la integración](#4-probar-la-integración)
5. [Diagnosticar defectos de las VMs](#5-diagnosticar-defectos-de-las-vms)
6. [Tabla de defectos comunes](#6-tabla-de-defectos-comunes)
7. [Simular fallas](#7-simular-fallas)
8. [API: endpoints y contratos](#8-api-endpoints-y-contratos)
9. [Configuración (variables de entorno)](#9-configuración-variables-de-entorno)
10. [Cómo está hecho el código](#10-cómo-está-hecho-el-código)
11. [Desarrollo local](#11-desarrollo-local)
12. [Qué se verificó y qué no](#12-qué-se-verificó-y-qué-no)
13. [Limitaciones](#13-limitaciones)
14. [Cómo lo consume el Portal](#14-cómo-lo-consume-el-portal)
15. [¿Hace falta un programa para controlar las PCs?](#15-hace-falta-un-programa-para-controlar-las-pcs)

---

## 1. Cómo se conecta todo

```
                 Red del Proxmox (bridge vmbr0, ej. 192.168.1.0/24)
 ┌──────────────────────────────────────────────────────────────────────────┐
 │                                                                          │
 │  ┌─────────────────────────┐   POST /api/v1/notifications  ┌─────────────────────────┐
 │  │ VM 1 - Debian           │ ────────────────────────────▶ │ VM 2 - Debian           │
 │  │ emisor-pedidos  :8081   │   X-Correlation-Id            │ receptor-notif.  :8082  │
 │  │ BD propia (H2)          │   Idempotency-Key             │ BD propia (H2)          │
 │  │ RECEPTOR_URL=http://VM2 │ ◀──────────────────────────── │                         │
 │  └───────────▲─────────────┘   201 { id, status, ... }     └───────────▲─────────────┘
 │              │                                                         │
 └──────────────┼─────────────────────────────────────────────────────────┼─┘
                │ curl / navegador / VS Code / Portal React               │
         ┌──────┴──────────────────────────────────────────────────────────┴──┐
         │ Cualquier PC de la misma red                                       │
         └────────────────────────────────────────────────────────────────────┘
```

**Flujo de la prueba:**
1. Desde una PC se hace `POST /api/v1/orders` a la VM 1.
2. La VM 1 guarda el pedido en su base y llama a la VM 2 (`POST /api/v1/notifications`).
3. La VM 2 guarda la notificación y responde `201`.
4. La VM 1 marca el pedido con `notification.status = ENVIADA`.
5. Desde la PC se le pregunta **directamente** a la VM 2 si la notificación llegó (`GET /api/v1/users/{id}/notifications`).

**Si la VM 2 no responde**, el pedido se crea igual (falla parcial), queda `FALLIDA` con el motivo y se puede reintentar.

---

## 2. Preparar las VMs en Proxmox

### Recursos mínimos por VM

| Recurso | Mínimo | Recomendado |
|---|---|---|
| SO | Debian 12 (bookworm) o 13 (trixie) | Debian 13 |
| vCPU | 1 | 2 |
| RAM | 1 GB | 2 GB (con Maven compilando en la VM) |
| Disco | 4 GB | 8 GB |
| Red | VirtIO, **mismo bridge** que las demás VMs (ej. `vmbr0`) y **misma VLAN tag** (o ninguna) | — |

### Checklist en Proxmox (antes de instalar)

1. **Hardware → Network Device:** todas las VMs en el mismo bridge (`vmbr0`) y con el mismo *VLAN Tag*. Un tag distinto aísla la VM aunque la IP "parezca" estar bien.
2. **IP fija recomendada.** Si usás DHCP, la IP puede cambiar y el `RECEPTOR_URL` del emisor queda apuntando a otra máquina. En Debian, `/etc/network/interfaces`:
   ```
   auto ens18
   iface ens18 inet static
       address 192.168.1.22/24
       gateway 192.168.1.1
   ```
   Después: `sudo systemctl restart networking`. El nombre de la interfaz (`ens18`) sale de `ip a`.
3. **VMs clonadas de una plantilla:** si todas comparten el mismo `machine-id`, el DHCP puede darles **la misma IP**. En cada clon:
   ```bash
   sudo rm -f /etc/machine-id /var/lib/dbus/machine-id
   sudo systemd-machine-id-setup
   sudo reboot
   ```
   `diagnostico-vm.sh` muestra el `machine-id` para compararlo entre VMs.
4. **Firewall de Proxmox:** está en tres niveles (*Datacenter*, *Nodo* y *VM → Firewall*). Si está activo en la VM, agregar una regla `IN ACCEPT` TCP al puerto `8081` (emisor) o `8082` (receptor).
5. **QEMU Guest Agent (opcional):** `sudo apt install qemu-guest-agent` y activarlo en *Options*. Así Proxmox muestra la IP de la VM en el *Summary*.
6. **Hora sincronizada:** `sudo apt install systemd-timesyncd`. Importa cuando se agregue JWT: una diferencia de minutos entre VMs invalida los tokens.

---

## 3. Instalar en cada VM

El script hace todo:
- instala Java (y Maven si hace falta compilar);
- crea el usuario de sistema `deliverygo`;
- copia el JAR a `/opt/deliverygo/`;
- crea la configuración en `/etc/deliverygo/`;
- registra un servicio systemd que arranca solo al prender la VM;
- abre el puerto en `ufw` si está activo;
- verifica que responda.

### VM 2 - Receptor (instalar primero)

```bash
sudo apt update && sudo apt install -y git curl python3
git clone -b feature/prueba-integracion-proxmox https://github.com/FacundoJonas/WebServices_APIs_TPO.git
cd WebServices_APIs_TPO/prueba-integracion
sudo ./despliegue/instalar-debian.sh receptor
```

Al final muestra la IP y la URL de Swagger. **Anotá la IP.**

### VM 1 - Emisor

```bash
sudo apt update && sudo apt install -y git curl python3
git clone -b feature/prueba-integracion-proxmox https://github.com/FacundoJonas/WebServices_APIs_TPO.git
cd WebServices_APIs_TPO/prueba-integracion
sudo ./despliegue/instalar-debian.sh emisor

# Apuntar el emisor a la IP de la VM 2:
sudo nano /etc/deliverygo/emisor-pedidos.env      # RECEPTOR_URL=http://IP_DE_LA_VM2:8082
sudo systemctl restart deliverygo-emisor
```

> **Sin internet en las VMs:** compilá en tu PC (`mvn clean package`) y copiá la carpeta con los JAR ya generados (`scp -r prueba-integracion usuario@IP:`). Instalá con `sudo REUSAR_JAR=1 ./despliegue/instalar-debian.sh <rol>` para que use el JAR de `target/` sin compilar. Igual necesita `default-jre-headless` instalado.

### Actualizar una VM a una versión nueva de la branch

```bash
git -C ~/WebServices_APIs_TPO pull
sudo ~/WebServices_APIs_TPO/prueba-integracion/despliegue/instalar-debian.sh receptor   # o emisor
```

El instalador detecta que el código es más nuevo que el JAR de `target/` y **recompila solo**. Antes del 27/10 reusaba el JAR viejo y la VM quedaba con la versión anterior aunque el `git pull` hubiera funcionado. El `.env` se conserva: si es la primera vez que se instala el emisor, revisá `RECEPTOR_URL`.

### Comandos del día a día

```bash
sudo systemctl status deliverygo-emisor        # ¿está corriendo?
sudo systemctl restart deliverygo-emisor       # aplicar cambios del .env
journalctl -u deliverygo-emisor -f             # ver logs en vivo
journalctl -u deliverygo-emisor | grep <correlationId>
sudo ./despliegue/instalar-debian.sh emisor    # actualizar el JAR (conserva el .env)
```

---

## 4. Probar la integración

### Opción A - Script completo (recomendado)

Desde **cualquier PC** de la red (o desde una de las VMs):

```bash
./despliegue/probar-integracion.sh http://IP_VM1:8081 http://IP_VM2:8082
```

Resultado esperado:

```
1. Ping desde esta PC
  [OK]    http://10.89.0.3:8081 -> módulo pedidos en vm-emisor (me vio como 10.89.0.3)
  [OK]    http://10.89.0.2:8082 -> módulo notificaciones en vm-receptor (me vio como 10.89.0.3)
2. El emisor llega al receptor
  [OK]    Diagnóstico completo OK (DNS, TCP, HTTP, contrato)
3. Crear pedido en el emisor
  [OK]    Pedido 1 creado, total 19500 ARS
  [OK]    El emisor informa la notificación como ENVIADA (id en el receptor: 2)
4. Verificar en el receptor (sin pasar por el emisor)
  [OK]    El receptor tiene la notificación: "Tu pedido #1 por $ 19500 fue creado y está pendiente de pago."
  [OK]    Mismo correlationId en ambas VMs (prueba-20261018-002709-14111)
  [OK]    El receptor vio la petición venir de 10.89.0.3 (debería ser la IP del emisor)
5. Error normalizado
  [OK]    404 con {timestamp, status, code, message, path, correlationId}
RESULTADO: integración OK
```

### Opción B - VS Code

1. Instalá la extensión **REST Client** (`humao.rest-client`).
2. Abrí `pruebas.http`.
3. Cambiá `@emisor` y `@receptor` por las IPs de tus VMs.
4. Tocá **Send Request** en cada bloque.

### Opción C - Página web del emisor

Abrí `http://IP_VM1:8081/` en el navegador:
- **Nuevo pedido:** elegí cliente, comercio y productos, y tocá *Confirmar pedido*.
- **Pedidos:** la lista se actualiza sola. Los `FALLIDA` tienen el botón *Reintentar*; los `ENVIADA`, *Verificar en receptor*, que muestra lo que guardó la otra CT.
- **Estado del receptor:** la píldora de arriba a la derecha. Tocándola, ves el diagnóstico paso a paso.

### Opción C2 - Página web del receptor (donde se modifica)

Abrí `http://IP_VM2:8082/`:
- **Canales** (arriba a la derecha): tocá `EMAIL` para marcarlo **caído**. Los pedidos nuevos del emisor llegan, pero quedan `FALLIDA` en el receptor. Volvé a ponerlo operativo y tocá **Reintentar** en la tabla.
- **Plantillas:** creá una nueva (`POST /api/v1/templates`) o editá una existente. Los `{datos}` que exige se deducen del título y del texto. Editar no cambia el historial; desactivar hace que el emisor reciba `422 PLANTILLA_INACTIVA`.
- **Notificaciones recibidas:** todo lo que llegó, de qué IP y con cuántos intentos.
- **Vista del Portal:** id de usuario `2` = `cliente@gmail.com` del login de prueba del Portal. Muestra las tarjetas y el JSON exacto de `GET /api/v1/users/2/notifications`.

**Recorrido para ver el efecto entre las dos PCs:**
1. En el receptor, editá `PEDIDO_CREADO` (ej. cambiá el título).
2. En el emisor, creá un pedido con cliente `2`.
3. En el receptor, la *Vista del Portal* muestra el texto nuevo, llegado desde la IP del emisor.
4. Poné `EMAIL` caído y repetí: el emisor dice que el receptor lo recibió, pero el receptor lo tiene `FALLIDA` → *Reintentar*.
5. Desactivá `PEDIDO_CREADO` y creá otro pedido: el emisor lo muestra `FALLIDA` con `422 PLANTILLA_INACTIVA`. Reactivala y usá *Reintentar* en el emisor.

### Opción C3 - Ver las páginas desde fuera de la red (Tailscale + túnel SSH)

Las CTs están en `vmbr1`, detrás de OPNsense, y el miniserver **no publica** la red `192.168.1.x` en Tailscale. Desde una PC que sólo está conectada por Tailscale se entra con un túnel SSH a través del miniserver:

```bash
ssh -N -L 8081:192.168.1.197:8081 -L 8082:192.168.1.114:8082 root@100.64.222.75
```

Con esa terminal abierta: **http://localhost:8081** (emisor, para hacer pedidos) y **http://localhost:8082** (receptor). Al cerrarla, el acceso se corta. Si el navegador no conecta, el miniserver no tiene IP en `192.168.1.x` (`ip -4 -br addr`) y hay que hacer el túnel por OPNsense o instalar Tailscale en la CT.

### Opción D - Swagger

- `http://IP_VM1:8081/swagger-ui.html`
- `http://IP_VM2:8082/swagger-ui.html`

---

## 5. Diagnosticar defectos de las VMs

Hay tres herramientas. Conviene usarlas en este orden:

### 5.1 `GET /api/v1/diagnostico` (en el emisor)

Prueba la red hacia el receptor **capa por capa**. Se detiene en el primer paso que falla, así que ese paso es el problema:

| Paso | Qué prueba | Si falla, el problema está en... |
|---|---|---|
| 1. Configuración | ¿`RECEPTOR_URL` es una URL válida? ¿apunta a `localhost`? | El `.env` del emisor |
| 2. DNS | ¿El nombre se traduce a IP? | DNS / `/etc/hosts` (usar IPs evita esto) |
| 3. TCP | ¿La VM acepta conexiones en ese puerto? | VM apagada, IP errónea, firewall, servicio caído |
| 4. HTTP ping | ¿Responde **el receptor** y no otro servicio? | Puerto equivocado |
| 5. Contrato | ¿Acepta un `POST` real con el DTO acordado? | Versiones/DTO distintos, receptor lento o con errores |

Devuelve `200` si todo está bien y `503` si algo falló (útil para scripts). Cada paso trae `detalle` y `sugerencia`.

### 5.2 `despliegue/diagnostico-vm.sh` (en cada VM)

```bash
./despliegue/diagnostico-vm.sh                    # revisa esta VM
./despliegue/diagnostico-vm.sh 192.168.1.22 8082  # + conectividad hacia la otra VM
```

Revisa:
- RAM y disco;
- IPs, gateway y `machine-id`;
- DNS y hora;
- versión de Java;
- servicio activo y puerto escuchando, incluso si quedó atado a `127.0.0.1`;
- el diagnóstico del emisor;
- ufw, nftables y un recordatorio del Firewall de Proxmox;
- hacia la otra VM: ruta, ping, ARP, puerto TCP y `/api/v1/ping`.

No modifica nada. Con `sudo` muestra más detalle.

### 5.3 `despliegue/probar-integracion.sh` (desde cualquier PC)

Es la prueba de punta a punta de la sección 4. Usa un `correlationId` único para encontrar la operación en los logs de ambas VMs.

---

## 6. Tabla de defectos comunes

| Síntoma (lo que reporta la prueba) | Causa probable | Cómo se arregla |
|---|---|---|
| `3. TCP` → `Connect timed out` / `TIMEOUT_CONEXION` | VM receptora apagada, IP inexistente, VLAN/bridge distinto, firewall que **descarta** | `ping IP`; revisar bridge y VLAN tag en Proxmox; Firewall de Proxmox (3 niveles); `ufw status` |
| `3. TCP` → `Connection refused` / `CONEXION_RECHAZADA` | La VM existe pero **nada escucha** en ese puerto | En la receptora: `systemctl status deliverygo-receptor`, `ss -tlnp`, `PUERTO` del `.env` |
| `diagnostico-vm.sh`: "Escucha sólo en 127.0.0.1" | `HOST=127.0.0.1` en el `.env` | `HOST=0.0.0.0` y `systemctl restart` |
| `NoRouteToHost` / `SIN_RUTA` | Otra subred, gateway o máscara errónea | `ip a`, `ip route`; poner las VMs en la misma subred |
| `2. DNS` falla / `HOST_DESCONOCIDO` | Se usó un nombre que no resuelve | Usar la IP en `RECEPTOR_URL` o agregarla a `/etc/hosts` |
| `4. HTTP ping`: "Respondió otro servicio" | `RECEPTOR_URL` apunta a otro puerto o servicio | Corregir el puerto (receptor = 8082) |
| `5. Contrato` → `TIMEOUT_LECTURA` (504) | El receptor conecta pero responde lento | CPU/RAM de la VM, `journalctl`, ¿`SIMULAR_DEMORA_MS` activo? |
| `RESPUESTA_ERROR` 404 | La versión desplegada no tiene la ruta | Reinstalar con el script en ambas VMs |
| `RESPUESTA_ERROR` 400/422 | Los módulos no usan el mismo contrato | Comparar DTO y versión de ambos lados |
| Dos VMs con la **misma IP** | Clones con el mismo `machine-id` | Regenerar el `machine-id` (sección 2) |
| `RECEPTOR_URL` con `localhost` | Se dejó el valor local | Poner la IP de la VM receptora |
| El servicio no arranca | Java < 17, RAM insuficiente, puerto ocupado | `journalctl -u deliverygo-... -n 50`, `java -version`, `ss -tlnp` |
| Funciona entre VMs pero no desde el navegador del Portal | CORS | `CORS_ORIGENES=http://IP_PORTAL:5173` en el `.env` |

---

## 7. Simular fallas

Para comprobar que el emisor maneja bien los problemas **sin romper nada a mano**, el receptor puede fallar a propósito. Se configura en `/etc/deliverygo/receptor-notificaciones.env` y después `sudo systemctl restart deliverygo-receptor`:

| Variable | Ejemplo | Efecto esperado en el emisor |
|---|---|---|
| `SIMULAR_DEMORA_MS` | `8000` | Supera el timeout de lectura (5 s): `TIMEOUT_LECTURA`, reintento → `504` |
| `SIMULAR_FALLA_PORCENTAJE` | `50` | La mitad de las notificaciones responden `503 FALLA_SIMULADA` |
| `CANALES_CAIDOS` | `EMAIL` | El receptor acepta (`201`) pero la notificación queda `FALLIDA` hasta reintentarla. También se cambia en caliente desde la página |

Otras pruebas útiles:
- `sudo systemctl stop deliverygo-receptor`: el emisor crea el pedido con la notificación `FALLIDA` (`CONEXION_RECHAZADA`).
- Levantar el receptor y hacer `POST /api/v1/orders/{id}/notify`: pasa a `ENVIADA` sin duplicar.

**Volvé a poner las dos variables en `0` al terminar.**

---

## 8. API: endpoints y contratos

### Emisor - Pedidos (`:8081`)

| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| `POST` | `/api/v1/orders` | Crea el pedido y notifica al receptor | `201`, `400` |
| `GET` | `/api/v1/orders/{id}` | Consulta un pedido | `200`, `404` |
| `GET` | `/api/v1/orders` | Lista pedidos | `200` |
| `POST` | `/api/v1/orders/{id}/notify` | Reintenta la notificación | `200`, `503`, `504` |
| `GET` | `/api/v1/orders/{id}/verificacion` | Pregunta al receptor qué guardó para ese pedido | `200`, `404`, `409`, `503`, `504` |
| `GET` | `/api/v1/diagnostico` | Diagnóstico de red hacia el receptor. Con `?contrato=false` no escribe en el receptor | `200`, `503` |
| `GET` | `/` | Página web para cargar y verificar pedidos | `200` |
| `GET` | `/api/v1/ping` | Identifica la VM | `200` |

**Request `POST /api/v1/orders`** (basado en el ejemplo de la consigna):
```json
{
  "userId": "u-42",
  "merchantId": "m-1",
  "deliveryAddressId": "d-9",
  "items": [{ "productId": "p-1", "quantity": 2, "unitPrice": 7800 }]
}
```

**Response `201`:**
```json
{
  "id": 1, "userId": "u-42", "merchantId": "m-1", "status": "BORRADOR",
  "total": 15600, "currency": "ARS", "createdAt": "2026-10-18T00:18:29Z",
  "items": [...],
  "notification": {
    "status": "ENVIADA", "notificationId": 2, "attempts": 1,
    "lastError": null, "receptorUrl": "http://192.168.1.22:8082"
  }
}
```

### Receptor - Notificaciones (`:8082`)

| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| `POST` | `/api/v1/notifications` | Recibe una solicitud de notificación | `201` nueva, `200` repetida (idempotencia), `400`, `422`, `503` simulado |
| `GET` | `/api/v1/notifications/{id}` | Consulta una notificación | `200`, `404` |
| `GET` | `/api/v1/notifications` | Lista todas (para la prueba) | `200` |
| `GET` | `/api/v1/users/{id}/notifications` | Historial de un usuario (lo que consume el Portal) | `200` |
| `POST` | `/api/v1/notifications/{id}/retry` | **Obligatorio.** Reintenta la entrega de una `FALLIDA` (máximo `MAX_INTENTOS`) | `200`, `404`, `409` ya enviada, `422` reintentos agotados |
| `POST` | `/api/v1/templates` | **Obligatorio.** Crea una plantilla | `201`, `400`, `409` código repetido |
| `GET` | `/api/v1/templates` · `/api/v1/templates/{code}` | Lista / consulta plantillas (extensión) | `200`, `404` |
| `PUT` | `/api/v1/templates/{code}` | Edita o desactiva (extensión; no hay DELETE porque el historial usa el código) | `200`, `400`, `404` |
| `GET` · `PUT` | `/api/v1/channels` · `/api/v1/channels/{canal}` | **Sólo simulación:** canal operativo o caído | `200`, `400` |
| `GET` | `/` | Página web del receptor | `200` |
| `GET` | `/api/v1/ping` | Identifica la VM | `200` |

**Request `POST /api/v1/notifications`** (lo que manda el emisor):
```json
{
  "recipientId": "u-42",
  "channel": "EMAIL",
  "template": "PEDIDO_CREADO",
  "data": { "orderId": 1, "total": 15600 },
  "sourceModule": "pedidos",
  "referenceId": "1"
}
```
- **Headers:** `X-Correlation-Id` (seguimiento) e `Idempotency-Key` (para que un reintento no duplique).
- `channel`: `EMAIL` | `PUSH` | `INTERNA`.
- `template`: código de una plantilla **activa**. Vienen cargadas `PEDIDO_CREADO` (requiere `orderId`, `total`), `PEDIDO_CONFIRMADO` (requiere `orderId`) y `PRUEBA_CONEXION`; se agregan con `POST /api/v1/templates`. Si no existe → `422 PLANTILLA_INVALIDA`; si está desactivada → `422 PLANTILLA_INACTIVA`; si faltan datos → `422 DATOS_INCOMPLETOS`; si el mensaje armado supera 500 caracteres → `422 MENSAJE_DEMASIADO_LARGO`.

**Response `201`** (los campos `type`, `title`, `action`, `attempts` y `failureReason` son los que necesita el Portal):
```json
{
  "id": 3, "recipientId": "2", "channel": "EMAIL", "template": "PEDIDO_CREADO",
  "type": "PEDIDO", "title": "¡Recibimos tu pedido #2!",
  "message": "Pedido #2 por $ 7800. Te avisamos cuando el comercio lo confirme.",
  "action": "Ver pedido", "status": "ENVIADA", "attempts": 1, "failureReason": null,
  "sourceModule": "pedidos", "referenceId": "2", "correlationId": "...",
  "originIp": "10.89.50.12", "receivedAt": "2026-10-21T00:03:47Z"
}
```

**Request `POST /api/v1/templates`:**
```json
{ "code": "PROMO_JUEVES", "type": "PROMOCION", "title": "{pct}% OFF",
  "text": "Hoy {pct}% en {comercio}.", "action": "Pedir" }
```

### Error normalizado (ambos módulos)

```json
{
  "timestamp": "2026-10-18T00:18:30.058Z",
  "status": 422,
  "code": "PLANTILLA_INVALIDA",
  "message": "La plantilla 'NO_EXISTE' no existe. Válidas: PEDIDO_CREADO, PEDIDO_CONFIRMADO, PRUEBA_CONEXION",
  "path": "/api/v1/notifications",
  "correlationId": "0a831cbd-557f-4d96-a0bd-2d5ea1f6c53d"
}
```

| Código | HTTP | Cuándo |
|---|---|---|
| `VALIDACION` | 400 | Faltan campos o tienen formato inválido |
| `JSON_INVALIDO` | 400 | El cuerpo no es JSON |
| `PARAMETRO_INVALIDO` | 400 | Ej. `/orders/abc` |
| `PEDIDO_INEXISTENTE` / `NOTIFICACION_INEXISTENTE` | 404 | Id que no existe |
| `RUTA_INEXISTENTE` | 404 | URL mal escrita |
| `PLANTILLA_INVALIDA` / `DATOS_INCOMPLETOS` | 422 | Regla de negocio de Notificaciones |
| `RECEPTOR_CONEXION_RECHAZADA`, `RECEPTOR_SIN_RUTA`, `RECEPTOR_HOST_DESCONOCIDO`, `RECEPTOR_RESPUESTA_ERROR` | 503 | Reintento fallido |
| `RECEPTOR_TIMEOUT_CONEXION`, `RECEPTOR_TIMEOUT_LECTURA` | 504 | Reintento fallido por tiempo |
| `FALLA_SIMULADA` | 503 | `SIMULAR_FALLA_PORCENTAJE` activo |
| `ERROR_INTERNO` | 500 | Error no previsto (el detalle queda sólo en el log) |

---

## 9. Configuración (variables de entorno)

Se editan en `/etc/deliverygo/<modulo>.env`; los valores de ejemplo están en `despliegue/*.env.ejemplo`. Después de cambiarlas: `sudo systemctl restart deliverygo-<rol>`.

| Variable | Módulo | Defecto | Descripción |
|---|---|---|---|
| `PUERTO` | ambos | 8081 / 8082 | Puerto HTTP |
| `HOST` | ambos | `0.0.0.0` | Interfaz donde escucha (`0.0.0.0` = toda la red) |
| `RECEPTOR_URL` | emisor | `http://localhost:8082` | **IP:puerto de la VM receptora** |
| `RECEPTOR_TIMEOUT_CONEXION_MS` | emisor | `3000` | Máximo para abrir la conexión TCP |
| `RECEPTOR_TIMEOUT_LECTURA_MS` | emisor | `5000` | Máximo para recibir la respuesta |
| `CORS_ORIGENES` | ambos | `*` | Orígenes permitidos para el Portal React |
| `SIMULAR_DEMORA_MS` | receptor | `0` | Demora artificial (ms) |
| `SIMULAR_FALLA_PORCENTAJE` | receptor | `0` | % de respuestas 503 a propósito |
| `MAX_INTENTOS` | receptor | `3` | Tope de intentos de entrega, contando el primero |
| `CANALES_CAIDOS` | receptor | vacío | Canales que arrancan caídos (ej. `EMAIL`). En memoria: al reiniciar vuelve a este valor |
| `DB_URL` | ambos | H2 en archivo en `/var/lib/deliverygo/<modulo>/datos/` | Base propia del módulo. El receptor usa `notificaciones-v2` desde que las plantillas son una tabla; la base vieja queda al lado sin tocar |
| `H2_CONSOLA` | ambos | `false` | Consola web de H2 en `/h2-console` |
| `H2_CONSOLA_REMOTA` | ambos | `false` | Permite abrir la consola desde otra PC |

> **Seguridad:** la consola H2 permite ejecutar SQL y código en la VM. Viene apagada. Si la necesitás, activala sólo con `H2_CONSOLA=true` y accedé desde la misma VM o por túnel SSH (`ssh -L 8082:localhost:8082 usuario@IP`). Evitá `H2_CONSOLA_REMOTA=true` salvo en una red aislada.

---

## 10. Cómo está hecho el código

```
prueba-integracion/
├── pom.xml                          ← agrupa los dos módulos (Spring Boot 3.5.16, Java 17+)
├── emisor-pedidos/
│   └── src/main/java/ar/edu/uade/api/deliverygo/pedidos/
│       ├── controller/   PedidoController, DiagnosticoController, PingController
│       ├── service/      PedidoService (orquesta), DiagnosticoService (DNS→TCP→HTTP→contrato)
│       ├── client/       NotificacionesClient (ÚNICA clase que habla con el receptor) + DTO propios
│       ├── domain/       Pedido, ItemPedido, EstadoPedido, EstadoNotificacion (JPA)
│       ├── repository/   PedidoRepository (Spring Data)
│       ├── dto/          CrearPedidoRequest, PedidoResponse, DiagnosticoResponse, ErrorResponse
│       ├── mapper/       PedidoMapper (entidad → DTO)
│       ├── exception/    ApiException, GlobalExceptionHandler
│       ├── config/       CorrelationIdFilter, RestClientConfig (timeouts), ReceptorProperties, WebConfig
│       └── (resources/static/) index.html, estilos.css, app.js  ← página web
├── receptor-notificaciones/
│   └── src/main/java/ar/edu/uade/api/deliverygo/notificaciones/
│       ├── controller/   NotificacionController, PingController
│       ├── service/      NotificacionService (validación, idempotencia, simulación)
│       ├── domain/       Notificacion, Plantilla, Canal, EstadoEnvio (JPA)
│       └── ...           repository, dto, mapper, exception, config (igual estructura)
├── docs/
│   ├── guia-completa-proxmox.md     ← guía detallada de implementación y pruebas
│   └── especificacion-y-auditoria-modulos.md  ← especificación de cada módulo + checklist de auditoría
├── despliegue/
│   ├── instalar-debian.sh           ← instala un módulo como servicio systemd
│   ├── diagnostico-vm.sh            ← revisa la VM y la conectividad
│   ├── probar-integracion.sh        ← prueba de punta a punta desde cualquier PC
│   └── emisor.env.ejemplo / receptor.env.ejemplo
└── pruebas.http                     ← peticiones para VS Code (REST Client)
```

Es la estructura sugerida por la consigna: `controller/service/repository/domain/dto/mapper/exception/config`.

### Decisiones técnicas (para el acta de decisiones)

| Decisión | Por qué |
|---|---|
| **Los módulos no comparten clases.** El emisor tiene su propio `NotificacionRemotaRequest` | Cada equipo es independiente; sólo comparten el formato JSON (regla: "los DTO externos no se reutilizan como entidades JPA") |
| **`@JsonIgnoreProperties(ignoreUnknown = true)`** en lo que lee el emisor | Si el receptor agrega campos, el emisor no se rompe (evolución compatible del contrato) |
| **Timeouts explícitos** (3 s conexión, 5 s lectura) | Sin timeouts, una VM caída cuelga los hilos del emisor indefinidamente |
| **La llamada HTTP se hace fuera de una transacción** | Una VM lenta no mantiene abierta una transacción de la base |
| **Falla parcial:** el pedido se guarda aunque falle la notificación | La consigna pide "manejar fallos parciales"; la notificación se reintenta después |
| **`Idempotency-Key = pedido-{id}-PEDIDO_CREADO`** | Reintentar el mismo pedido no crea notificaciones duplicadas |
| **`X-Correlation-Id`** viaja entre VMs y se loguea en cada línea | Permite seguir UNA operación en los logs de las dos máquinas |
| **Clasificación de errores de red** (`ReceptorException.Tipo`) | Distinguir timeout de conexión, conexión rechazada, sin ruta o DNS dice exactamente qué revisar en la VM |
| **H2 en archivo** por módulo | Base propia, sin instalar un servidor de base, y los datos sobreviven a un reinicio |
| **Java 17** como mínimo | Es el que trae Debian 12 por `apt`; también corre en 21 y 25 |
| **systemd + usuario sin privilegios** | Arranca solo con la VM, se reinicia si se cae, y no corre como root |

### Tests automáticos

```bash
mvn test
```

- `NotificacionesClientTest` (emisor): abre sockets reales para provocar **conexión rechazada**, **timeout de lectura** y **host desconocido**, y verifica que se clasifiquen bien.
- `NotificacionControllerTest` (receptor): contrato HTTP completo (`201` y mensaje armado, idempotencia `201`→`200`, `422` normalizado, `400` de validación) con H2 en memoria.
- `PlantillasYReintentosTest` (receptor): crear, usar, editar y desactivar plantillas; el historial no cambia al editar; canal caído → `FALLIDA` → reintento → `ENVIADA`; tope de reintentos; importes `7800.0` → `7800`; `data` largo → `422` (antes `500`); **dos POST simultáneos con la misma `Idempotency-Key`** → `201` + `200` y una sola fila (antes uno daba `500`; se comprobó que sin la corrección el test falla).
- `FallaSimuladaTest` (receptor): con `SIMULAR_FALLA_PORCENTAJE=100`, la repetición de algo ya guardado devuelve `200` y no la falla simulada.

---

## 11. Desarrollo local

Con Java 17+ y Maven:

```bash
cd prueba-integracion
mvn clean package
java -jar receptor-notificaciones/target/receptor-notificaciones.jar          # :8082
RECEPTOR_URL=http://localhost:8082 java -jar emisor-pedidos/target/emisor-pedidos.jar   # :8081
./despliegue/probar-integracion.sh http://localhost:8081 http://localhost:8082
```

---

## 12. Qué se verificó y qué no

**Verificado:**

| Prueba | Resultado |
|---|---|
| `mvn package` con los 19 tests | ✅ BUILD SUCCESS |
| **Dos contenedores con Java 17** (imagen `eclipse-temurin:17-jre`) en una red propia, IPs `10.89.50.11` (receptor) y `.12` (emisor): `probar-integracion.sh` completo | ✅ |
| Entre esos dos contenedores: editar plantilla → pedido del emisor → texto nuevo en `GET /users/2/notifications`; canal caído → `FALLIDA` → reintento `ENVIADA`; plantilla desactivada → el emisor recibe `422` y queda `FALLIDA` → reactivar → reintento del emisor `ENVIADA`; datos conservados tras reiniciar | ✅ |
| Página del receptor abierta en Chromium (sin pantalla): carga plantillas, canales, notificaciones y la *Vista del Portal*. Se corrigieron 2 defectos vistos en la captura (campos de edición visibles al crear, botón *Reintentar* oculto por el scroll) | ✅ |
| Local: flujo completo, validación 400, JSON roto, 422, 404, idempotencia, persistencia tras reinicio | ✅ |
| Local: receptor caído → pedido creado con notificación `FALLIDA` → reintento `503` → receptor arriba → reintento `ENVIADA` | ✅ |
| Local: receptor lento (7 s) → `TIMEOUT_LECTURA`, reintento `504` | ✅ (este caso encontró y corrigió un bug de clasificación) |
| Local: IP inexistente → `TIMEOUT_CONEXION` en 3 s; host inválido → DNS; puerto del emisor → "otro servicio" | ✅ |
| **Dos contenedores Debian 13 con systemd en una red propia (IPs distintas)**, simulando dos VMs: instalación con `instalar-debian.sh` (uno con el JAR listo y otro **compilando con Maven en la VM**), servicio systemd, `diagnostico-vm.sh`, `probar-integracion.sh` | ✅ |
| `diagnostico-vm.sh` detecta `RECEPTOR_URL` errónea y el receptor atado a `127.0.0.1` | ✅ (este caso encontró y corrigió un bug con el formato `[::ffff:127.0.0.1]`) |
| Reinstalar es idempotente (conserva el `.env`) | ✅ |
| `shellcheck` sin advertencias en los 3 scripts | ✅ |
| **Proxmox real (27/10):** versión `3dd1c57` en la CT 301 (receptor, `192.168.1.114`) y la CT 302 (emisor, `192.168.1.197`), Debian 13 con Java 21. Receptor con la plantilla `PEDIDO_CREADO` activa; el receptor ve llegar al emisor desde `192.168.1.197`; páginas abiertas desde otra PC por Tailscale + túnel SSH | ✅ |

**Despliegue del 27/10 en Proxmox, paso a paso** (para repetirlo o auditarlo):

| # | Dónde | Qué se hizo | Por qué |
|---|---|---|---|
| 1 | PC | `git push` de `3dd1c57` a `feature/prueba-integracion-proxmox` | Las CTs se actualizan desde GitHub y el commit sólo estaba en la PC |
| 2 | CT 302 y 301 | `git -C /root/WebServices_APIs_TPO pull` (`0db0e07..3dd1c57`) | El repo de cada CT está en `/root/WebServices_APIs_TPO`, no en la carpeta de inicio |
| 3 | CT 302 y 301 | `rm -rf .../<modulo>/target` + `instalar-debian.sh emisor` / `receptor` | Forzar la recompilación (el instalador de entonces reusaba el JAR viejo; ya está corregido) |
| 4 | CT 302 | `RECEPTOR_URL=http://192.168.1.114:8082` en `/etc/deliverygo/emisor-pedidos.env` + `systemctl restart deliverygo-emisor` | El `.env` se conserva entre instalaciones y no apuntaba al receptor |
| 5 | CT 302 | `probar-integracion.sh http://192.168.1.197:8081 http://192.168.1.114:8082` | Receptor OK; el emisor dio `HTTP 000` porque la prueba corrió durante su arranque. Ahora el script espera hasta 30 s |
| 6 | PC (Tailscale) | Túnel SSH por el miniserver (Opción C3) | La PC no está en la red `192.168.1.x` |

**No verificado todavía** (requiere tus VMs reales):
- **Proxmox real:** bridges, VLAN, Firewall de Proxmox. Los contenedores simulan la red, pero no esas capas.
- **Debian 12:** el camino de `apt` con Java 17. Java 17 ya se probó en contenedores, pero no la instalación con `instalar-debian.sh` sobre Debian 12.
- **`probar-integracion.sh` completo en verde en Proxmox:** el 27/10 la primera corrida falló en el emisor por el arranque; repetirla y guardar la salida como evidencia.
- **IPs fijas:** las CTs siguen por DHCP; si cambian, hay que corregir `RECEPTOR_URL` y el túnel.
- **Clicks reales en la página:** se verificó que carga y dibuja; las acciones se probaron por API (las mismas rutas que usa la página), no con clicks.
- **`ufw` activo:** el script lo contempla, pero no se probó con `ufw` encendido.

---

## 13. Limitaciones

- **Sin autenticación JWT.** El emisor no manda `Authorization` y el receptor no lo exige. Se agrega cuando esté el Módulo Usuarios.
- **Sin Catálogo:** el precio lo manda el cliente (`unitPrice`). En el sistema real lo confirma Catálogo.
- **No se envían emails reales:** la entrega se simula; sólo falla si el canal está marcado caído.
- **"ENVIADA" significa dos cosas distintas.** En el emisor: "el módulo Notificaciones la recibió". En el receptor: "se entregó al usuario". Con un canal caído el emisor muestra `ENVIADA` y el receptor `FALLIDA`. Conviene renombrar la del emisor (ej. `RECIBIDA`) cuando se acuerde el contrato.
- **"Leída" no existe en el contrato del Equipo 6.** El Portal la maneja de su lado; si se quiere persistir hay que acordar un endpoint nuevo.
- **Los reintentos del receptor son manuales** (página o `POST /retry`); no hay reintento automático programado.
- **H2 es para pruebas.** Para la entrega conviene PostgreSQL o MySQL, cambiando `DB_URL` y el driver.
- **Mocks declarados:** si se usa en el Demo Day, aclarar que es una prueba de infraestructura y no la integración final (la consigna pide declarar las integraciones simuladas).

---

## 14. Cómo lo consume el Portal

El Portal (`src/` en `feature/facundo`) **no se modificó**. Hoy su Centro de Notificaciones usa datos fijos. Cuando se conecte, lo que tiene que leer es `GET /api/v1/users/{id}/notifications` del receptor, y el mapeo es:

| Campo del receptor | Campo de la tarjeta del Portal (`NotificationCard`) | Nota |
|---|---|---|
| `type` (`PEDIDO`/`PROMOCION`/`SISTEMA`) | `type` (`order`/`promo`/`system`) e ícono | Traducción en el Portal |
| `title` | `title` | Viene de la plantilla, ya completado |
| `message` | `description` | |
| `receivedAt` | `time` ("Hace 6 minutos") | El Portal lo formatea |
| `status` | `badge` | |
| `action` | `action.label` | El destino del botón lo decide el Portal |
| — | `read` | **No existe en el contrato.** El Portal lo maneja localmente |

Para que se vea en el Portal hacen falta, del lado del front y a cargo de quien mantenga `feature/facundo`: un servicio de notificaciones que llame a esa ruta con el id del usuario logueado (`id: 2` en el login de prueba), y la URL del receptor (o del gateway) en la configuración. El CORS del receptor ya acepta cualquier origen (`CORS_ORIGENES=*`).

---

## 15. ¿Hace falta un programa para controlar las PCs?

**Para dos PCs, no.** Lo que hace falta ya existe:

| Necesidad | Con qué se resuelve |
|---|---|
| Instalar, actualizar, arrancar y parar | `instalar-debian.sh` + `systemctl` (y la interfaz de Proxmox para la CT) |
| ¿Se ven las dos máquinas? | `diagnostico-vm.sh` en cada CT y la píldora de estado de la página del emisor |
| Prueba de punta a punta con evidencia | `probar-integracion.sh` (sale con código ≠ 0 si algo falla) |
| Modificar datos y ver el efecto | Las dos páginas web |
| Provocar fallas | `CANALES_CAIDOS` / botón de canal, `SIMULAR_*`, `systemctl stop` |
| Seguir una operación entre máquinas | `X-Correlation-Id` + `journalctl ... \| grep <id>` |

**Cuándo sí conviene programarlo:** cuando haya 4 o más módulos (uno por compañero) y quieras repetir los mismos escenarios contra todos y guardar la evidencia. Ahí aporta un inventario (CT, IP, puerto y responsable por módulo) y un menú que corra salud + escenarios y deje un log con fecha. Programarlo antes de tener esos módulos es invertir en algo que la consigna no evalúa.
