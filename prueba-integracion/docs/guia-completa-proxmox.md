# Guía completa: prueba de integración entre VMs en Proxmox

> **Branch:** `feature/prueba-integracion-proxmox`
> **Carpeta:** `prueba-integracion/`
> **Para qué sirve este documento:** entender **todo** lo que contiene la prueba, cómo funciona por dentro, y cómo implementarla y validarla paso a paso en el Proxmox, desde crear la VM hasta registrar las evidencias.
>
> El `README.md` de la carpeta es la referencia rápida. Esta guía es la versión larga y explicada.

---

## Índice

- [Parte 1 - Entender la prueba](#parte-1---entender-la-prueba)
  - [1. Qué problema resuelve](#1-qué-problema-resuelve)
  - [2. Qué se prueba y qué no](#2-qué-se-prueba-y-qué-no)
  - [3. Conceptos que hay que tener claros](#3-conceptos-que-hay-que-tener-claros)
  - [4. Arquitectura](#4-arquitectura)
  - [5. Recorrido de una petición, paso a paso](#5-recorrido-de-una-petición-paso-a-paso)
- [Parte 2 - El contenido de la branch](#parte-2---el-contenido-de-la-branch)
  - [6. Inventario de archivos](#6-inventario-de-archivos)
  - [7. El receptor por dentro (Notificaciones)](#7-el-receptor-por-dentro-notificaciones)
  - [8. El emisor por dentro (Pedidos)](#8-el-emisor-por-dentro-pedidos)
  - [9. Los scripts de despliegue](#9-los-scripts-de-despliegue)
  - [10. Contratos de la API](#10-contratos-de-la-api)
- [Parte 3 - Implementarlo en Proxmox](#parte-3---implementarlo-en-proxmox)
  - [11. Plan de red](#11-plan-de-red)
  - [12. Crear la VM en Proxmox](#12-crear-la-vm-en-proxmox)
  - [13. Instalar y preparar Debian](#13-instalar-y-preparar-debian)
  - [14. Plantilla y clones](#14-plantilla-y-clones)
  - [15. IP fija](#15-ip-fija)
  - [16. Firewall](#16-firewall)
  - [17. Instalar los módulos](#17-instalar-los-módulos)
- [Parte 4 - Probar y diagnosticar](#parte-4---probar-y-diagnosticar)
  - [18. Plan de pruebas](#18-plan-de-pruebas)
  - [19. Planilla de resultados](#19-planilla-de-resultados)
  - [20. Cómo diagnosticar: árbol de decisión](#20-cómo-diagnosticar-árbol-de-decisión)
  - [21. Comandos de diagnóstico en el host Proxmox](#21-comandos-de-diagnóstico-en-el-host-proxmox)
  - [22. Tabla de defectos y soluciones](#22-tabla-de-defectos-y-soluciones)
- [Parte 5 - Operación y próximos pasos](#parte-5---operación-y-próximos-pasos)
  - [23. Operación diaria](#23-operación-diaria)
  - [24. Desinstalar](#24-desinstalar)
  - [25. Escalar a los 8 equipos](#25-escalar-a-los-8-equipos)
  - [26. Evidencias para el TPO](#26-evidencias-para-el-tpo)
  - [27. Qué está verificado y qué no](#27-qué-está-verificado-y-qué-no)
  - [28. Glosario](#28-glosario)

---

# Parte 1 - Entender la prueba

## 1. Qué problema resuelve

En el TPO, cada equipo tiene **una VM Debian** en el Proxmox, donde corre su servicio Java y expone una API REST. El resto de los módulos y el Portal Web la consumen **por la red**.

Antes de integrar los módulos reales conviene saber si **la infraestructura** funciona: si una VM puede llamar a otra, si el puerto está abierto, si el firewall deja pasar, si el servicio arranca solo, etc. Cuando eso falla en medio de la integración real, es muy difícil saber si el problema es **del código** o **de la VM**.

Esta prueba separa las dos cosas. Trae dos servicios mínimos, que ya se sabe que funcionan, para probar **sólo la infraestructura**:

- Si la prueba **pasa** en tus VMs, la red y las VMs están bien. Cualquier falla posterior es del código de los módulos.
- Si la prueba **falla**, las herramientas dicen **en qué capa** está el problema (DNS, TCP, firewall, servicio, contrato) y **qué revisar**.

## 2. Qué se prueba y qué no

| Se prueba | No se prueba |
|---|---|
| Que una VM llegue a otra por IP y puerto | La lógica de negocio real de Pedidos o Notificaciones |
| Que el servicio escuche en la red (no sólo en `localhost`) | Autenticación JWT |
| Que el firewall de Debian y el de Proxmox dejen pasar | Base de datos real (PostgreSQL/MySQL); se usa H2 |
| Que el servicio arranque solo al prender la VM (systemd) | Envío real de emails |
| Que se manejen bien timeouts, caídas y reintentos | Alta disponibilidad / balanceo |
| Que el `X-Correlation-Id` viaje entre VMs y aparezca en los logs | El Portal React completo (sólo CORS) |
| Que el formato de error normalizado del TPO funcione | |
| Que un reintento no duplique datos (idempotencia) | |

## 3. Conceptos que hay que tener claros

| Concepto | Qué es | Dónde aparece en la prueba |
|---|---|---|
| **VM** | Una computadora virtual dentro del Proxmox, con su propio sistema operativo, IP y servicios | Una VM para el emisor y otra para el receptor |
| **Bridge (`vmbr0`)** | El "switch virtual" de Proxmox. Las VMs conectadas al mismo bridge están en la misma red, como si estuvieran enchufadas al mismo switch | Las dos VMs deben estar en el mismo bridge |
| **VLAN tag** | Una etiqueta que separa redes dentro del mismo bridge. Dos VMs con tags distintos **no se ven** aunque estén en el mismo bridge | Debe ser igual (o vacío) en las dos VMs |
| **IP y puerto** | La IP identifica la máquina; el puerto, el programa dentro de ella. `192.168.1.22:8082` = "el programa que escucha en el puerto 8082 de la máquina 192.168.1.22" | Emisor en `:8081`, receptor en `:8082` |
| **`0.0.0.0` vs `127.0.0.1`** | Si un servicio escucha en `127.0.0.1` sólo acepta conexiones **de la misma VM**. En `0.0.0.0` acepta de **cualquier** PC de la red | `HOST=0.0.0.0` en los `.env` |
| **API REST** | Se comunica por HTTP: un **método** (`GET`, `POST`), una **ruta** (`/api/v1/orders`) y un cuerpo **JSON** | Todo el intercambio |
| **DTO** | El "molde" del JSON que se intercambia. No es la tabla de la base | `CrearPedidoRequest`, `NotificacionResponse`, etc. |
| **systemd** | El administrador de servicios de Linux. Arranca programas al prender la máquina y los reinicia si se caen | `deliverygo-emisor`, `deliverygo-receptor` |
| **Timeout** | Tiempo máximo de espera. Sin timeout, si la otra VM no contesta, el programa queda esperando para siempre | 3 s para conectar, 5 s para responder |
| **Correlation-Id** | Un identificador que acompaña a una operación por todos los módulos, para encontrarla en los logs de todas las VMs | Header `X-Correlation-Id` |
| **Idempotencia** | Que repetir la misma petición no tenga efecto doble. Si el emisor reintenta, el receptor no crea dos notificaciones | Header `Idempotency-Key` |
| **Falla parcial** | Una parte de la operación falla pero otra no. Acá: el pedido se crea aunque la notificación falle | `notification.status = FALLIDA` |

## 4. Arquitectura

### 4.1 Vista de red

```
                         HOST PROXMOX
 ┌───────────────────────────────────────────────────────────────────┐
 │                                                                   │
 │                    bridge vmbr0 (switch virtual)                  │
 │        ┌────────────────────┴───────────────────────┐             │
 │        │                                            │             │
 │  ┌─────┴──────────────────┐          ┌──────────────┴─────────┐   │
 │  │ VM "dg-emisor"         │          │ VM "dg-receptor"       │   │
 │  │ Debian                 │  HTTP    │ Debian                 │   │
 │  │ 192.168.1.21           │ ───────▶ │ 192.168.1.22           │   │
 │  │ deliverygo-emisor :8081│          │ deliverygo-receptor    │   │
 │  │ base H2 propia         │          │   :8082                │   │
 │  │                        │          │ base H2 propia         │   │
 │  └────────────────────────┘          └────────────────────────┘   │
 │                                                                   │
 └───────────────────────────────┬───────────────────────────────────┘
                                 │ placa física del host
                       ┌─────────┴──────────┐
                       │ Red del laboratorio│ ── PC de prueba (navegador, curl, VS Code)
                       └────────────────────┘
```

> Las IPs `192.168.1.21` y `192.168.1.22` son **ejemplos**. Usá las de tu red (sección 11).

### 4.2 Capas dentro de cada módulo

Los dos módulos siguen la estructura que sugiere la consigna:

```
  Petición HTTP
       │
       ▼
  config/CorrelationIdFilter   ← asigna o reutiliza el X-Correlation-Id (antes que todo)
       │
       ▼
  controller/                  ← traduce HTTP <-> Java. Valida el DTO con @Valid
       │
       ▼
  service/                     ← reglas de negocio. Decide qué hacer
       │            │
       ▼            ▼
  repository/   client/        ← repository: base propia (JPA)
       │            │            client: llamar a OTRO módulo por HTTP (sólo el emisor)
       ▼            ▼
   H2 (archivo)  red → otra VM

  exception/GlobalExceptionHandler  ← cualquier error sale con el formato normalizado
  mapper/                            ← entidad del dominio → DTO de respuesta
```

## 5. Recorrido de una petición, paso a paso

### 5.1 Caso feliz: crear un pedido

```
 PC de prueba            VM emisor (:8081)                         VM receptor (:8082)
     │                         │                                          │
     │ POST /api/v1/orders     │                                          │
     │ X-Correlation-Id: abc   │                                          │
     │────────────────────────▶│                                          │
     │                         │ 1. CorrelationIdFilter: cid=abc          │
     │                         │ 2. @Valid valida el JSON                 │
     │                         │ 3. Calcula el total y guarda el pedido   │
     │                         │    (estado BORRADOR, notif. PENDIENTE)   │
     │                         │                                          │
     │                         │ 4. POST /api/v1/notifications            │
     │                         │    X-Correlation-Id: abc                 │
     │                         │    Idempotency-Key: pedido-1-PEDIDO_CREADO
     │                         │─────────────────────────────────────────▶│
     │                         │                                          │ 5. cid=abc (el mismo)
     │                         │                                          │ 6. Valida plantilla y datos
     │                         │                                          │ 7. Guarda la notificación
     │                         │                       201 { id: 2, ... } │    con la IP del emisor
     │                         │◀─────────────────────────────────────────│
     │                         │ 8. Marca notif. ENVIADA (id remoto 2)    │
     │  201 { id: 1, ...,      │                                          │
     │   notification:ENVIADA }│                                          │
     │◀────────────────────────│                                          │
     │                                                                    │
     │ GET /api/v1/users/u-42/notifications   (verificación directa)      │
     │───────────────────────────────────────────────────────────────────▶│
     │ [ { message: "Tu pedido #1 por $ 19500 fue creado...", ... } ]     │
     │◀───────────────────────────────────────────────────────────────────│
```

### 5.2 Caso con falla: el receptor no responde

```
 PC                      VM emisor                                  VM receptor (caída)
  │ POST /api/v1/orders    │                                              ✕
  │───────────────────────▶│ guarda el pedido                             │
  │                        │ POST /api/v1/notifications ─────────────────▶✕  Connection refused
  │                        │ clasifica: CONEXION_RECHAZADA                │
  │                        │ marca notif. FALLIDA + motivo + sugerencia   │
  │ 201 { notification:    │                                              │
  │  FALLIDA, lastError }  │   ← el pedido SÍ se creó (falla parcial)     │
  │◀───────────────────────│                                              │
  │                        │                                 (se levanta el receptor)
  │ POST /orders/1/notify  │                                              │
  │───────────────────────▶│ reintenta con la MISMA Idempotency-Key ─────▶│ guarda
  │ 200 { ENVIADA }        │◀────────────────────────────────────────────│
  │◀───────────────────────│                                              │
```

---

# Parte 2 - El contenido de la branch

## 6. Inventario de archivos

| Archivo | Para qué sirve |
|---|---|
| `prueba-integracion/pom.xml` | Proyecto Maven "padre": agrupa los dos módulos, fija Spring Boot 3.5.16, Java 17 y la versión de Swagger (springdoc 2.8.9) |
| `prueba-integracion/README.md` | Referencia rápida |
| `prueba-integracion/docs/guia-completa-proxmox.md` | Esta guía |
| `prueba-integracion/pruebas.http` | 11 peticiones listas para mandar desde VS Code (extensión REST Client) |
| `prueba-integracion/.gitignore` | Evita subir `target/` (compilados) y `datos/` (bases H2) |
| `receptor-notificaciones/pom.xml` | Dependencias del receptor: web, JPA, validación, actuator, Swagger, H2, tests |
| `receptor-notificaciones/src/main/resources/application.properties` | Configuración del receptor. Todo se puede cambiar con variables de entorno |
| `receptor-notificaciones/src/main/java/.../notificaciones/` | Código del receptor: 19 clases (sección 7) |
| `receptor-notificaciones/src/test/.../NotificacionControllerTest.java` | 4 tests del contrato HTTP del receptor |
| `emisor-pedidos/pom.xml` | Dependencias del emisor (las mismas que el receptor) |
| `emisor-pedidos/src/main/resources/application.properties` | Configuración del emisor, incluida `RECEPTOR_URL` y los timeouts |
| `emisor-pedidos/src/main/java/.../pedidos/` | Código del emisor: 28 clases (sección 8) |
| `emisor-pedidos/src/main/resources/static/` | Página web del emisor: `index.html`, `estilos.css`, `app.js` (sección 6 de `especificacion-y-auditoria-modulos.md`) |
| `docs/especificacion-y-auditoria-modulos.md` | Especificación de cada módulo, brecha con la consigna, checklist y plantilla para auditar los módulos de los compañeros |
| `emisor-pedidos/src/test/.../NotificacionesClientTest.java` | 3 tests que provocan fallas de red reales y verifican su clasificación |
| `despliegue/instalar-debian.sh` | Instala un módulo como servicio systemd en Debian |
| `despliegue/diagnostico-vm.sh` | Revisa la VM y la conexión con la otra VM. Sólo lee, no cambia nada |
| `despliegue/probar-integracion.sh` | Prueba de punta a punta desde cualquier PC |
| `despliegue/emisor.env.ejemplo` | Plantilla de configuración del emisor (se copia a `/etc/deliverygo/`) |
| `despliegue/receptor.env.ejemplo` | Plantilla de configuración del receptor |

## 7. El receptor por dentro (Notificaciones)

Paquete base: `ar.edu.uade.api.deliverygo.notificaciones`

### 7.1 Arranque y configuración

| Clase | Qué hace |
|---|---|
| `NotificacionesApplication` | Punto de entrada (`main`). `@ConfigurationPropertiesScan` habilita leer `SimulacionProperties` |
| `config/CorrelationIdFilter` | Corre **antes que todo** en cada petición. Si viene `X-Correlation-Id` lo reutiliza; si no, genera un UUID. Lo guarda en el MDC (el contexto de los logs) y lo devuelve en la respuesta. En el `finally` lo borra, porque Tomcat reutiliza los hilos |
| `config/WebConfig` | **CORS** (permite que el Portal React, desde otro origen, llame a la API) y los datos de Swagger |
| `config/SimulacionProperties` | `record` con `demoraMs` y `porcentajeFalla`, que se leen de `SIMULAR_DEMORA_MS` y `SIMULAR_FALLA_PORCENTAJE` |

### 7.2 Dominio y persistencia

| Clase | Qué hace |
|---|---|
| `domain/Notificacion` | Entidad JPA (tabla `notificacion`). Guarda destinatario, canal, plantilla, mensaje armado, módulo de origen, referencia, **clave de idempotencia (única)**, correlationId, **IP de origen**, estado y fecha. El constructor la deja `ENVIADA` |
| `domain/Canal` | `EMAIL`, `PUSH`, `INTERNA` |
| `domain/EstadoEnvio` | `PENDIENTE`, `ENVIADA`, `FALLIDA` |
| `domain/Plantilla` | Las plantillas válidas, con los datos que requiere cada una y el texto. `armarMensaje()` reemplaza `{clave}` por su valor |
| `repository/NotificacionRepository` | Spring Data genera las consultas a partir del nombre del método: `findByDestinatarioIdOrderByRecibidaEnDesc`, `findByClaveIdempotencia`, `findAllByOrderByRecibidaEnDesc` |

Plantillas disponibles:

| Plantilla | Datos requeridos | Mensaje |
|---|---|---|
| `PEDIDO_CREADO` | `orderId`, `total` | "Tu pedido #{orderId} por $ {total} fue creado y está pendiente de pago." |
| `PEDIDO_CONFIRMADO` | `orderId` | "Tu pedido #{orderId} fue confirmado. ¡Ya lo están preparando!" |
| `PRUEBA_CONEXION` | — | "Mensaje de prueba de conexión entre máquinas virtuales." |

### 7.3 La lógica: `service/NotificacionService.registrar()`

En orden:

1. **`aplicarSimulacion()`**: si `SIMULAR_DEMORA_MS > 0`, espera; si toca según `SIMULAR_FALLA_PORCENTAJE`, lanza `503 FALLA_SIMULADA`.
2. **Idempotencia**: si llegó `Idempotency-Key` y ya existe una notificación con esa clave, **la devuelve sin crear otra** (el controller responde `200` en vez de `201`).
3. **`buscarPlantilla()`**: si el nombre no existe, `422 PLANTILLA_INVALIDA` con la lista de válidas.
4. **`validarDatos()`**: si faltan datos de la plantilla, `422 DATOS_INCOMPLETOS`.
5. Crea la entidad con el **mensaje ya armado**, el **correlationId** y la **IP de quien llamó** (`request.getRemoteAddr()`), y la guarda.
6. Escribe en el log: `Notificación N recibida desde <IP> (módulo pedidos): <mensaje>`.

> **¿Por qué 422 y no 400?** La consigna distingue: `400` es una solicitud mal formada (falta un campo, JSON roto) y `422` es una regla de negocio incumplida (el JSON está bien, pero la plantilla no existe).

### 7.4 Entrada y salida

| Clase | Qué hace |
|---|---|
| `controller/NotificacionController` | Las rutas del Equipo 6. `@Valid` valida el DTO antes de llegar al service. Responde `201 Created` (con header `Location`) o `200 OK` si era una repetición |
| `controller/PingController` | `GET /api/v1/ping`: módulo, hostname, **IPs de la VM**, puerto, versión de Java, tiempo encendido, hora y **la IP de quien preguntó** |
| `dto/CrearNotificacionRequest` | El JSON de entrada, con validaciones (`@NotBlank`, `@Pattern` para el canal, `@Size`) |
| `dto/NotificacionResponse` | El JSON de salida |
| `dto/ErrorResponse` | El formato de error normalizado |
| `dto/PingResponse` | La respuesta del ping |
| `mapper/NotificacionMapper` | Entidad → DTO |
| `exception/ApiException` | Error de negocio con status y código |
| `exception/GlobalExceptionHandler` | Convierte **todo** error en el formato normalizado: `ApiException`, validación (400), JSON roto (400), parámetro inválido (400), ruta inexistente (404), método no permitido (405) y cualquier otro (500, sin exponer detalles) |

## 8. El emisor por dentro (Pedidos)

Paquete base: `ar.edu.uade.api.deliverygo.pedidos`

Comparte con el receptor la **misma forma** de `CorrelationIdFilter`, `WebConfig`, `GlobalExceptionHandler`, `ApiException`, `ErrorResponse`, `PingResponse` y `PingController`. Son **copias propias**, no clases compartidas: cada módulo es independiente, como en el TPO real.

### 8.1 Configuración de la conexión con el receptor

| Clase | Qué hace |
|---|---|
| `config/ReceptorProperties` | `record` con `url`, `timeoutConexionMs` y `timeoutLecturaMs`, que salen de `RECEPTOR_URL`, `RECEPTOR_TIMEOUT_CONEXION_MS` y `RECEPTOR_TIMEOUT_LECTURA_MS` |
| `config/RestClientConfig` | Crea el `RestClient` (cliente HTTP de Spring) con la URL base, **los dos timeouts**, y un **interceptor** que agrega el `X-Correlation-Id` actual a cada llamada saliente |

**Los dos timeouts son distintos y fallan por motivos distintos:**

| Timeout | Defecto | Mide | Si se supera, suele ser... |
|---|---|---|---|
| De **conexión** | 3000 ms | Cuánto tarda en abrirse la conexión TCP | VM apagada, IP inexistente, firewall que **descarta** paquetes |
| De **lectura** | 5000 ms | Cuánto tarda en llegar la respuesta, ya conectado | Receptor sobrecargado, colgado o con demora simulada |

### 8.2 Dominio

| Clase | Qué hace |
|---|---|
| `domain/Pedido` | Entidad JPA (tabla `pedido`). El **total lo calcula el servidor** sumando los ítems; nunca se toma del cliente. Estado inicial `BORRADOR`, moneda `ARS`. Guarda además el **seguimiento de la integración**: `estadoNotificacion`, `notificacionId` (el id en la base del receptor), `intentosNotificacion` y `ultimoErrorNotificacion` |
| `domain/ItemPedido` | `@Embeddable`: no tiene tabla propia como entidad; se guarda en `pedido_item` asociado al pedido. `subtotal()` = precio × cantidad |
| `domain/EstadoPedido` | Los estados sugeridos por la consigna. La prueba sólo usa `BORRADOR` |
| `domain/EstadoNotificacion` | `PENDIENTE`, `ENVIADA`, `FALLIDA` |
| `repository/PedidoRepository` | `findAllByOrderByCreadoEnDesc` |

### 8.3 El cliente HTTP: `client/NotificacionesClient`

Es **la única clase del emisor que sabe que el receptor existe**. Si mañana cambia la URL o el formato, se toca sólo acá.

- `enviar(request, claveIdempotencia)` → `POST /api/v1/notifications` con `Idempotency-Key`.
- `ping()` → `GET /api/v1/ping`.
- `clasificar(excepción)` → convierte la excepción técnica en una `ReceptorException` con **tipo**, mensaje y **sugerencia**:

| Excepción de Java (causa raíz) | Tipo | Significado |
|---|---|---|
| `RestClientResponseException` | `RESPUESTA_ERROR` | El receptor contestó, pero con 4xx/5xx. Se lee su error normalizado (`code`, `message`) |
| `UnknownHostException` | `HOST_DESCONOCIDO` | El nombre no se pudo resolver |
| `NoRouteToHostException` | `SIN_RUTA` | No hay camino de red hasta esa IP |
| `ConnectException` | `CONEXION_RECHAZADA` | La IP existe pero nada escucha en ese puerto |
| `SocketTimeoutException` con "connect" | `TIMEOUT_CONEXION` | No se pudo conectar a tiempo |
| `SocketTimeoutException` (lectura) | `TIMEOUT_LECTURA` | Conectó pero no respondió a tiempo |
| Otra | `OTRO` | Cualquier otro problema de E/S |

> **Detalle importante (bug encontrado en las pruebas):** Spring envuelve la excepción original. Un timeout de lectura puede llegar como `RestClientException` genérica ("Error while extracting response") y no como `ResourceAccessException`. Por eso `clasificar()` **siempre** busca la causa raíz (`raiz()`). Sin eso, un receptor lento se informaba como `OTRO`.

Los DTO que usa el cliente son propios del emisor:
- `NotificacionRemotaRequest`: lo que manda.
- `NotificacionRemotaResponse` y `ErrorRemoto`: lo que lee, con `@JsonIgnoreProperties(ignoreUnknown = true)` para que no se rompa si el receptor agrega campos.

### 8.4 La lógica: `service/PedidoService`

**`crear(request)`**
1. Convierte los ítems del DTO en `ItemPedido` y guarda el `Pedido`. El total se calcula en el constructor.
2. Llama a `notificar(pedido)`. Si lanza `ReceptorException`, **la atrapa y sigue**: el pedido queda creado con la notificación `FALLIDA`. Es la falla parcial.

**`notificar(pedido)`** (privado)
1. Arma la solicitud: destinatario = usuario del pedido, canal `EMAIL`, plantilla `PEDIDO_CREADO`, datos `orderId` y `total`, módulo `pedidos`, referencia = id del pedido.
2. Clave de idempotencia: **`pedido-{id}-PEDIDO_CREADO`**. Es siempre la misma para el mismo pedido, por eso un reintento no duplica.
3. Si sale bien, `registrarNotificacionEnviada(idRemoto)`. Si falla, `registrarNotificacionFallida("[TIPO] mensaje | Sugerencia: ...")` y relanza la excepción.
4. En el `finally` guarda el pedido con el resultado.

**`reintentarNotificacion(id)`**
- Si ya estaba `ENVIADA`, la devuelve sin volver a mandar.
- Si falla de nuevo, responde con error normalizado: **`504`** para los timeouts y **`503`** para el resto, con código `RECEPTOR_<TIPO>` (ej. `RECEPTOR_CONEXION_RECHAZADA`).

> **Decisión de diseño:** la llamada HTTP se hace **fuera de una transacción** de base de datos. Si estuviera dentro, una VM lenta mantendría la transacción abierta durante segundos.

### 8.5 El diagnóstico: `service/DiagnosticoService`

`GET /api/v1/diagnostico` ejecuta 5 pasos **en orden**. Si uno falla, los siguientes no se ejecutan, así que **el primer paso en falla es el problema**:

| # | Paso | Cómo lo prueba | Datos que muestra |
|---|---|---|---|
| 1 | Configuración | Parsea `RECEPTOR_URL`; avisa si apunta a `localhost` o `127.x` | host y puerto |
| 2 | DNS | `InetAddress.getAllByName(host)` | IPs a las que resuelve |
| 3 | TCP | Abre un `Socket` con el timeout de conexión | IP remota e **IP local usada** (qué placa de red usó la VM) |
| 4 | HTTP ping | `GET /api/v1/ping`; verifica que `module == "notificaciones"` | hostname e IPs del receptor |
| 5 | Contrato | `POST` real con plantilla `PRUEBA_CONEXION`, destinatario `diagnostico` y una clave idempotente nueva | id guardado e **IP con la que el receptor vio al emisor** |

Responde `200` si todo está OK y `503` si algo falló. Cada paso trae `detalle`, `sugerencia` y `ms` (cuánto tardó).

> El paso 5 **escribe** una notificación de prueba en el receptor. Es intencional: prueba el camino completo de escritura. Con `?contrato=false` se omite; es lo que usa la página web en su chequeo automático cada 15 s, para no llenar la base del receptor.

### 8.6 Entrada y salida

| Clase | Qué hace |
|---|---|
| `controller/PedidoController` | `POST /orders` (201 + `Location`), `GET /orders/{id}`, `GET /orders`, `POST /orders/{id}/notify` |
| `controller/DiagnosticoController` | `GET /diagnostico` → 200 o 503 |
| `dto/CrearPedidoRequest` | `userId`, `merchantId`, `deliveryAddressId`, `items[]` con `productId`, `quantity` (1 a 99) y `unitPrice` (> 0) |
| `dto/PedidoResponse` | El pedido más el bloque `notification` (status, notificationId, attempts, lastError, receptorUrl) |
| `dto/DiagnosticoResponse` | `ok`, `receptorUrl`, `timestamp` y la lista de `pasos` |
| `mapper/PedidoMapper` | Entidad → DTO |

## 9. Los scripts de despliegue

### 9.1 `instalar-debian.sh emisor|receptor`

Se corre **con sudo, dentro del repo clonado en la VM**. Hace, en orden:

| Paso | Qué hace | Detalle |
|---|---|---|
| 1 | Java | Si no hay `java`, instala `default-jre-headless` (Java 17 en Debian 12, 21 en Debian 13). Corta si la versión es menor a 17 |
| 2 | JAR | Si existe `<modulo>/target/<modulo>.jar` lo usa. Si no, instala `default-jdk-headless` y `maven` y **compila con el usuario dueño del repo** (no como root) |
| 3 | Usuario | Crea el usuario de sistema `deliverygo` (sin login, sin home) |
| 4 | Archivos | JAR en `/opt/deliverygo/<modulo>/`; carpeta de datos `/var/lib/deliverygo/<modulo>/` |
| 5 | Configuración | Copia `<rol>.env.ejemplo` a `/etc/deliverygo/<modulo>.env` **sólo si no existe** (al reinstalar se conserva) |
| 6 | systemd | Crea `/etc/systemd/system/deliverygo-<rol>.service`, lo habilita y lo arranca |
| 7 | Firewall | Si `ufw` está activo, abre el puerto |
| 8 | Verificación | Espera hasta 60 s a que `/api/v1/ping` responda. Si no, muestra las últimas 40 líneas del log |

El servicio systemd que crea:

```ini
[Unit]
After=network-online.target        # espera a que la red tenga IP
Wants=network-online.target

[Service]
User=deliverygo                    # no corre como root
WorkingDirectory=/var/lib/deliverygo/<modulo>   # ahí se crea ./datos (base H2)
EnvironmentFile=/etc/deliverygo/<modulo>.env    # las variables de configuración
ExecStart=/usr/bin/env java -Xms128m -Xmx384m -jar /opt/deliverygo/<modulo>/<modulo>.jar
Restart=on-failure                 # si se cae, lo levanta de nuevo
RestartSec=5
SuccessExitStatus=143              # 143 = detenido con systemctl stop, no es error
NoNewPrivileges=true               # endurecimiento básico
ProtectSystem=full
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target         # arranca al prender la VM
```

### 9.2 `diagnostico-vm.sh [IP_OTRA_VM] [PUERTO]`

**No modifica nada.** Revisa, en este orden:

| Sección | Qué revisa |
|---|---|
| 1. Sistema | SO, kernel, tipo de virtualización, **RAM disponible** (falla si < 300 MB), **disco de `/var`** (falla si > 90 %) |
| 2. Red | IPv4 de cada interfaz (falla si no hay), aviso si hay más de una, **gateway** y ping al gateway, **`machine-id`** |
| 3. DNS y hora | Resolución externa, que el propio hostname resuelva, **hora sincronizada** |
| 4. Java | Versión ≥ 17 |
| 5. Servicios | Para cada `deliverygo-*` instalado: activo, **puerto escuchando**, si escucha **sólo en 127.0.0.1** (falla), `/api/v1/ping` local, y en el emisor el `RECEPTOR_URL` y el resultado de `/api/v1/diagnostico` |
| 6. Firewall | `ufw` y `nftables` (con sudo); recordatorio del Firewall de Proxmox |
| 7. Otra VM | Si se pasó una IP: si es la propia, ruta (avisa si pasa por un router), ping, **ARP** (`FAILED` = nadie tiene esa IP en el segmento), puerto TCP y `/api/v1/ping` |

Devuelve como código de salida la **cantidad de fallas** (0 = todo bien).

### 9.3 `probar-integracion.sh URL_EMISOR URL_RECEPTOR`

Desde cualquier PC (necesita `curl` y `python3`). Genera un `correlationId` y un usuario únicos, y:

1. Hace ping a las dos VMs desde esta PC.
2. Corre el diagnóstico del emisor.
3. Crea un pedido de $ 19.500 (2 × 7800 + 1 × 3900).
4. Le pregunta **directamente al receptor** si tiene la notificación de ese usuario, si el `correlationId` coincide y desde qué IP le llegó.
5. Pide un pedido inexistente y verifica el `404` normalizado.

Devuelve la cantidad de fallas. Al final indica el `grep` para buscar la prueba en los logs.

### 9.4 Los archivos `.env.ejemplo`

Ver la sección 17.3 y la tabla completa de variables en el `README.md`.

## 10. Contratos de la API

### Emisor (`:8081`)

| Método | Ruta | Respuestas |
|---|---|---|
| `POST` | `/api/v1/orders` | `201`, `400` |
| `GET` | `/api/v1/orders` | `200` |
| `GET` | `/api/v1/orders/{id}` | `200`, `400`, `404` |
| `POST` | `/api/v1/orders/{id}/notify` | `200`, `404`, `503`, `504` |
| `GET` | `/api/v1/orders/{id}/verificacion` | `200`, `404`, `409`, `503`, `504` |
| `GET` | `/api/v1/diagnostico` (`?contrato=false` no escribe en el receptor) | `200`, `503` |
| `GET` | `/` | Página web |
| `GET` | `/api/v1/ping` | `200` |
| `GET` | `/actuator/health` | `200` |
| `GET` | `/swagger-ui.html` | Swagger UI |

### Receptor (`:8082`)

| Método | Ruta | Respuestas |
|---|---|---|
| `POST` | `/api/v1/notifications` | `201` nueva, `200` repetida, `400`, `422`, `503` (simulado) |
| `GET` | `/api/v1/notifications` | `200` |
| `GET` | `/api/v1/notifications/{id}` | `200`, `400`, `404` |
| `GET` | `/api/v1/users/{id}/notifications` | `200` |
| `GET` | `/api/v1/ping` | `200` |
| `GET` | `/actuator/health` | `200` |
| `GET` | `/swagger-ui.html` | Swagger UI |

### Error normalizado

```json
{
  "timestamp": "2026-10-18T00:18:30.058Z",
  "status": 404,
  "code": "PEDIDO_INEXISTENTE",
  "message": "No existe el pedido 999",
  "path": "/api/v1/orders/999",
  "correlationId": "a443a35b-61ce-4c55-b568-0545e794d463"
}
```

Los ejemplos completos de request/response y la tabla de códigos de error están en `README.md`, sección 8.

---

# Parte 3 - Implementarlo en Proxmox

## 11. Plan de red

Antes de crear nada, anotá estos datos (pedíselos a quien administra la red si no los sabés):

| Dato | Cómo averiguarlo | Tu valor |
|---|---|---|
| Subred del laboratorio | En el host Proxmox: `ip -br addr show vmbr0` | `_______________` (ej. `192.168.1.0/24`) |
| Gateway | En el host: `ip route \| grep default` | `_______________` (ej. `192.168.1.1`) |
| DNS | Normalmente el gateway o `8.8.8.8` | `_______________` |
| Bridge a usar | *Proxmox → Nodo → System → Network* | `_______________` (ej. `vmbr0`) |
| VLAN tag (si hay) | Lo define quien administra la red | `_______________` (vacío si no hay) |
| IP libre para el emisor | Que nadie la use: `ping` no responde | `_______________` (ej. `192.168.1.21`) |
| IP libre para el receptor | Ídem | `_______________` (ej. `192.168.1.22`) |

> Elegí IPs **fuera del rango del DHCP** del router, así no se las asigna a otro equipo.

## 12. Crear la VM en Proxmox

1. **Subir la ISO de Debian:** *Nodo → local → ISO Images → Download from URL* (o *Upload*). Usá la imagen **netinst** de debian.org.
2. **Create VM** (botón arriba a la derecha):

| Pestaña | Campo | Valor recomendado |
|---|---|---|
| General | Name | `dg-receptor` (y luego `dg-emisor`) |
| OS | ISO image | la ISO de Debian |
| System | Qemu Agent | ✅ activar |
| Disks | Disk size | 8 GB (mínimo 4 GB) |
| CPU | Cores | 2 (mínimo 1) |
| Memory | Memory | 2048 MB (mínimo 1024 MB; con 1 GB evitá compilar dentro de la VM) |
| Network | Bridge | el de tu plan de red (ej. `vmbr0`) |
| Network | VLAN Tag | el de tu plan de red, o vacío |
| Network | Model | VirtIO (paravirtualized) |
| Network | Firewall | puede quedar marcado; sólo filtra si el firewall de Proxmox está activo (sección 16) |

3. **Start** y abrir la **Console** para instalar Debian.

## 13. Instalar y preparar Debian

Durante el instalador de Debian:
- **Hostname:** `dg-receptor` o `dg-emisor` (distinto en cada VM).
- **Usuario:** creá uno normal (ej. `alumno`).
- **Selección de software:** destildá el entorno de escritorio y tildá **SSH server** y **standard system utilities**.

Después de instalar, entrá por consola o por SSH y ejecutá:

```bash
# Si al instalar pusiste contraseña de root, Debian NO agrega tu usuario a sudo:
su -
apt update && apt install -y sudo
usermod -aG sudo alumno
exit            # cerrá sesión y volvé a entrar para que tome el grupo

# Herramientas que usan los scripts + agente de Proxmox + hora sincronizada
sudo apt update
sudo apt install -y git curl python3 qemu-guest-agent systemd-timesyncd
sudo systemctl enable --now qemu-guest-agent

ip -br addr      # anotá la IP
```

Con `qemu-guest-agent` activo, Proxmox muestra la IP de la VM en su *Summary*.

## 14. Plantilla y clones

Para no instalar Debian dos veces:

1. Prepará **una** VM completa (secciones 12 y 13), sin instalar los módulos todavía.
2. Apagala. Botón derecho → **Convert to template**.
3. Botón derecho sobre la plantilla → **Clone** → *Mode: Full Clone* → nombre `dg-emisor`. Repetí para `dg-receptor`.
4. **En cada clon**, ejecutá esto. Es **obligatorio**: los clones heredan el mismo `machine-id` y, con DHCP, pueden recibir **la misma IP**.

```bash
sudo rm -f /etc/machine-id /var/lib/dbus/machine-id
sudo systemd-machine-id-setup

# Cambiar el hostname (también lo hereda)
sudo hostnamectl set-hostname dg-emisor          # o dg-receptor
sudo sed -i "s/^127.0.1.1.*/127.0.1.1\tdg-emisor/" /etc/hosts

sudo reboot
```

Verificá que `cat /etc/machine-id` dé un valor **distinto** en cada VM. `diagnostico-vm.sh` lo muestra.

## 15. IP fija

Con DHCP la IP puede cambiar y el `RECEPTOR_URL` del emisor quedaría apuntando a otra máquina. Para fijarla:

```bash
ip -br link            # nombre de la interfaz, ej. ens18
sudo nano /etc/network/interfaces
```

Reemplazá el bloque de la interfaz (`allow-hotplug ens18` / `iface ens18 inet dhcp`) por:

```
auto ens18
iface ens18 inet static
    address 192.168.1.22/24
    gateway 192.168.1.1
    dns-nameservers 192.168.1.1
```

```bash
sudo systemctl restart networking     # o sudo reboot
ip -br addr                           # confirmar la IP nueva
ping -c2 192.168.1.1                  # confirmar el gateway
```

> `dns-nameservers` necesita el paquete `resolvconf`. Si no lo tenés, editá `/etc/resolv.conf` y poné `nameserver 192.168.1.1`.
>
> **Cuidado:** si estás conectado por SSH y te equivocás de IP o máscara, perdés la conexión. Hacelo desde la **Console** de Proxmox.

## 16. Firewall

Hay **dos** firewalls posibles y cualquiera de los dos puede bloquear:

### 16.1 Firewall de Proxmox

Tiene tres niveles. **Filtra el tráfico de la VM sólo si está activo en el Datacenter y en la VM:**

| Nivel | Dónde | Qué mirar |
|---|---|---|
| Datacenter | *Datacenter → Firewall → Options → Firewall* | Si está en `Yes`, el firewall está habilitado en el cluster |
| Nodo | *Nodo → Firewall* | Reglas del host |
| VM | *VM → Firewall → Options → Firewall* | Si está en `Yes`, aplica reglas a esa VM. **Input Policy** suele ser `DROP` |

Si el firewall está activo en la VM, agregá una regla en *VM → Firewall → Add*:

| Campo | Receptor | Emisor |
|---|---|---|
| Direction | `in` | `in` |
| Action | `ACCEPT` | `ACCEPT` |
| Protocol | `tcp` | `tcp` |
| Dest. port | `8082` | `8081` |
| Enable | ✅ | ✅ |

Además, el checkbox **Firewall** de la placa de red (*Hardware → Network Device*) tiene que estar marcado para que las reglas de la VM se apliquen a esa placa.

### 16.2 Firewall dentro de Debian

Debian no trae firewall activo por defecto. Si alguien activó `ufw`:

```bash
sudo ufw status
sudo ufw allow 8082/tcp     # en el receptor
sudo ufw allow 8081/tcp     # en el emisor
```

`instalar-debian.sh` lo hace solo si `ufw` está activo.

## 17. Instalar los módulos

### 17.1 Antes: subir la branch

Las VMs clonan desde GitHub, así que la branch tiene que estar subida. Desde tu PC:

```bash
git -C /ruta/a/WebServices_APIs_TPO-prueba-proxmox push -u origin feature/prueba-integracion-proxmox
```

> **Sin internet en las VMs:** compilá en tu PC (`cd prueba-integracion && mvn clean package`) y copiá la carpeta con los JAR: `scp -r prueba-integracion alumno@192.168.1.22:`. En la VM tiene que estar instalado `default-jre-headless`.

### 17.2 VM receptora (primero)

```bash
git clone -b feature/prueba-integracion-proxmox https://github.com/FacundoJonas/WebServices_APIs_TPO.git
cd WebServices_APIs_TPO/prueba-integracion
sudo ./despliegue/instalar-debian.sh receptor
```

Salida esperada al final:

```
==> Esperando a que responda http://localhost:8082/api/v1/ping
{"module":"notificaciones","status":"UP","hostname":"dg-receptor","ips":["192.168.1.22"],...}

LISTO. deliverygo-receptor está corriendo.
  Desde otra PC:  curl http://192.168.1.22:8082/api/v1/ping
  Swagger:        http://192.168.1.22:8082/swagger-ui.html
  Logs:           journalctl -u deliverygo-receptor -f
```

**Comprobación desde tu PC:** `curl http://192.168.1.22:8082/api/v1/ping`. Si no responde, el problema es de red o firewall y conviene resolverlo **antes** de seguir (sección 20).

### 17.3 VM emisora

```bash
git clone -b feature/prueba-integracion-proxmox https://github.com/FacundoJonas/WebServices_APIs_TPO.git
cd WebServices_APIs_TPO/prueba-integracion
sudo ./despliegue/instalar-debian.sh emisor
```

El script avisa que hay que configurar el receptor. Editá:

```bash
sudo nano /etc/deliverygo/emisor-pedidos.env
```

```bash
PUERTO=8081
HOST=0.0.0.0
RECEPTOR_URL=http://192.168.1.22:8082      # ← IP REAL de la VM receptora
RECEPTOR_TIMEOUT_CONEXION_MS=3000
RECEPTOR_TIMEOUT_LECTURA_MS=5000
CORS_ORIGENES=*
H2_CONSOLA=false
```

```bash
sudo systemctl restart deliverygo-emisor
curl -s localhost:8081/api/v1/diagnostico | python3 -m json.tool
```

Tiene que terminar con `"ok": true`.

---

# Parte 4 - Probar y diagnosticar

## 18. Plan de pruebas

Ejecutalas en orden. **E** = IP del emisor, **R** = IP del receptor.

### Bloque A - Infraestructura

| ID | Objetivo | Cómo | Resultado esperado |
|---|---|---|---|
| A1 | Cada VM tiene red | En cada VM: `./despliegue/diagnostico-vm.sh` | Secciones 1 a 4 sin `[FALLA]` |
| A2 | Los servicios arrancaron | En cada VM: `systemctl status deliverygo-*` | `active (running)` |
| A3 | Escuchan en la red | En cada VM: `ss -tlnp \| grep 808` | `*:8081` / `*:8082`, no `127.0.0.1` |
| A4 | Las VMs se ven entre sí | En el emisor: `./despliegue/diagnostico-vm.sh R 8082` | Sección 7 sin fallas |
| A5 | Accesibles desde otra PC | Desde tu PC: `curl http://E:8081/api/v1/ping` y `curl http://R:8082/api/v1/ping` | JSON con `module` y `hostname` correctos |
| A6 | Swagger accesible | Navegador: `http://E:8081/swagger-ui.html` y `http://R:8082/swagger-ui.html` | Se ve la documentación |

### Bloque B - Integración

| ID | Objetivo | Cómo | Resultado esperado |
|---|---|---|---|
| B1 | Diagnóstico completo | `curl http://E:8081/api/v1/diagnostico` | HTTP 200, `ok: true`, 5 pasos OK |
| B2 | Prueba de punta a punta | Desde tu PC: `./despliegue/probar-integracion.sh http://E:8081 http://R:8082` | `RESULTADO: integración OK`, código de salida 0 |
| B3 | La IP de origen es la del emisor | Salida de B2, paso 4 | "vio la petición venir de **E**" |
| B4 | Correlación en logs | En el receptor: `journalctl -u deliverygo-receptor \| grep <cid de B2>` | Aparece la línea "Notificación N recibida desde E" |
| B5 | Ídem en el emisor | En el emisor: `journalctl -u deliverygo-emisor \| grep <cid>` | "Pedido N creado" y "Pedido N notificado" |

### Bloque C - Contrato y errores

Se pueden hacer con `pruebas.http` desde VS Code.

| ID | Objetivo | Petición | Resultado esperado |
|---|---|---|---|
| C1 | Validación | `POST /api/v1/orders` con `{"userId":"","items":[]}` | `400 VALIDACION` con los 3 mensajes |
| C2 | JSON roto | `POST /api/v1/orders` con `{roto` | `400 JSON_INVALIDO` |
| C3 | Regla de negocio | `POST R/api/v1/notifications` con `template: NO_EXISTE` | `422 PLANTILLA_INVALIDA` |
| C4 | Recurso inexistente | `GET E/api/v1/orders/999999` | `404 PEDIDO_INEXISTENTE` |
| C5 | Idempotencia | Mandar 2 veces el bloque 10 de `pruebas.http` | `201` y luego `200`; una sola notificación |
| C6 | Formato de error | Cualquiera de C1–C4 | Tiene `timestamp`, `status`, `code`, `message`, `path`, `correlationId` |

### Bloque D - Resiliencia

| ID | Objetivo | Cómo | Resultado esperado |
|---|---|---|---|
| D1 | Receptor caído | En R: `sudo systemctl stop deliverygo-receptor`. Crear un pedido | `201`, `notification.status: FALLIDA`, `lastError` con `[CONEXION_RECHAZADA]` |
| D2 | Diagnóstico con caída | `GET E/api/v1/diagnostico` | `503`, falla en **3. TCP** |
| D3 | Reintento fallido | `POST E/api/v1/orders/{id}/notify` | `503 RECEPTOR_CONEXION_RECHAZADA` |
| D4 | Recuperación | En R: `sudo systemctl start deliverygo-receptor`. Repetir D3 | `200`, `ENVIADA`, `attempts` aumentó |
| D5 | Sin duplicados | `GET R/api/v1/users/{userId}/notifications` | Una sola notificación de ese pedido |
| D6 | Receptor lento | En R: `SIMULAR_DEMORA_MS=8000` en el `.env` + restart. Crear un pedido | Tarda unos 5 s; `[TIMEOUT_LECTURA]`; reintento → `504` |
| D7 | Fallas intermitentes | En R: `SIMULAR_DEMORA_MS=0`, `SIMULAR_FALLA_PORCENTAJE=50` + restart. Crear 6 pedidos | Algunos `ENVIADA`, otros `FALLIDA` con `RESPUESTA_ERROR` 503 `FALLA_SIMULADA` |
| D8 | Volver a la normalidad | Poner las dos variables en `0` + restart | B2 vuelve a dar OK |

### Bloque E - Operación de la VM

| ID | Objetivo | Cómo | Resultado esperado |
|---|---|---|---|
| E1 | Arranque automático | Reiniciar la VM receptora desde Proxmox (*Reboot*). Esperar 1 minuto | `curl R:8082/api/v1/ping` responde sin intervención |
| E2 | Persistencia | Después de E1: `GET R/api/v1/notifications` | Siguen las notificaciones anteriores |
| E3 | Autorrecuperación | En R: `sudo kill -9 $(systemctl show -p MainPID --value deliverygo-receptor)`. Esperar 10 s | systemd lo vuelve a levantar (`systemctl status` muestra un PID nuevo) |
| E4 | Reinstalación | `sudo ./despliegue/instalar-debian.sh receptor` de nuevo | "Ya existe: se conserva tal cual" y `LISTO` |
| E5 | Configuración errónea detectable | En E: poner `HOST=127.0.0.1` + restart; correr `diagnostico-vm.sh` | `[FALLA] Escucha sólo en ...127.0.0.1...`. **Volver a `0.0.0.0`** |

## 19. Planilla de resultados

Copiala en un issue o en el acta de pruebas del equipo:

```
Fecha: ____/____/2026        Responsable: __________________
VM emisor:   nombre ________  ID Proxmox ____  IP ______________  Debian __  Java __
VM receptor: nombre ________  ID Proxmox ____  IP ______________  Debian __  Java __

| ID | Resultado (OK/FALLA) | Observaciones / correlationId |
|----|----------------------|-------------------------------|
| A1 |                      |                               |
| A2 |                      |                               |
| A3 |                      |                               |
| A4 |                      |                               |
| A5 |                      |                               |
| A6 |                      |                               |
| B1 |                      |                               |
| B2 |                      |                               |
| B3 |                      |                               |
| B4 |                      |                               |
| B5 |                      |                               |
| C1 |                      |                               |
| C2 |                      |                               |
| C3 |                      |                               |
| C4 |                      |                               |
| C5 |                      |                               |
| C6 |                      |                               |
| D1 |                      |                               |
| D2 |                      |                               |
| D3 |                      |                               |
| D4 |                      |                               |
| D5 |                      |                               |
| D6 |                      |                               |
| D7 |                      |                               |
| D8 |                      |                               |
| E1 |                      |                               |
| E2 |                      |                               |
| E3 |                      |                               |
| E4 |                      |                               |
| E5 |                      |                               |

Defectos encontrados en las VMs y cómo se corrigieron:
1.
2.
```

## 20. Cómo diagnosticar: árbol de decisión

Empezá siempre por arriba. La primera respuesta "NO" indica dónde está el problema:

```
¿Desde tu PC responde  curl http://R:8082/api/v1/ping ?
│
├─ SÍ ──▶ ¿Responde  curl http://E:8081/api/v1/diagnostico  con "ok": true?
│          ├─ SÍ ──▶ La infraestructura está bien. Correr probar-integracion.sh.
│          └─ NO ──▶ Mirar el PRIMER paso en falla:
│                    1. Configuración → corregir RECEPTOR_URL en /etc/deliverygo/emisor-pedidos.env
│                    2. DNS           → usar la IP en vez del nombre
│                    3. TCP           → desde tu PC llega pero desde E no: firewall de la VM R
│                                       filtra por origen, o E está en otra red/VLAN.
│                                       En E: ./despliegue/diagnostico-vm.sh R 8082
│                    4. HTTP ping     → puerto equivocado en RECEPTOR_URL
│                    5. Contrato      → versiones distintas: reinstalar en ambas VMs
│
└─ NO ──▶ En la VM receptora, ¿systemctl status deliverygo-receptor dice active?
           ├─ NO ──▶ journalctl -u deliverygo-receptor -n 50
           │          (Java < 17, poca RAM, error en el .env, puerto ocupado)
           └─ SÍ ──▶ ¿ss -tlnp | grep 8082 muestra *:8082?
                      ├─ NO (127.0.0.1) ──▶ HOST=0.0.0.0 en el .env + restart
                      └─ SÍ ──▶ ¿Desde tu PC, ping R responde?
                                 ├─ NO ──▶ Red: IP, máscara, gateway, bridge, VLAN tag.
                                 │          Ver sección 21 (en el host Proxmox).
                                 └─ SÍ ──▶ Firewall: el de Proxmox (3 niveles) o ufw/nftables.
                                            Probar: nc -vz R 8082  (o curl -v)
```

## 21. Comandos de diagnóstico en el host Proxmox

Se ejecutan en la **shell del nodo** (*Nodo → Shell*). Reemplazá `101` por el ID de tu VM:

| Comando | Para qué |
|---|---|
| `qm config 101 \| grep -E '^net\|^agent'` | Ver bridge, VLAN tag (`tag=`), MAC, si el firewall de la placa está activo (`firewall=1`) y si el agente está habilitado |
| `qm guest cmd 101 network-get-interfaces` | Ver las IPs reales de la VM (requiere `qemu-guest-agent`) |
| `ip -br link show vmbr0` | Ver que el bridge esté `UP` |
| `bridge link show` | Ver qué interfaces (VMs) están conectadas a cada bridge. Las VMs aparecen como `tap101i0` |
| `pve-firewall status` | Ver si el firewall de Proxmox está activo |
| `cat /etc/pve/firewall/cluster.fw` | Reglas y políticas del Datacenter |
| `cat /etc/pve/firewall/101.fw` | Reglas y políticas de la VM 101 |
| `qm list` | Listado de VMs y su estado |

**Señales típicas:**
- Las dos VMs tienen distinto `bridge=` o distinto `tag=` en `qm config` → no se van a ver.
- Dos VMs tienen la **misma MAC** (`net0: virtio=XX:XX...`) → conflicto de red. Generá una nueva en *Hardware → Network Device → MAC address* (dejala vacía para que la regenere).
- `101.fw` tiene `policy_in: DROP` sin una regla `IN ACCEPT` para el puerto → el firewall de Proxmox bloquea.

## 22. Tabla de defectos y soluciones

| Síntoma | Dónde se ve | Causa probable | Solución |
|---|---|---|---|
| La VM no tiene IP | `diagnostico-vm.sh` sección 2 | Placa sin bridge, DHCP sin respuesta, `/etc/network/interfaces` mal | Revisar *Hardware → Network Device*; configurar IP fija (sección 15) |
| Dos VMs con la misma IP | `ip a` en ambas | Clones con el mismo `machine-id` | Regenerar `machine-id` (sección 14) |
| `TIMEOUT_CONEXION` / paso 3 "Connect timed out" | Diagnóstico | VM apagada, IP inexistente, VLAN distinta, firewall que descarta | `ping`, `qm config` (bridge/tag), firewall de Proxmox |
| `CONEXION_RECHAZADA` / "Connection refused" | Diagnóstico | Servicio caído, puerto distinto, escucha en `127.0.0.1` | `systemctl status`, `ss -tlnp`, `HOST=0.0.0.0` |
| `SIN_RUTA` / "No route to host" | Diagnóstico | Otra subred, gateway o máscara mal; firewall con `REJECT` | `ip route`; misma subred para las dos VMs |
| ARP `FAILED` | `diagnostico-vm.sh` sección 7 | Nadie tiene esa IP en el segmento | IP equivocada o VM en otro bridge/VLAN |
| "Escucha sólo en 127.0.0.1" | `diagnostico-vm.sh` sección 5 | `HOST=127.0.0.1` | `HOST=0.0.0.0` + restart |
| `HOST_DESCONOCIDO` / paso 2 | Diagnóstico | Nombre sin DNS | Usar la IP o agregarla a `/etc/hosts` |
| Paso 4 "Respondió otro servicio" | Diagnóstico | `RECEPTOR_URL` apunta a otro puerto/servicio | Receptor = `:8082` |
| `TIMEOUT_LECTURA` (504) | Diagnóstico / reintento | Receptor lento: CPU/RAM, swap, demora simulada | `top`/`free -m` en R; `SIMULAR_DEMORA_MS=0`; más RAM en Proxmox |
| `RESPUESTA_ERROR` 404 | Diagnóstico | Versión vieja desplegada | Reinstalar en ambas VMs |
| `RESPUESTA_ERROR` 400/422 | Diagnóstico | Contratos distintos | Misma versión de la branch en las dos VMs |
| El servicio no arranca | `systemctl status` | Java < 17, RAM insuficiente, puerto ocupado, error en `.env` | `journalctl -u deliverygo-<rol> -n 50`, `java -version`, `free -m`, `ss -tlnp` |
| El servicio no arranca al reiniciar la VM | E1 | No quedó habilitado | `sudo systemctl enable deliverygo-<rol>` |
| "Hora NO sincronizada" | `diagnostico-vm.sh` sección 3 | Sin NTP | `sudo apt install systemd-timesyncd` |
| Arranque muy lento de Java | Logs | El hostname no resuelve | Agregar `127.0.1.1 <hostname>` en `/etc/hosts` |
| Funciona con curl pero no desde el Portal React | Consola del navegador: error de CORS | Origen no permitido | `CORS_ORIGENES=http://IP_PORTAL:5173` + restart |
| El instalador falla compilando | Salida del script | Poca RAM o sin internet | Compilar en tu PC y copiar el JAR (sección 17.1) |

---

# Parte 5 - Operación y próximos pasos

## 23. Operación diaria

```bash
# Estado, arranque y parada
sudo systemctl status deliverygo-receptor
sudo systemctl restart deliverygo-receptor
sudo systemctl stop deliverygo-receptor

# Logs
journalctl -u deliverygo-receptor -f              # en vivo
journalctl -u deliverygo-receptor -n 100          # últimas 100 líneas
journalctl -u deliverygo-receptor --since "10 min ago"
journalctl -u deliverygo-receptor | grep <correlationId>

# Cambiar la configuración
sudo nano /etc/deliverygo/receptor-notificaciones.env
sudo systemctl restart deliverygo-receptor

# Actualizar a una versión nueva de la branch
cd ~/WebServices_APIs_TPO && git pull
cd prueba-integracion && rm -rf */target
sudo ./despliegue/instalar-debian.sh receptor     # recompila y conserva el .env

# Ver los datos guardados
curl -s localhost:8082/api/v1/notifications | python3 -m json.tool
curl -s localhost:8081/api/v1/orders | python3 -m json.tool
```

**Dónde está cada cosa en la VM:**

| Qué | Dónde |
|---|---|
| Programa (JAR) | `/opt/deliverygo/<modulo>/<modulo>.jar` |
| Configuración | `/etc/deliverygo/<modulo>.env` |
| Base de datos H2 | `/var/lib/deliverygo/<modulo>/datos/` |
| Servicio systemd | `/etc/systemd/system/deliverygo-<rol>.service` |
| Logs | `journalctl -u deliverygo-<rol>` |

`<modulo>` = `emisor-pedidos` o `receptor-notificaciones`; `<rol>` = `emisor` o `receptor`.

## 24. Desinstalar

Cuando el equipo instale su módulo real y quiera sacar la prueba:

```bash
ROL=receptor; MODULO=receptor-notificaciones      # o emisor / emisor-pedidos

sudo systemctl disable --now deliverygo-$ROL
sudo rm -f /etc/systemd/system/deliverygo-$ROL.service
sudo systemctl daemon-reload
sudo rm -rf /opt/deliverygo/$MODULO /var/lib/deliverygo/$MODULO /etc/deliverygo/$MODULO.env

# Sólo si ya no queda ningún módulo de prueba en la VM:
sudo userdel deliverygo
sudo rmdir /opt/deliverygo /var/lib/deliverygo /etc/deliverygo 2>/dev/null
sudo ufw delete allow 8082/tcp 2>/dev/null         # si se había abierto en ufw
```

## 25. Escalar a los 8 equipos

La misma prueba sirve para validar las 8 VMs del ecosistema. Con un **plan de direcciones** acordado, cada equipo prueba su VM contra otra:

| Equipo | Módulo | VM | IP sugerida | Puerto |
|---|---|---|---|---|
| 1 | Usuarios y autenticación | `dg-usuarios` | `.101` | `8080` |
| 2 | Comercios y catálogo | `dg-catalogo` | `.102` | `8080` |
| 3 | Pedidos | `dg-pedidos` | `.103` | `8080` |
| 4 | Pagos | `dg-pagos` | `.104` | `8080` |
| 5 | Logística | `dg-logistica` | `.105` | `8080` |
| 6 | Notificaciones | `dg-notificaciones` | `.106` | `8080` |
| 7 | Opiniones y analítica | `dg-analitica` | `.107` | `8080` |
| 8 | Portal web | `dg-portal` | `.108` | `80` / `5173` |

> Es una **propuesta**: las IPs y puertos los tienen que acordar los equipos y registrarlos en el "Registro de integraciones" que pide la consigna.

**Cómo usarla para validar todas las VMs:**
1. Instalar el **receptor** en la VM del Equipo 6 (Notificaciones), que es el módulo que "recibe solicitudes de todos".
2. Instalar el **emisor** en cada una de las otras VMs, con `RECEPTOR_URL=http://<IP del Equipo 6>:8082`.
3. Correr `probar-integracion.sh` contra cada par. En el receptor, `GET /api/v1/notifications` muestra en `originIp` **desde qué VM llegó cada una**: si están las 7 IPs, las 7 VMs llegan al Equipo 6.

**Cuando cada equipo tenga su módulo real:**
- Desinstalar la prueba (sección 24) e instalar el módulo real con el mismo esquema: JAR + `.env` + servicio systemd. Se puede reutilizar `instalar-debian.sh` cambiando el nombre del módulo.
- Copiar los patrones que ya están probados acá: `CorrelationIdFilter`, `GlobalExceptionHandler` con el error normalizado, `RestClientConfig` con timeouts, y la clasificación de errores de `NotificacionesClient`.

## 26. Evidencias para el TPO

La consigna pide "Colección de pruebas o evidencia", "Registro de integraciones" y "Evidenciar manejo de un error". Esta prueba los cubre así:

| Evidencia | Cómo obtenerla |
|---|---|
| Prueba de integración exitosa | Captura (o salida en texto) de `probar-integracion.sh` con `RESULTADO: integración OK` |
| Trazabilidad entre módulos | Las dos líneas de `journalctl` (emisor y receptor) con el **mismo** `correlationId` |
| Manejo de error | D1–D4: pedido `FALLIDA` → reintento `503` → recuperación `ENVIADA` |
| Timeout contemplado | D6: `TIMEOUT_LECTURA` y `504` |
| Errores normalizados | Respuestas de C1–C4 |
| Swagger accesible | Captura de `/swagger-ui.html` en cada VM |
| Colección de pruebas | `pruebas.http` + la planilla de la sección 19 completa |
| Registro de integraciones | Tabla de la sección 25 con las IPs reales y responsables |

> **Importante para la defensa:** la consigna aclara que "una integración simulada debe estar declarada; no puede presentarse como real". Esta es una **prueba de infraestructura**, no la integración final entre los módulos de los equipos.

## 27. Qué está verificado y qué no

**Verificado:**

| Prueba | Resultado |
|---|---|
| Compilación + 7 tests automáticos (`mvn package`) | ✅ |
| Local: flujo completo y todos los errores del contrato | ✅ |
| Local: receptor caído, reintento y recuperación sin duplicar | ✅ |
| Local: receptor lento → `TIMEOUT_LECTURA` → `504` | ✅ (encontró y corrigió un bug) |
| Local: IP inexistente, host inválido, puerto equivocado | ✅ |
| Dos contenedores **Debian 13 con systemd** e IPs distintas, como dos VMs: instalación (una con JAR y otra compilando con Maven), servicio, diagnóstico y prueba de punta a punta | ✅ |
| `diagnostico-vm.sh` detecta `RECEPTOR_URL` errónea y el servicio en `127.0.0.1` | ✅ (encontró y corrigió un bug con `[::ffff:127.0.0.1]`) |
| Reinstalación idempotente | ✅ |
| `shellcheck` sin advertencias | ✅ |

**No verificado (requiere tu Proxmox):**
- Bridges, VLAN tags y el **Firewall de Proxmox** reales.
- **Debian 12** con Java 17 por `apt` (el código compila para 17, pero las pruebas corrieron en Java 21).
- `ufw` activo.
- Reinicio real de una VM (E1) y `qemu-guest-agent`.
- Los comandos del host Proxmox de la sección 21 son estándar de Proxmox VE, pero no se ejecutaron en tu nodo.

## 28. Glosario

| Término | Significado |
|---|---|
| **Actuator** | Módulo de Spring Boot que expone `/actuator/health` para saber si el servicio está sano |
| **ARP** | Protocolo que traduce una IP en la dirección física (MAC) dentro de la misma red. `FAILED` = nadie respondió por esa IP |
| **Bridge** | Switch virtual de Proxmox que conecta las VMs entre sí y con la red física |
| **CORS** | Regla del navegador que impide que una página llame a otro servidor salvo que este lo permita |
| **DTO** | *Data Transfer Object*: el formato de los datos que viajan por la API |
| **Gateway** | El router por el que se sale de la subred |
| **H2** | Base de datos Java embebida; en esta prueba se guarda en un archivo por módulo |
| **Idempotencia** | Repetir una operación no cambia el resultado más de una vez |
| **JAR** | El programa Java empaquetado en un solo archivo ejecutable con `java -jar` |
| **JPA** | El estándar de Java para guardar objetos en una base relacional |
| **`machine-id`** | Identificador único de una instalación de Linux. Si se repite en clones, causa conflictos de red |
| **MDC** | Contexto de los logs donde se guarda el `correlationId` para que aparezca en cada línea |
| **NTP** | Protocolo para sincronizar la hora |
| **REST** | Estilo de API sobre HTTP con recursos, métodos y JSON |
| **`RestClient`** | Cliente HTTP de Spring que usa el emisor para llamar al receptor |
| **Swagger / OpenAPI** | Documentación interactiva de la API |
| **systemd** | Administrador de servicios de Linux |
| **Timeout** | Tiempo máximo de espera de una operación |
| **VLAN** | Red virtual separada dentro de la misma infraestructura física |
