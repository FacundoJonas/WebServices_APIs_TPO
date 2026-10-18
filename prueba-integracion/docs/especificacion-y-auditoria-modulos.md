# Especificación de los módulos de prueba y guía de auditoría

> **Branch:** `feature/prueba-integracion-proxmox` · **Carpeta:** `prueba-integracion/`
>
> **Para qué sirve:** es la **especificación de referencia** de los módulos de prueba: qué expone cada uno, con qué datos, qué reglas aplica y cómo se comporta ante errores. Sirve para **comparar ("interpolar")** lo que entreguen los compañeros contra esta referencia y contra la consigna del TPO, con un checklist y una plantilla de comparación.
>
> Complementa a `README.md` (referencia rápida) y a `docs/guia-completa-proxmox.md` (implementación en Proxmox).

---

## Índice

1. [Cómo usar este documento](#1-cómo-usar-este-documento)
2. [Mapa de los módulos](#2-mapa-de-los-módulos)
3. [Convenciones comunes a los dos módulos](#3-convenciones-comunes-a-los-dos-módulos)
4. [Ficha del módulo RECEPTOR (Notificaciones)](#4-ficha-del-módulo-receptor-notificaciones)
5. [Ficha del módulo EMISOR (Pedidos)](#5-ficha-del-módulo-emisor-pedidos)
6. [Ficha de la página web del emisor](#6-ficha-de-la-página-web-del-emisor)
7. [Contrato de integración Emisor → Receptor](#7-contrato-de-integración-emisor--receptor)
8. [Brecha entre la prueba y los contratos oficiales del TPO](#8-brecha-entre-la-prueba-y-los-contratos-oficiales-del-tpo)
9. [Checklist de auditoría para los módulos de los compañeros](#9-checklist-de-auditoría-para-los-módulos-de-los-compañeros)
10. [Pruebas de conformidad con `curl`](#10-pruebas-de-conformidad-con-curl)
11. [Plantilla de interpolación (por módulo recibido)](#11-plantilla-de-interpolación-por-módulo-recibido)
12. [Cómo enchufar un módulo real en lugar de uno de prueba](#12-cómo-enchufar-un-módulo-real-en-lugar-de-uno-de-prueba)
13. [Matriz de trazabilidad: consigna → prueba → evidencia](#13-matriz-de-trazabilidad-consigna--prueba--evidencia)

---

## 1. Cómo usar este documento

1. **Leé las fichas** (secciones 4 a 6) para entender exactamente cómo se comporta cada módulo de prueba. Son la "vara" contra la que se compara.
2. **Leé la brecha** (sección 8): la prueba **no** implementa todo el contrato oficial del TPO. Al auditar a un compañero, el contrato que manda es **el de la consigna**, no el de la prueba.
3. Cuando recibas un módulo de un compañero:
   - completá la **plantilla** de la sección 11;
   - recorré el **checklist** de la sección 9;
   - ejecutá las **pruebas de conformidad** de la sección 10 contra su API.
4. Si tiene que hablar con otro módulo, usá la sección 12 para probarlo contra los de prueba antes de integrarlo con el módulo real del otro equipo.

**Notación de las tablas:**

| Símbolo | Significado |
|---|---|
| ✅ | Implementado en la prueba |
| ❌ | No implementado en la prueba (sí lo pide la consigna) |
| ➕ | Agregado en la prueba (no lo pide la consigna) |
| ⚠️ | Implementado distinto, o ambigüedad a resolver entre los equipos |

---

## 2. Mapa de los módulos

| Módulo | Equipo del TPO que simula | Rol en la prueba | Puerto | Artefacto | Servicio systemd |
|---|---|---|---|---|---|
| `receptor-notificaciones` | 6 - Notificaciones | Recibe y guarda solicitudes de notificación | `8082` | `receptor-notificaciones.jar` | `deliverygo-receptor` |
| `emisor-pedidos` | 3 - Pedidos | Crea pedidos y le pide al receptor que notifique | `8081` | `emisor-pedidos.jar` | `deliverygo-emisor` |
| Página web | 8 - Portal (parcial) | Interfaz para cargar pedidos y verificar en el receptor | `8081` (la sirve el emisor) | dentro del JAR del emisor | — |

**Stack:** Java 17+ (probado en 21), Spring Boot 3.5.16, Spring Web, Spring Data JPA, Bean Validation, Actuator, springdoc-openapi 2.8.9 (Swagger), H2 en archivo, Maven.

**Paquetes:**
- `ar.edu.uade.api.deliverygo.notificaciones` (receptor)
- `ar.edu.uade.api.deliverygo.pedidos` (emisor)

Los módulos **no comparten código**: cada uno tiene sus propias clases, aunque se parezcan.

---

## 3. Convenciones comunes a los dos módulos

| Tema | Regla | Dónde está |
|---|---|---|
| Base URL | `/api/v1` | `@RequestMapping` de los controllers |
| Formato | `application/json`, UTF-8 | Spring Web |
| Identificadores | `Long` autoincremental | `@GeneratedValue(strategy = IDENTITY)` |
| Fechas | ISO-8601 en UTC (ej. `2026-10-18T03:33:44.123Z`) | `Instant` |
| Nombres de campos JSON | En inglés (contrato público, como el ejemplo de la consigna) | DTO `record` |
| Nombres internos (entidades, tablas) | En castellano | `domain/` |
| Correlación | Header `X-Correlation-Id`: si llega se reutiliza; si no, se genera un UUID. Se devuelve en la respuesta y aparece en cada línea de log como `[cid:...]` | `config/CorrelationIdFilter` |
| Error normalizado | `{timestamp, status, code, message, path, correlationId}` | `exception/GlobalExceptionHandler` |
| Validación | Bean Validation (`@Valid`). Junta todos los mensajes separados por `; ` | DTO de entrada |
| CORS | Rutas `/api/**`, orígenes de `CORS_ORIGENES` (defecto `*`), expone `X-Correlation-Id` | `config/WebConfig` |
| Documentación | Swagger UI en `/swagger-ui.html`, OpenAPI en `/v3/api-docs` | springdoc |
| Salud | `/actuator/health` con detalle | Actuator |
| Identificación | `GET /api/v1/ping` → módulo, hostname, IPs, puerto, versión de Java, uptime, hora, IP del cliente | `controller/PingController` |
| Configuración | Todo por variables de entorno (`${VAR:defecto}`) | `application.properties` + `/etc/deliverygo/*.env` |
| Persistencia | H2 en archivo `./datos/<modulo>`; `ddl-auto=update`; `open-in-view=false` | `application.properties` |
| Consola H2 | Apagada por defecto (`H2_CONSOLA=false`) | `application.properties` |

### 3.1 Códigos de error genéricos (los dos módulos)

| HTTP | `code` | Cuándo |
|---|---|---|
| 400 | `VALIDACION` | Falla alguna regla de `@Valid` (campo vacío, fuera de rango, formato) |
| 400 | `JSON_INVALIDO` | El cuerpo no es JSON parseable |
| 400 | `PARAMETRO_INVALIDO` | Un parámetro de la ruta tiene tipo incorrecto (ej. `/orders/abc`) |
| 404 | `RUTA_INEXISTENTE` | La URL no existe |
| 405 | `METODO_NO_PERMITIDO` | Método HTTP no soportado en esa ruta |
| 500 | `ERROR_INTERNO` | Error no previsto. El detalle sólo queda en el log, con el `correlationId` |

---

## 4. Ficha del módulo RECEPTOR (Notificaciones)

### 4.1 Responsabilidad

Recibir solicitudes de notificación de otros módulos, validarlas (destinatario, canal y plantilla válida), armar el mensaje, guardarlas en **su propia base** y responder con lo que guardó. No envía emails reales: la notificación queda `ENVIADA` al registrarse.

### 4.2 Configuración

| Variable | Defecto | Efecto |
|---|---|---|
| `PUERTO` | `8082` | Puerto HTTP |
| `HOST` | `0.0.0.0` | Interfaz donde escucha |
| `MODULO_NOMBRE` | `notificaciones` | Nombre en `/ping` (el emisor lo usa para confirmar que habla con el receptor) |
| `CORS_ORIGENES` | `*` | Orígenes permitidos |
| `DB_URL` / `DB_USUARIO` / `DB_CLAVE` | H2 `./datos/notificaciones` / `sa` / vacío | Base propia |
| `SIMULAR_DEMORA_MS` | `0` | Demora artificial antes de procesar un `POST` |
| `SIMULAR_FALLA_PORCENTAJE` | `0` | % de `POST` que responden `503 FALLA_SIMULADA` |
| `H2_CONSOLA` / `H2_CONSOLA_REMOTA` | `false` / `false` | Consola web de H2 |

### 4.3 Endpoints

| Método | Ruta | Request | Respuestas | Headers |
|---|---|---|---|---|
| `POST` | `/api/v1/notifications` | `CrearNotificacionRequest` | `201` nueva · `200` repetida (misma `Idempotency-Key`) · `400` · `422` · `503` simulado | Entrada: `Idempotency-Key` (opcional), `X-Correlation-Id`. Salida: `Location` (en 201), `X-Correlation-Id` |
| `GET` | `/api/v1/notifications/{id}` | — | `200` · `400` · `404 NOTIFICACION_INEXISTENTE` | `X-Correlation-Id` |
| `GET` | `/api/v1/notifications` | — | `200` lista, más reciente primero | — |
| `GET` | `/api/v1/users/{id}/notifications` | — | `200` lista del usuario, más reciente primero (vacía si no hay) | — |
| `GET` | `/api/v1/ping` | — | `200 PingResponse` | — |

### 4.4 DTO de entrada: `CrearNotificacionRequest`

| Campo | Tipo | Obligatorio | Validación | Mensaje si falla |
|---|---|---|---|---|
| `recipientId` | string | Sí | no vacío, máx. 100 | `recipientId es obligatorio` / `...admite hasta 100 caracteres` |
| `channel` | string | Sí | `EMAIL` \| `PUSH` \| `INTERNA` | `channel debe ser EMAIL, PUSH o INTERNA` |
| `template` | string | Sí | no vacío; debe existir (si no, `422`) | `template es obligatorio` |
| `data` | objeto | No | clave → valor; debe incluir los datos que pide la plantilla | — |
| `sourceModule` | string | No | máx. 50 | `sourceModule admite hasta 50 caracteres` |
| `referenceId` | string | No | máx. 100 | `referenceId admite hasta 100 caracteres` |

### 4.5 DTO de salida: `NotificacionResponse`

| Campo | Tipo | Ejemplo | Origen |
|---|---|---|---|
| `id` | number | `4` | Id en la base del receptor |
| `recipientId` | string | `"u-42"` | Request |
| `channel` | string | `"EMAIL"` | Request |
| `template` | string | `"PEDIDO_CREADO"` | Request |
| `message` | string | `"Tu pedido #3 por $ 19500 fue creado y está pendiente de pago."` | Armado con la plantilla |
| `status` | string | `"ENVIADA"` | Siempre `ENVIADA` al registrarse |
| `sourceModule` | string | `"pedidos"` | Request |
| `referenceId` | string | `"3"` | Request |
| `correlationId` | string | `"prueba-2026..."` | Header de la petición |
| `originIp` | string | `"192.168.1.197"` | IP desde la que llegó la petición |
| `receivedAt` | string ISO-8601 | `"2026-10-18T03:33:44.5Z"` | Hora de registro |

### 4.6 Reglas de negocio

| ID | Regla | Resultado si se incumple |
|---|---|---|
| RN-N1 | Destinatario, canal y plantilla son obligatorios | `400 VALIDACION` |
| RN-N2 | El canal debe ser `EMAIL`, `PUSH` o `INTERNA` | `400 VALIDACION` |
| RN-N3 | La plantilla debe existir | `422 PLANTILLA_INVALIDA` (lista las válidas) |
| RN-N4 | Deben venir los datos que requiere la plantilla | `422 DATOS_INCOMPLETOS` (lista los faltantes) |
| RN-N5 | **Idempotencia:** si llega la misma `Idempotency-Key`, no se crea otra; se devuelve la existente | `200` en vez de `201` |
| RN-N6 | Se registra la IP de origen y el `correlationId` (trazabilidad) | — |

**Orden de evaluación en `POST`:**
1. Validación del DTO (400).
2. Simulación de demora/falla.
3. Idempotencia (200).
4. Plantilla (422).
5. Datos de la plantilla (422).
6. Guardar (201).

> Consecuencia: una petición repetida con la misma clave devuelve `200` **aunque** ahora traiga otra plantilla. La clave manda.

### 4.7 Plantillas

| Plantilla | Datos requeridos | Texto |
|---|---|---|
| `PEDIDO_CREADO` | `orderId`, `total` | `Tu pedido #{orderId} por $ {total} fue creado y está pendiente de pago.` |
| `PEDIDO_CONFIRMADO` | `orderId` | `Tu pedido #{orderId} fue confirmado. ¡Ya lo están preparando!` |
| `PRUEBA_CONEXION` | — | `Mensaje de prueba de conexión entre máquinas virtuales.` |

### 4.8 Persistencia (tabla `notificacion`)

| Columna | Tipo | Restricción |
|---|---|---|
| `id` | bigint | PK, identity |
| `destinatario_id` | varchar | not null |
| `canal` | varchar (enum) | not null |
| `plantilla` | varchar (enum) | not null |
| `mensaje` | varchar(500) | not null |
| `modulo_origen` | varchar | — |
| `referencia_id` | varchar | — |
| `clave_idempotencia` | varchar | **unique** |
| `correlation_id` | varchar | — |
| `ip_origen` | varchar | — |
| `estado` | varchar (enum) | not null |
| `recibida_en` | timestamp | not null |

### 4.9 Errores propios

| HTTP | `code` | Cuándo |
|---|---|---|
| 404 | `NOTIFICACION_INEXISTENTE` | `GET /notifications/{id}` con id que no existe |
| 422 | `PLANTILLA_INVALIDA` | RN-N3 |
| 422 | `DATOS_INCOMPLETOS` | RN-N4 |
| 503 | `FALLA_SIMULADA` | `SIMULAR_FALLA_PORCENTAJE` > 0 |

### 4.10 Logs que deja

```
INFO [cid:<id>] ... NotificacionService : Notificación <n> recibida desde <ip> (módulo <origen>): <mensaje>
INFO [cid:<id>] ... NotificacionService : Solicitud repetida con Idempotency-Key=<k>: se devuelve la notificación <n>
WARN [cid:<id>] ... NotificacionService : SIMULACIÓN: demorando la respuesta <ms> ms
WARN [cid:<id>] ... NotificacionService : SIMULACIÓN: respondiendo 503 a propósito
```

---

## 5. Ficha del módulo EMISOR (Pedidos)

### 5.1 Responsabilidad

Crear pedidos, calcular su total en el servidor, guardarlos en **su propia base** y pedirle al receptor que notifique al usuario. Lleva el registro del resultado de esa integración (enviada, fallida, intentos, último error), permite reintentar y permite **verificar** en el receptor qué quedó guardado. Además diagnostica la red hacia el receptor.

### 5.2 Configuración

| Variable | Defecto | Efecto |
|---|---|---|
| `PUERTO` | `8081` | Puerto HTTP |
| `HOST` | `0.0.0.0` | Interfaz donde escucha |
| `MODULO_NOMBRE` | `pedidos` | Nombre en `/ping` |
| `RECEPTOR_URL` | `http://localhost:8082` | **Dónde está el receptor** |
| `RECEPTOR_TIMEOUT_CONEXION_MS` | `3000` | Máximo para abrir la conexión TCP |
| `RECEPTOR_TIMEOUT_LECTURA_MS` | `5000` | Máximo para recibir la respuesta |
| `CORS_ORIGENES` | `*` | Orígenes permitidos |
| `DB_URL` / `DB_USUARIO` / `DB_CLAVE` | H2 `./datos/pedidos` / `sa` / vacío | Base propia |
| `H2_CONSOLA` / `H2_CONSOLA_REMOTA` | `false` / `false` | Consola web de H2 |

### 5.3 Endpoints

| Método | Ruta | Request | Respuestas |
|---|---|---|---|
| `POST` | `/api/v1/orders` | `CrearPedidoRequest` | `201 PedidoResponse` (aunque la notificación falle) · `400` |
| `GET` | `/api/v1/orders` | — | `200` lista, más reciente primero |
| `GET` | `/api/v1/orders/{id}` | — | `200` · `400` · `404 PEDIDO_INEXISTENTE` |
| `POST` | `/api/v1/orders/{id}/notify` | — | `200` (enviada, o ya lo estaba) · `404` · `503`/`504 RECEPTOR_*` |
| `GET` | `/api/v1/orders/{id}/verificacion` | — | `200 VerificacionResponse` · `404` · `409 PEDIDO_SIN_NOTIFICACION` · `503`/`504 RECEPTOR_*` |
| `GET` | `/api/v1/diagnostico?contrato=true\|false` | — | `200` todo OK · `503` algún paso falló |
| `GET` | `/api/v1/ping` | — | `200 PingResponse` |
| `GET` | `/` | — | Página web (sección 6) |

### 5.4 DTO de entrada: `CrearPedidoRequest`

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| `userId` | string | Sí | no vacío |
| `merchantId` | string | Sí | no vacío |
| `deliveryAddressId` | string | No | — |
| `items` | lista | Sí | al menos 1 |
| `items[].productId` | string | Sí | no vacío |
| `items[].quantity` | entero | Sí | 1 a 99 |
| `items[].unitPrice` | decimal | Sí | > 0 (mín. 0.01) ⚠️ ver sección 8 |

### 5.5 DTO de salida: `PedidoResponse`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | number | Id del pedido |
| `userId`, `merchantId`, `deliveryAddressId` | string | Del request |
| `status` | string | Estado del pedido: siempre `BORRADOR` en la prueba |
| `total` | decimal | Suma de `quantity × unitPrice`, **calculada en el servidor** |
| `currency` | string | `ARS` |
| `createdAt` | ISO-8601 | Creación |
| `items[]` | lista | `productId`, `quantity`, `unitPrice` |
| `notification.status` | string | `PENDIENTE` \| `ENVIADA` \| `FALLIDA` |
| `notification.notificationId` | number/null | Id en la base del **receptor** |
| `notification.attempts` | entero | Intentos realizados |
| `notification.lastError` | string/null | `[TIPO] mensaje \| Sugerencia: ...` (máx. 500) |
| `notification.receptorUrl` | string | A dónde se intentó enviar |

### 5.6 DTO de salida: `VerificacionResponse` (lo que dice el receptor)

`orderId`, `notificationId`, `recipientId`, `message`, `status`, `originIp`, `correlationId`, `receivedAt`, `receptorUrl`.

Todos salvo `orderId` y `receptorUrl` se **leen del receptor** (`GET /api/v1/notifications/{id}`). No vienen de la base del emisor.

### 5.7 DTO de salida: `DiagnosticoResponse`

`ok`, `receptorUrl`, `timestamp` y `pasos[]`. Cada paso tiene `nombre`, `ok`, `ms`, `detalle`, `sugerencia` y `datos`.

| Paso | Qué prueba | Con `contrato=false` |
|---|---|---|
| 1. Configuración | `RECEPTOR_URL` válida; avisa si apunta a `localhost`/`127.*` | Sí |
| 2. DNS | Resolución del host | Sí |
| 3. TCP | Conexión al puerto, con el timeout de conexión | Sí |
| 4. HTTP ping | `GET /api/v1/ping` y que `module == "notificaciones"` | Sí |
| 5. Contrato | `POST` real con plantilla `PRUEBA_CONEXION` (**escribe** en el receptor) | **No** |

Se detiene en el primer paso que falla. `ok = true` sólo si se ejecutaron todos los pasos esperados (5 con contrato, 4 sin) y todos dieron OK.

### 5.8 Reglas de negocio

| ID | Regla |
|---|---|
| RN-P1 | El total se calcula en el servidor con los ítems; nunca se toma del cliente |
| RN-P2 | El pedido se guarda **antes** de notificar y **queda creado aunque la notificación falle** (falla parcial) |
| RN-P3 | La llamada al receptor se hace **fuera** de una transacción de base de datos |
| RN-P4 | **Idempotencia** hacia el receptor: `Idempotency-Key = pedido-{id}-PEDIDO_CREADO`, siempre igual para el mismo pedido |
| RN-P5 | Reintentar un pedido ya `ENVIADA` no vuelve a llamar al receptor |
| RN-P6 | Verificar exige que el pedido tenga `notificationId` (si no, `409`) |
| RN-P7 | Cada intento (bueno o malo) suma `attempts`; el error se guarda con tipo y sugerencia |
| RN-P8 | El `X-Correlation-Id` de la petición se reenvía al receptor |

### 5.9 Persistencia

**Tabla `pedido`:**

| Columna | Tipo | Restricción |
|---|---|---|
| `id` | bigint | PK, identity |
| `usuario_id` | varchar | not null |
| `comercio_id` | varchar | not null |
| `direccion_entrega_id` | varchar | — |
| `total` | decimal(12,2) | not null |
| `moneda` | varchar(3) | not null (`ARS`) |
| `estado` | varchar (enum) | not null |
| `creado_en` | timestamp | not null |
| `estado_notificacion` | varchar (enum) | not null |
| `notificacion_id` | bigint | — |
| `intentos_notificacion` | int | not null (tipo primitivo) |
| `ultimo_error_notificacion` | varchar(500) | — |

**Tabla `pedido_item`** (`@ElementCollection`): `pedido_id` (FK), `producto_id`, `cantidad`, `precio_unitario` decimal(12,2).

### 5.10 Clasificación de fallas hacia el receptor (`ReceptorException.Tipo`)

| Tipo | Causa técnica (raíz) | HTTP en reintento/verificación | Significado |
|---|---|---|---|
| `HOST_DESCONOCIDO` | `UnknownHostException` | 503 | DNS |
| `SIN_RUTA` | `NoRouteToHostException` | 503 | Red / gateway / subred |
| `CONEXION_RECHAZADA` | `ConnectException` | 503 | Nada escucha en ese puerto |
| `TIMEOUT_CONEXION` | `SocketTimeoutException` (connect) | **504** | VM apagada, IP inexistente, firewall que descarta |
| `TIMEOUT_LECTURA` | `SocketTimeoutException` (read) | **504** | Receptor lento o colgado |
| `RESPUESTA_ERROR` | `RestClientResponseException` (4xx/5xx) | 503 | El receptor respondió con error (se lee su `code`) |
| `OTRO` | Cualquier otra | 503 | — |

El `code` del error normalizado es `RECEPTOR_<TIPO>` (ej. `RECEPTOR_TIMEOUT_LECTURA`).

### 5.11 Errores propios

| HTTP | `code` | Cuándo |
|---|---|---|
| 404 | `PEDIDO_INEXISTENTE` | Id de pedido que no existe |
| 409 | `PEDIDO_SIN_NOTIFICACION` | Verificar un pedido que nunca se notificó |
| 503 / 504 | `RECEPTOR_<TIPO>` | Reintento o verificación con el receptor caído o con problemas |

### 5.12 Logs que deja

```
INFO [cid:<id>] ... PedidoService         : Pedido <n> creado por el usuario <u> (total $ <t>)
INFO [cid:<id>] ... NotificacionesClient  : Enviando notificación a <url> (Idempotency-Key=<k>)
INFO [cid:<id>] ... PedidoService         : Pedido <n> notificado: el receptor la guardó con id <m>
WARN [cid:<id>] ... PedidoService         : Pedido <n> creado SIN notificar: <motivo>
```

---

## 6. Ficha de la página web del emisor

### 6.1 Qué es

Una página estática (`index.html`, `estilos.css`, `app.js` en `emisor-pedidos/src/main/resources/static/`). La sirve el emisor en `http://IP_EMISOR:8081/`. HTML, CSS y JavaScript puros, **sin librerías externas**: funciona aunque la red no tenga internet.

### 6.2 Funciones

| Función | Qué hace | Endpoint que usa |
|---|---|---|
| Encabezado | Muestra hostname e IPs de la CT emisora | `GET api/v1/ping` |
| Estado del receptor | Píldora verde/roja; se actualiza cada 15 s **sin escribir** en el receptor | `GET api/v1/diagnostico?contrato=false` |
| Diagnóstico detallado | Al tocar la píldora: los pasos con detalle y sugerencia. "Prueba completa (con envío)" ejecuta los 5 pasos | `GET api/v1/diagnostico` |
| Nuevo pedido | Cliente, comercio y productos con `+`/`−`; total estimado; envía con un `X-Correlation-Id` propio (`web-AAAAMMDDhhmmss-xxxx`) | `POST api/v1/orders` |
| Resultado | Muestra si el receptor lo recibió, el motivo si falló y el `correlationId` | — |
| Lista de pedidos | Tabla con estado de la notificación; se actualiza cada 5 s (desactivable) | `GET api/v1/orders` |
| Reintentar | En los pedidos `FALLIDA` | `POST api/v1/orders/{id}/notify` |
| Verificar en receptor | En los pedidos `ENVIADA`: abre un diálogo con lo que guardó el receptor y 3 chequeos (destinatario = cliente, el mensaje menciona el pedido, estado `ENVIADA`) | `GET api/v1/orders/{id}/verificacion` |

### 6.3 Decisiones

- **Sólo habla con el emisor.** Para verificar en el receptor, el emisor hace de intermediario. Así la página funciona aunque el navegador no llegue a la CT del receptor (por ejemplo, con un solo *port forward*).
- **Rutas relativas** (`api/v1/...`). Funciona igual con IP directa o detrás de un *port forward*.
- **Seguridad:** todo dato del usuario se muestra con `textContent`, nunca con `innerHTML`. Se probó con `<img src=x onerror=alert(1)>` como nombre de cliente: se muestra como texto y no se ejecuta.
- **Catálogo de demostración** (3 comercios) fijo en `app.js`. ⚠️ En el TPO real lo provee el Módulo Catálogo (Equipo 2).

---

## 7. Contrato de integración Emisor → Receptor

### 7.1 Secuencia

```
Emisor                                                      Receptor
  │ 1. guarda Pedido (BORRADOR, notificación PENDIENTE)       │
  │ 2. POST {RECEPTOR_URL}/api/v1/notifications ────────────▶ │
  │    Content-Type: application/json                         │
  │    X-Correlation-Id: <el de la petición original>         │
  │    Idempotency-Key: pedido-<id>-PEDIDO_CREADO             │
  │    timeouts: conexión 3 s, lectura 5 s                    │
  │                                                           │ 3. valida → plantilla → guarda
  │ ◀──────────────────────────── 201 NotificacionResponse    │
  │ 4. guarda ENVIADA + notificationId                        │
  │    (si hubo excepción: FALLIDA + [TIPO] + sugerencia)     │
```

### 7.2 Mapeo de campos

| Dato en el emisor | Campo enviado al receptor | Valor |
|---|---|---|
| `pedido.usuarioId` | `recipientId` | igual |
| — | `channel` | `"EMAIL"` (fijo) |
| — | `template` | `"PEDIDO_CREADO"` (fijo) |
| `pedido.id` | `data.orderId` | número |
| `pedido.total` | `data.total` | decimal |
| — | `sourceModule` | `"pedidos"` |
| `pedido.id` | `referenceId` | texto |

| Campo leído de la respuesta | Se guarda en el emisor como |
|---|---|
| `id` | `pedido.notificacionId` |
| (cualquier 2xx) | `estadoNotificacion = ENVIADA` |

El emisor **ignora** los campos que no conoce (`@JsonIgnoreProperties(ignoreUnknown = true)`), así que el receptor puede agregar campos sin romper la integración.

### 7.3 Lo que el emisor exige del receptor

Esto es lo que debe cumplir **cualquier** módulo que reemplace al receptor de prueba:

1. `POST /api/v1/notifications` acepta el JSON de 7.2 y responde **2xx** con un JSON que tenga `id` numérico.
2. Respeta `Idempotency-Key`: si se repite, no duplica.
3. Responde dentro de los 5 s.
4. `GET /api/v1/notifications/{id}` devuelve al menos `id`, `recipientId`, `message`, `status`, `originIp`, `correlationId` y `receivedAt` (lo usa la verificación).
5. `GET /api/v1/ping` devuelve `module: "notificaciones"`. Si no, el diagnóstico avisa en el paso 4. Es propio de la prueba: el módulo real puede no tenerlo (ver 12.2).
6. Los errores salen con el formato normalizado, así el emisor puede mostrar `code` y `message`.

---

## 8. Brecha entre la prueba y los contratos oficiales del TPO

La prueba es **de infraestructura**: implementa lo mínimo para validar la comunicación entre CTs. **Al auditar a un compañero, el contrato que manda es el de la consigna.**

### 8.1 Equipo 3 - Pedidos

| Endpoint obligatorio (consigna) | En la prueba | Observación |
|---|---|---|
| `POST /api/v1/orders` | ✅ | ⚠️ La prueba pide `unitPrice` porque no hay Catálogo. La consigna manda `items: [{productId, quantity}]` y el precio lo confirma Catálogo |
| `POST /api/v1/orders/{id}/items` | ❌ | — |
| `POST /api/v1/orders/{id}/confirm` | ❌ | — |
| `POST /api/v1/orders/{id}/cancel` | ❌ | — |
| `GET /api/v1/orders/{id}` | ✅ | — |
| `GET /api/v1/orders` (listar, caso de uso) | ✅ | ❌ Sin paginación `page`/`size`/`sort` |
| `POST /orders/{id}/notify`, `GET /orders/{id}/verificacion`, `GET /diagnostico`, `GET /ping` | ➕ | Propios de la prueba |

| Tema | Consigna | Prueba |
|---|---|---|
| Estados del pedido | `BORRADOR → CONFIRMADO → EN_PREPARACION → EN_CAMINO → ENTREGADO / CANCELADO` | ⚠️ Sólo `BORRADOR`; sin transiciones |
| Respuesta del ejemplo | `{"status":"DRAFT","total":18500.00,"currency":"ARS"}` | ⚠️ `"status":"BORRADOR"`. La consigna usa `BORRADOR` en la tabla de estados y `DRAFT` en el ejemplo: **los equipos tienen que acordar cuál** |
| "Todos los productos del mismo comercio" | Regla | ❌ No se valida (no hay Catálogo) |
| "Pedido de un usuario válido" | Regla | ❌ No se valida (no hay Usuarios) |
| "Total con precios confirmados" | Regla | ⚠️ Se calcula en el servidor, pero con el precio que manda el cliente |

### 8.2 Equipo 6 - Notificaciones

| Endpoint obligatorio (consigna) | En la prueba | Observación |
|---|---|---|
| `POST /api/v1/notifications` | ✅ | ➕ Idempotencia con `Idempotency-Key` |
| `GET /api/v1/notifications/{id}` | ✅ | — |
| `POST /api/v1/notifications/{id}/retry` | ❌ | Reintentos limitados (regla de la consigna): no implementado |
| `GET /api/v1/users/{id}/notifications` | ✅ | — |
| `POST /api/v1/templates` | ❌ | Las plantillas son fijas (`enum`) |
| `GET /api/v1/notifications`, `GET /ping` | ➕ | Para la prueba |

| Regla (consigna) | Prueba |
|---|---|
| Destinatario, canal y plantilla válida | ✅ (RN-N1 a RN-N4) |
| Reintentos limitados | ❌ |
| No guardar contenido sensible | ✅ Sólo id, mensaje y datos técnicos |
| "Usuarios para datos mínimos del destinatario" | ❌ No consulta a Usuarios |

### 8.3 Convenciones transversales (sección 6 de la consigna)

| Convención | Prueba |
|---|---|
| Base URL `/api/v1` | ✅ |
| JSON UTF-8 | ✅ |
| Ids UUID o Long, consistente | ✅ Long |
| Fechas ISO-8601 | ✅ |
| Paginación `page`, `size`, `sort` | ❌ |
| `X-Correlation-Id` | ✅ |
| Autenticación Bearer JWT | ❌ (pendiente del Módulo Usuarios) |
| Códigos 200/201/204/400/401/403/404/409/422/500 | ✅ 200, 201, 400, 404, 405, 409, 422, 500 · ➕ 503, 504 · ❌ 204, 401, 403 |
| Error normalizado `{timestamp, status, code, message, path, correlationId}` | ✅ Exacto |
| Swagger accesible | ✅ |
| Base por módulo, sin acceso a tablas ajenas | ✅ |
| DTO separados de entidades JPA | ✅ |

---

## 9. Checklist de auditoría para los módulos de los compañeros

Completalo por cada módulo recibido. **Cómo verificar** indica la evidencia concreta.

### 9.1 Contrato y API

| # | Ítem | Cómo verificar | ✅/❌/Obs |
|---|---|---|---|
| A1 | Expone **todos** los endpoints obligatorios de su equipo (sección 4 de la consigna) | Swagger `/swagger-ui.html` o `/v3/api-docs` | |
| A2 | Base URL `/api/v1` | Rutas en Swagger | |
| A3 | Nombres de campos iguales a los acordados con los equipos que lo consumen | Comparar el DTO con la plantilla de la sección 11 | |
| A4 | Fechas en ISO-8601 | Respuesta de un `GET` | |
| A5 | Ids consistentes (todo Long o todo UUID) | Respuestas | |
| A6 | `201` + `Location` al crear | `curl -i -X POST ...` | |
| A7 | `404` para recursos inexistentes | Prueba C4 (sección 10) | |
| A8 | `400` con mensajes claros para datos inválidos | Prueba C1 | |
| A9 | `422` para reglas de negocio, distinto de `400` | Prueba C3 | |
| A10 | `409` para conflictos de estado o duplicados | Según el módulo | |
| A11 | Paginación `page`/`size`/`sort` en los listados | `GET ...?page=0&size=5` | |
| A12 | Swagger disponible y coincide con lo implementado | Probar 2 endpoints desde Swagger | |

### 9.2 Errores y trazabilidad

| # | Ítem | Cómo verificar | ✅/❌/Obs |
|---|---|---|---|
| E1 | **Todo** error sale con `{timestamp, status, code, message, path, correlationId}` | Pruebas C1 a C4 | |
| E2 | Un error 500 no expone stack traces ni datos internos | Forzar un error y mirar la respuesta | |
| E3 | Acepta y devuelve `X-Correlation-Id` | `curl -i -H "X-Correlation-Id: audit-1" ...` | |
| E4 | El `correlationId` aparece en sus logs | `journalctl ... \| grep audit-1` | |
| E5 | Si llama a otro módulo, **reenvía** el `X-Correlation-Id` | Ver logs del módulo llamado | |

### 9.3 Integración y resiliencia (si consume a otro módulo)

| # | Ítem | Cómo verificar | ✅/❌/Obs |
|---|---|---|---|
| I1 | La URL del otro módulo es configurable (variable de entorno), no está fija en el código | Revisar `application.properties` | |
| I2 | Tiene **timeouts** de conexión y de lectura | Revisar la configuración del cliente HTTP | |
| I3 | Si el otro módulo está caído, responde con error controlado (no se cuelga ni devuelve 500 genérico) | Apagar el otro módulo y probar | |
| I4 | Maneja la falla parcial con un criterio documentado (reintenta, encola o informa) | Prueba D1 de la guía | |
| I5 | Reintentar no duplica datos (idempotencia) | Repetir la petición | |
| I6 | No lee la base de datos de otro módulo | Revisar `datasource` y repositorios | |
| I7 | Los DTO del otro módulo no se usan como entidades JPA | Revisar `@Entity` | |

### 9.4 Código y estructura

| # | Ítem | Cómo verificar | ✅/❌/Obs |
|---|---|---|---|
| S1 | Separación `controller / service / repository / domain / dto` | Estructura de paquetes | |
| S2 | La lógica de negocio está en `service`, no en `controller` | Leer 2 controllers | |
| S3 | Validaciones con Bean Validation en los DTO | `@NotBlank`, `@Valid`... | |
| S4 | Manejo centralizado de errores (`@RestControllerAdvice`) | Buscar la clase | |
| S5 | Sin credenciales ni datos sensibles en el repo | `git grep -iE "password\|secret\|token"` | |
| S6 | Tests o evidencias reproducibles | `mvn test` | |
| S7 | README con instalación, variables, endpoints y datos de prueba | Leer README | |

### 9.5 Despliegue en la CT

| # | Ítem | Cómo verificar | ✅/❌/Obs |
|---|---|---|---|
| D1 | Compila desde cero (`mvn clean package`) en Debian con Java 17+ | En una CT limpia | |
| D2 | Escucha en `0.0.0.0` (accesible desde otra CT) | `ss -tlnp` | |
| D3 | Puerto acordado y documentado | `.env` / README | |
| D4 | Arranca solo al reiniciar la CT (systemd o similar) | Reboot | |
| D5 | Logs consultables (`journalctl` o archivo) | — | |
| D6 | Datos de prueba reproducibles | Ver cómo se cargan | |

---

## 10. Pruebas de conformidad con `curl`

Son comandos para correr contra **cualquier** implementación (la de prueba o la de un compañero). Definí antes la URL base:

```bash
URL=http://IP:PUERTO          # ej. http://192.168.1.114:8082
CID=audit-$(date +%s)
```

### 10.1 Genéricas (cualquier módulo)

| ID | Comando | Esperado |
|---|---|---|
| G1 | `curl -s $URL/v3/api-docs \| python3 -m json.tool \| head` | JSON de OpenAPI |
| G2 | `curl -s -o /dev/null -w "%{http_code}\n" $URL/swagger-ui.html` | `200` (o `302` hacia `/swagger-ui/index.html`) |
| G3 | `curl -s -i $URL/api/v1/ruta-que-no-existe -H "X-Correlation-Id: $CID"` | `404` + error normalizado + header `X-Correlation-Id: $CID` |

### 10.2 Contra un módulo de Notificaciones

```bash
# C-N1: creación válida → 201
curl -s -i -X POST $URL/api/v1/notifications -H "Content-Type: application/json" -H "X-Correlation-Id: $CID" \
  -d '{"recipientId":"audit","channel":"EMAIL","template":"PEDIDO_CREADO","data":{"orderId":1,"total":100},"sourceModule":"audit","referenceId":"1"}'

# C-N2: faltan campos → 400 normalizado
curl -s -X POST $URL/api/v1/notifications -H "Content-Type: application/json" -d '{}'

# C-N3: plantilla inexistente → 422 normalizado
curl -s -X POST $URL/api/v1/notifications -H "Content-Type: application/json" \
  -d '{"recipientId":"audit","channel":"EMAIL","template":"NO_EXISTE"}'

# C-N4: idempotencia → 201 y luego 200 (o el criterio que hayan acordado)
for i in 1 2; do curl -s -o /dev/null -w "%{http_code} " -X POST $URL/api/v1/notifications \
  -H "Content-Type: application/json" -H "Idempotency-Key: $CID" \
  -d '{"recipientId":"audit","channel":"PUSH","template":"PRUEBA_CONEXION"}'; done; echo

# C-N5: historial del usuario
curl -s $URL/api/v1/users/audit/notifications | python3 -m json.tool

# C-N6: inexistente → 404
curl -s $URL/api/v1/notifications/999999999
```

> Si el módulo real usa otras plantillas o canales, adaptá `template`/`channel` y anotalo en la plantilla de la sección 11.

### 10.3 Contra un módulo de Pedidos

```bash
# C-P1: creación → 201 (con el body acordado; la consigna NO trae unitPrice)
curl -s -i -X POST $URL/api/v1/orders -H "Content-Type: application/json" -H "X-Correlation-Id: $CID" \
  -d '{"userId":"audit","merchantId":"m-1","deliveryAddressId":"d-1","items":[{"productId":"p-1","quantity":2}]}'

# C-P2: inválido → 400 normalizado
curl -s -X POST $URL/api/v1/orders -H "Content-Type: application/json" -d '{"items":[]}'

# C-P3: consultar → 200 / 404
curl -s $URL/api/v1/orders/1
curl -s $URL/api/v1/orders/999999999

# C-P4: transiciones de estado (consigna): confirmar y cancelar
curl -s -X POST $URL/api/v1/orders/1/confirm
curl -s -X POST $URL/api/v1/orders/1/cancel      # en un estado no permitido debería dar 409/422
```

---

## 11. Plantilla de interpolación (por módulo recibido)

Copiá esta plantilla una vez por cada módulo que te entreguen:

```markdown
### Módulo: ____________________   Equipo: __   Responsable: ______________
Fecha de revisión: __/__/2026   Commit/branch revisado: ______________
URL de prueba: http://_____________:____

#### a) Endpoints
| Endpoint (consigna)            | Implementado (ruta real) | Request coincide | Response coincide | Observación |
|--------------------------------|--------------------------|------------------|-------------------|-------------|
|                                |                          |                  |                   |             |

#### b) Campos de los DTO que consumen otros módulos
| Campo (acordado) | Nombre real | Tipo acordado | Tipo real | Obligatorio | Diferencia |
|------------------|-------------|---------------|-----------|-------------|------------|
|                  |             |               |           |             |            |

#### c) Estados y transiciones
| Estado (consigna) | Valor real (texto exacto) | Transiciones permitidas | Observación |
|-------------------|---------------------------|-------------------------|-------------|
|                   |                           |                         |             |

#### d) Errores
| Situación          | HTTP esperado | HTTP real | `code` real | Formato normalizado (sí/no) |
|--------------------|---------------|-----------|-------------|-----------------------------|
| Recurso inexistente| 404           |           |             |                             |
| Datos inválidos    | 400           |           |             |                             |
| Regla de negocio   | 422           |           |             |                             |
| Conflicto de estado| 409           |           |             |                             |

#### e) Integraciones que hace
| Llama a (módulo) | Endpoint | URL configurable | Timeout | Qué hace si falla | Correlation-Id reenviado |
|------------------|----------|------------------|---------|-------------------|--------------------------|
|                  |          |                  |         |                   |                          |

#### f) Checklist (sección 9)
A1..A12: __/12   E1..E5: __/5   I1..I7: __/7   S1..S7: __/7   D1..D6: __/6

#### g) Diferencias que hay que acordar con otros equipos
1.
2.

#### h) Decisión
[ ] Apto para integrar   [ ] Apto con cambios menores   [ ] Requiere cambios antes de integrar
```

---

## 12. Cómo enchufar un módulo real en lugar de uno de prueba

La ventaja de tener los dos módulos de prueba es que podés probar el módulo de un compañero **contra uno que ya sabés que funciona**. Así, si algo falla, sabés que la causa está del lado del compañero.

### 12.1 Probar el Pedidos real de un compañero contra el receptor de prueba

1. Su módulo tiene que llamar a `POST {URL_NOTIFICACIONES}/api/v1/notifications` con el contrato de la sección 7.2.
2. Configurar su URL de Notificaciones apuntando al receptor de prueba (ej. `http://192.168.1.114:8082`).
3. Crear un pedido en su módulo.
4. Verificar en el receptor:
   ```bash
   curl -s http://192.168.1.114:8082/api/v1/notifications | python3 -m json.tool
   ```
   Tiene que estar la notificación, con `sourceModule`, `correlationId` y `originIp` = IP de la CT del compañero.
5. **Diferencias típicas a anotar:** nombres de campos, plantilla, si manda `Idempotency-Key`, si reenvía el `X-Correlation-Id`.

### 12.2 Probar el Notificaciones real de un compañero contra el emisor de prueba

1. En la CT del emisor: `RECEPTOR_URL=http://IP_DEL_COMPANERO:PUERTO` en `/etc/deliverygo/emisor-pedidos.env` y `systemctl restart deliverygo-emisor`.
2. `curl -s localhost:8081/api/v1/diagnostico | python3 -m json.tool`:
   - Pasos 1 a 3 OK: la red está bien.
   - **Paso 4 puede fallar** si su módulo no tiene `/api/v1/ping` o no devuelve `module: "notificaciones"`. Es una exigencia de la prueba, no de la consigna: anotalo y seguí con `?contrato=true` desde la página o con el paso 5.
   - Paso 5 OK: su `POST /api/v1/notifications` acepta el contrato de la prueba.
3. Crear pedidos desde la página web y usar **Verificar en receptor**. Si falla, el `code` y `message` que muestra la página vienen del módulo del compañero.
4. **Diferencias típicas:** plantillas con otro nombre (`422`), canales distintos (`400`), respuesta sin `id` (el emisor no podrá guardar `notificationId`), sin idempotencia (reintentos que duplican).

### 12.3 Si los contratos no coinciden

No se cambia el contrato en silencio. La consigna dice: *"Los equipos acuerdan contratos antes de implementar. Todo cambio se comunica y versiona."* Registrá la diferencia en la plantilla (11.g) y llevala al acta de decisiones.

---

## 13. Matriz de trazabilidad: consigna → prueba → evidencia

| Requisito de la consigna | Dónde se cumple en la prueba | Evidencia |
|---|---|---|
| Base por módulo; no acceder a tablas ajenas | `application.properties` de cada módulo (`./datos/pedidos`, `./datos/notificaciones`) | Dos bases H2 separadas en cada CT |
| DTO como formato de intercambio, distinto de JPA | `dto/` y `client/` vs. `domain/` | Revisión de código |
| Errores normalizados | `GlobalExceptionHandler` en ambos | Pruebas C1 a C4; test `plantillaInexistenteDevuelve422Normalizado` |
| Correlación `X-Correlation-Id` | `CorrelationIdFilter` + interceptor de `RestClientConfig` | `probar-integracion.sh` paso 4; logs de las dos CTs |
| Integración sincrónica por REST | `NotificacionesClient` | `RESULTADO: integración OK` |
| Timeout y errores contemplados | `RestClientConfig` (3 s / 5 s), `ReceptorException.Tipo` | Pruebas D1 a D6; test `servidorQueNoRespondeEsTimeoutDeLectura` |
| Manejar fallos parciales con mensajes comprensibles | RN-P2, `lastError` con sugerencia, página web | Página: pedido `FALLIDA` → Reintentar → `ENVIADA` |
| Solicitud repetida no duplica (idempotencia) | RN-N5, RN-P4 | Prueba C5; test `laMismaClaveIdempotenteNoDuplica` |
| Swagger accesible | springdoc en ambos | `/swagger-ui.html` |
| Separación controller/service/repository | Estructura de paquetes | Revisión de código |
| Validaciones | DTO con Bean Validation | Prueba C1; test `faltanCamposDevuelve400` |
| Compila y ejecuta desde un entorno limpio | `instalar-debian.sh` (compila en la CT) | CTs 301 y 302 instaladas desde cero |
| Datos de prueba reproducibles | Catálogo de la página, `probar-integracion.sh` | — |
| Variables sensibles fuera del repo | `.env` en `/etc/deliverygo/`, consola H2 apagada | Revisión |
| Integración simulada declarada | Sección 8 de este documento | Este documento |
