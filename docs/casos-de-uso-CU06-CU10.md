# Casos de uso de evolución: CU-06 a CU-10

> Equipo 8 · Portal Web Integrador · DeliveryGo
> Formato: ficha del *Template Guía Primera Entrega* adaptada a Frontend
> (cadena **CU → RN → PNT → CMP → NAV → SEC → API consumida → DTO → INT**).

Los identificadores nuevos (RN-06 en adelante, PNT, CMP, NAV, API, DTO, INT) son **propuestos**:
hay que ajustarlos a la matriz maestra del equipo para que no choquen con los ya usados en CU-01 a CU-05.

---

## Resumen

| CU | Nombre | Prioridad | Pantalla | Estado en el código |
|---|---|---|---|---|
| CU-06 | Consultar o modificar perfil y direcciones | Evolución | PNT-11 Mi perfil (`/perfil`) | ❌ Falta |
| CU-07 | Consultar historial de pedidos | Evolución | PNT-09 Mis pedidos (`/pedidos`) | ❌ Falta |
| CU-08 | Visualizar notificaciones | Evolución | PNT-12 Notificaciones (`/notificaciones`) | ✅ `NotificationsPage` |
| CU-09 | Calificar comercio y repartidor | Evolución | PNT-13 Calificar (`/pedido`) | ✅ `OrderReviewPage` |
| CU-10 | Visualizar métricas administrativas | Evolución | PNT-10 Métricas (`/admin/metricas`) | ❌ Falta |

---

## Reglas de negocio nuevas

El Portal **no implementa lógica de negocio propia** (enunciado 4.8): estas reglas son las que la
interfaz respeta o valida antes de llamar al módulo dueño, que es quien las aplica de verdad.

| ID | Regla | CU relacionados | Dueño / dónde se valida |
|---|---|---|---|
| RN-01 | No puede confirmarse una operación con información obligatoria faltante. *(ya existe)* | CU-03, CU-04, CU-06, CU-09 | Formularios del Portal + módulo dueño |
| RN-06 | Un usuario sólo puede ver y modificar sus propios datos, pedidos y notificaciones. | CU-06, CU-07, CU-08 | `ProtectedRoute` + JWT (Usuarios) |
| RN-07 | El email es único y la contraseña nunca se muestra ni se guarda en el cliente. | CU-06 | Módulo Usuarios |
| RN-08 | Sólo los pedidos entregados pueden calificarse, con una reseña por usuario y pedido. | CU-07, CU-09 | Módulo Opiniones y Analítica |
| RN-09 | Toda métrica debe indicar período y fuente. | CU-10 | Módulo Opiniones y Analítica |
| RN-10 | Sólo el rol ADMIN accede a las métricas administrativas. | CU-10 | `ProtectedRoute` por rol + JWT |
| RN-11 | Ante errores 4xx/5xx o fallos parciales se muestra un mensaje comprensible sin romper la pantalla. | CU-06 a CU-10 | Clientes HTTP del Portal (`src/servicies/`) |

---

## CU-06 · Consultar o modificar perfil y direcciones

| Campo | Contenido |
|---|---|
| ID | CU-06 |
| Nombre | Consultar o modificar perfil y direcciones |
| Actor principal | Cliente |
| Objetivo | Ver y actualizar sus datos personales y administrar las direcciones de entrega. |
| Precondiciones | Sesión iniciada (CU-01); token válido. |
| Flujo principal | 1. El cliente abre "Mi perfil" desde el header. 2. El Portal pide los datos del usuario. 3. Se muestran nombre, email, teléfono y direcciones. 4. El cliente edita sus datos o agrega una dirección. 5. El Portal valida los campos obligatorios. 6. Envía la actualización al módulo Usuarios. 7. Muestra confirmación y refresca los datos de la sesión (nombre en el header). |
| Flujos alternativos | A1. Campos obligatorios vacíos o con formato inválido → se marca el campo y no se envía. A2. Email ya registrado (409) → mensaje "Ese email ya está en uso". A3. Token vencido (401) → cierra sesión y redirige a `/login`. A4. Error del servidor (5xx) → mensaje y botón "Reintentar"; no se pierden los cambios del formulario. |
| Resultado | Perfil y/o direcciones actualizados en el módulo Usuarios y reflejados en la sesión. |
| RN asociadas | RN-01, RN-06, RN-07, RN-11 |
| Pantalla / componentes | PNT-11 Mi perfil · CMP-20 Formulario de datos personales · CMP-21 Lista de direcciones · CMP-22 Formulario de nueva dirección |
| Navegación | NAV-11 Header (avatar) → Mi perfil · NAV-12 Checkout (`DeliveryAddress`) → "Agregar dirección" |
| Secuencia | SEC-06 |
| API consumida / DTO | API-11 `GET /api/v1/users/{id}` → DTO-10 UsuarioResponse · API-12 `PUT /api/v1/users/{id}` ← DTO-11 ActualizarUsuarioRequest · API-13 `POST /api/v1/users/{id}/addresses` ← DTO-12 DireccionRequest |
| Integración | INT Usuarios (Equipo 1) |

---

## CU-07 · Consultar historial de pedidos

| Campo | Contenido |
|---|---|
| ID | CU-07 |
| Nombre | Consultar historial de pedidos |
| Actor principal | Cliente |
| Objetivo | Ver los pedidos realizados, su estado y acceder al seguimiento o a la calificación. |
| Precondiciones | Sesión iniciada (CU-01). |
| Flujo principal | 1. El cliente abre "Mis pedidos". 2. El Portal pide la lista de pedidos del usuario. 3. Se muestran ordenados del más reciente al más antiguo (comercio, número, fecha, total y estado). 4. El cliente filtra por "Todos / En curso / Entregados / Cancelados". 5. Elige un pedido: si está en curso va al seguimiento (CU-05); si está entregado y sin reseña puede ir a calificar (CU-09). |
| Flujos alternativos | A1. El cliente no tiene pedidos → estado vacío con botón "Explorar comercios" (CU-02). A2. El filtro no tiene resultados → mensaje dentro de la lista. A3. Pedido entregado que ya fue calificado → se muestra "Calificado" en lugar del botón (RN-08). A4. Error al cargar (5xx) o servicio no disponible → mensaje y "Reintentar" (RN-11). A5. Token vencido (401) → redirige a `/login`. |
| Resultado | El cliente ve su historial y puede seguir o calificar un pedido. |
| RN asociadas | RN-06, RN-08, RN-11 |
| Pantalla / componentes | PNT-09 Mis pedidos · CMP-23 Tarjeta de pedido · reutiliza `FilterTabs` y `EmptyState` (Notificaciones) |
| Navegación | NAV-13 Header → Mis pedidos · NAV-14 Pedido en curso → PNT-08 Seguimiento · NAV-15 Pedido entregado → PNT-13 Calificar |
| Secuencia | SEC-07 |
| API consumida / DTO | API-14 `GET /api/v1/orders?userId={id}` → DTO-13 lista de PedidoResumenResponse · API-15 `GET /api/v1/orders/{id}` → DTO-05 PedidoResponse |
| Integración | INT Pedidos (Equipo 3) |

> **Pendiente de acordar con Pedidos:** el enunciado sólo publica `GET /api/v1/orders/{id}`.
> El listado por usuario (API-14) hay que pedirlo como contrato nuevo; mientras no exista se usa
> un mock declarado.

---

## CU-08 · Visualizar notificaciones

| Campo | Contenido |
|---|---|
| ID | CU-08 |
| Nombre | Visualizar notificaciones |
| Actor principal | Cliente |
| Objetivo | Consultar los avisos recibidos (pedidos, promociones, sistema) y marcarlos como leídos. |
| Precondiciones | Sesión iniciada (CU-01). |
| Flujo principal | 1. El cliente abre Notificaciones desde el header. 2. El Portal pide el historial de notificaciones del usuario. 3. Se muestran agrupadas por fecha (Hoy / Esta semana / Anteriores) con el contador de no leídas. 4. El cliente filtra por "Todas / Pedidos / Promociones / Sistema". 5. Marca una o todas como leídas. 6. Puede usar la acción de cada aviso (por ejemplo "Calificar pedido" → CU-09). |
| Flujos alternativos | A1. Sin notificaciones o filtro vacío → `EmptyState`. A2. Todas leídas → el botón "Marcar todas como leídas" queda deshabilitado. A3. Error al cargar (5xx) → mensaje y "Reintentar" (RN-11). A4. Token vencido (401) → redirige a `/login`. |
| Resultado | El cliente ve sus notificaciones y su estado de lectura queda actualizado. |
| RN asociadas | RN-06, RN-11 |
| Pantalla / componentes | PNT-12 Notificaciones · `FilterTabs`, `NotificationGroup`, `NotificationCard`, `ActiveOrderBanner`, `InfoTile`, `EmptyState` |
| Navegación | NAV-16 Header (campana) → Notificaciones · NAV-17 Acción "Calificar pedido" → PNT-13 |
| Secuencia | SEC-08 |
| API consumida / DTO | API-16 `GET /api/v1/users/{id}/notifications` → DTO-14 lista de NotificacionResponse |
| Integración | INT Notificaciones (Equipo 6) |

> **Estado actual:** la pantalla existe pero usa datos fijos dentro de `NotificationsPage.jsx`.
> Falta crear `notificacionesServicie.js` con su mock, como en los otros servicios.

---

## CU-09 · Calificar comercio y repartidor

| Campo | Contenido |
|---|---|
| ID | CU-09 |
| Nombre | Calificar comercio y repartidor |
| Actor principal | Cliente |
| Objetivo | Dejar una reseña del comercio y del repartidor de un pedido entregado. |
| Precondiciones | Sesión iniciada; pedido en estado ENTREGADO y sin reseña previa del usuario. |
| Flujo principal | 1. El cliente llega desde Mis pedidos (CU-07) o desde una notificación (CU-08). 2. El Portal muestra el resumen del pedido, el comercio y el repartidor. 3. El cliente elige las estrellas, opciones rápidas y un comentario opcional. 4. El Portal valida que haya puntuación. 5. Envía la reseña al módulo Opiniones. 6. Muestra el modal de éxito y el resumen de calificaciones. |
| Flujos alternativos | A1. Sin estrellas seleccionadas → no se permite enviar (RN-01). A2. El pedido no está entregado (409/422) → mensaje "Sólo se pueden calificar pedidos entregados" (RN-08). A3. Ya existe una reseña (409) → mensaje "Ya calificaste este pedido" (RN-08). A4. Error del servidor → mensaje y "Reintentar" sin perder lo escrito (RN-11). |
| Resultado | Reseña registrada; el pedido aparece como "Calificado" en el historial. |
| RN asociadas | RN-01, RN-08, RN-11 |
| Pantalla / componentes | PNT-13 Calificar · `RatingStars`, `QuickChip`, `OrderSummary`, `ReviewCard`, `RatingSummary`, `SuccessModal` |
| Navegación | NAV-15 Mis pedidos → Calificar · NAV-17 Notificación → Calificar · NAV-18 Modal de éxito → Inicio |
| Secuencia | SEC-09 |
| API consumida / DTO | API-17 `POST /api/v1/reviews` ← DTO-15 ReseñaRequest · `GET /api/v1/merchants/{id}/rating` y `GET /api/v1/couriers/{id}/rating` → DTO-16 PromedioResponse |
| Integración | INT Opiniones y Analítica (Equipo 7) · INT Pedidos (estado del pedido) |

> **Estado actual:** la pantalla existe con datos fijos y la ruta `/pedido` no recibe el id del
> pedido. Para cerrar la trazabilidad conviene pasarla a `/pedidos/:id/calificar` y agregar el
> servicio de reseñas con mock.

---

## CU-10 · Visualizar métricas administrativas

| Campo | Contenido |
|---|---|
| ID | CU-10 |
| Nombre | Visualizar métricas administrativas |
| Actor principal | Administrador |
| Objetivo | Consultar los indicadores operativos del ecosistema en un período. |
| Precondiciones | Sesión iniciada con rol ADMIN. |
| Flujo principal | 1. El administrador entra a "Métricas". 2. El Portal pide el tablero con el período por defecto (últimos 7 días). 3. Se muestran indicadores (pedidos, facturación, ticket promedio, calificación promedio), pedidos por día, distribución de estados, pagos aprobados/rechazados y top comercios. 4. El administrador cambia el período (Hoy / 7 días / 30 días). 5. El Portal vuelve a pedir el tablero y actualiza todo. 6. Cada bloque indica período y fuente. |
| Flujos alternativos | A1. Usuario sin rol ADMIN → no ve el acceso y si entra por URL se lo redirige a Inicio (RN-10). A2. Período sin datos → indicadores en cero con mensaje "Sin actividad en el período". A3. Un bloque falla y el resto no (fallo parcial) → sólo ese bloque muestra error y "Reintentar" (RN-11). A4. Token vencido (401) → redirige a `/login`. |
| Resultado | El administrador visualiza las métricas del período elegido con su fuente identificada. |
| RN asociadas | RN-09, RN-10, RN-11 |
| Pantalla / componentes | PNT-10 Métricas · CMP-24 Selector de período · CMP-25 Tarjeta de indicador · CMP-26 Gráfico de pedidos por día · CMP-27 Tabla de top comercios · reutiliza `InfoTile` y `RatingSummary` |
| Navegación | NAV-19 Header (sólo ADMIN) → Métricas · NAV-20 Acceso sin rol → Inicio |
| Secuencia | SEC-10 |
| API consumida / DTO | API-18 `GET /api/v1/analytics/dashboard?desde=&hasta=` → DTO-17 TableroResponse |
| Integración | INT Opiniones y Analítica (Equipo 7) |

> **Falta en el código:** `ProtectedRoute` hoy sólo controla que haya sesión. Para RN-10 hay que
> agregarle un control de rol (por ejemplo `<ProtectedRoute roles={["ADMIN"]} />`).
