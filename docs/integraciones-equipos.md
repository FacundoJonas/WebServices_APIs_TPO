# Integración del Portal Web con el ecosistema DeliveryGo

> Equipo Web (Portal integrador) · actualizado el 2026-11-17
> Contrato de referencia: **`doc/swagger-ecosistema.yaml`** — *DeliveryGo API, Consolidado MVP Ecosistema Completo* v1.4.0
> (el publicado por la cátedra; es el mismo archivo que `swagger-ecosistema.txt` del repo de Pedidos).
> Para verlo: <https://editor.swagger.io/> → *File → Import file* con ese archivo.

Este documento registra **qué consume el Portal de cada módulo, contra qué contrato y en qué estado está**,
para la trazabilidad CU → pantalla → servicio → endpoint → DTO.

---

## 1. Repositorios de los equipos

| Grupo | Módulo | Repo | Rama | Contrato propio | Servicio del Portal |
|---|---|---|---|---|---|
| 1 | Notificaciones | [FrancoPedreira/DeliveryGo-Notificaciones](https://github.com/FrancoPedreira/DeliveryGo-Notificaciones) | `main` | `doc/openapi.yaml` | `notificacionesServicie.js` |
| 2 | Usuarios y Autenticación | [CarlaGorgal2002/deliverygo-usuarios-auth](https://github.com/CarlaGorgal2002/deliverygo-usuarios-auth) | `main` | `doc/openapi/deliverygo-usuarios.yaml` | `authServicie.js`, `userServicie.js` |
| 3 | Pagos | [JulianaGomez15/Aplicaciones_Interactivas_-_E3_-_Modulo_de_Pagos](https://github.com/JulianaGomez15/Aplicaciones_Interactivas_-_E3_-_Modulo_de_Pagos) | `master` | `docs/openapi.yaml` | `pagosServicie.js` |
| 4 | Opiniones y Analítica | [emigsm/tpo-deliverygo-g4-ops-analitica](https://github.com/emigsm/tpo-deliverygo-g4-ops-analitica/tree/develop) | `develop` | `docs/api/openapi.yaml` | `analiticaServicie.js`, `opinionesServicie.js` |
| 5 | Repartidores y Logística | [Nicosantillan96/tpo-deliverygo-repartidores-logistica](https://github.com/Nicosantillan96/tpo-deliverygo-repartidores-logistica) | `main` | `doc/openapi.yaml` | — (sin GET para el Portal) |
| 5 (?) | Pedidos | [santi28/uade-deliverygo-ms-orders](https://github.com/santi28/uade-deliverygo-ms-orders) | `main` | `doc/openapi.yaml` | `pedidosServicie.js` |
| 7 | Comercios y Catálogo | [tomypedreira-a11y/catalogo-deliverygo](https://github.com/tomypedreira-a11y/catalogo-deliverygo) | `main` | `doc/openapi.yaml` | `catalogoServicie.js` |

> ⚠️ En la lista de la cátedra Envío y Pedidos figuran ambos como Grupo 5 y falta el 6; el `.env` usa otra
> numeración (Equipo 001…008). Unificar antes del oral.

---

## 2. Arquitectura de integración del Portal

```
Navegador ──> localhost:5173/<prefijo>/api/v1/...  ──(proxy de Vite)──>  http://<ip-módulo>:<puerto>/api/v1/...
```

| Pieza | Archivo | Qué hace |
|---|---|---|
| Prefijos por módulo | `src/servicies/api.js` | `USUARIOS_URL`, `CATALOGO_URL`, `PEDIDOS_URL`, `PAGOS_URL`, `LOGISTICA_URL`, `NOTIF_URL`, `ANALITICA_URL` (leídos de `VITE_*_URL`). |
| Proxy | `vite.config.js` | Tabla `modulos`: un proxy por prefijo hacia `*_PROXY_TARGET`. Evita CORS en desarrollo. |
| Cliente HTTP común | `src/servicies/http.js` | `pedir()`: JWT Bearer, `X-Correlation-Id`, lectura de `ErrorResponse`, mensajes de RN-11. |
| Servicios | `src/servicies/*Servicie.js` | Uno por módulo. Arman los request del contrato y **mapean el DTO al formato de las pantallas**; las pantallas no conocen el contrato. |
| Mocks | `src/servicies/mocks/` | Interruptor `USE_MOCK` por servicio para trabajar sin el módulo levantado. |

**Seguridad.** El consolidado define JWT Bearer global: Usuarios emite el token y los demás lo validan.
Para que funcione, **todos los módulos deben usar la misma clave** (`JWT_SECRET`). Estado en los repos (16/11):
Usuarios, Notificaciones y Catálogo leen `JWT_SECRET`; Pagos la tiene fija (y además su propio `/auth/login`);
Analítica la tiene comentada; Pedidos y Logística no validan JWT. Los GET de Catálogo son públicos.

---

## 3. Flujo transversal del enunciado y rol del Portal

| Paso | Resultado funcional | Módulos | Portal | CU |
|---|---|---|---|---|
| 1 | Usuario se registra e inicia sesión | Portal ↔ Usuarios | ✅ integra | CU-01 |
| 2 | Explora comercios y productos | Portal ↔ Catálogo | ✅ integra | CU-02 |
| 3 | Arma el carrito y solicita un pedido | Portal ↔ Pedidos ↔ Catálogo | ✅ integra (Pedidos) | CU-03 |
| 4 | Pedido valida usuario, catálogo, precio y stock | Pedidos ↔ Usuarios/Catálogo | ❌ interno — muestra errores | CU-03 |
| 5 | Se procesa el pago simulado | Pedidos ↔ Pagos | ✅ el Checkout confirma en Pedidos y Pedidos cobra con Pagos (D1) | CU-04 |
| 6 | Pedido queda confirmado | Pedidos | lee el estado | CU-04/05 |
| 7 | Se crea/asigna la entrega | Pedidos ↔ Logística | ❌ interno | — |
| 8 | Se notifican cambios relevantes | Módulos ↔ Notificaciones | lectura (lista / marca leídas) | CU-08 |
| 9 | Cliente sigue pedido y entrega | Portal ↔ Pedidos/Logística | ✅ vía `GET /orders/{id}` | CU-05, CU-07 |
| 10 | Pedido entregado y calificable | Logística/Pedidos ↔ Opiniones | ✅ envía la reseña | CU-09 |
| 11 | Métricas del proceso | Analítica ↔ Pedidos/Pagos/Logística | lectura del tablero | CU-10 |

---

## 4. Matriz CU → servicio → endpoint del contrato

| CU | Pantalla | Función del servicio | Endpoint (contrato) | DTO | Estado |
|---|---|---|---|---|---|
| CU-01 | `/login` | `authServicie.login` / `register` | `POST /api/v1/auth/login`, `POST /api/v1/auth/register` | LoginRequest/Response, RegistrarUsuarioRequest | ✅ alineado |
| CU-01 | `/login` (registro) | `userServicie.crearDireccion` | `POST /api/v1/users/{id}/addresses` ¹ | CrearDireccionRequest → DireccionResponse | ✅ alineado |
| CU-02 | `/inicio`, `/comercio/:id` | `catalogoServicie.obtenerComercios` / `obtenerComercioPorId` | `GET /api/v1/catalogo`, `GET /api/v1/comercios/{id}` ¹ | CatalogoResponseDTO, ProductoResponseDTO, ComercioResponseDTO | ✅ alineado |
| CU-03 | `/carrito` | `pedidosServicie.crearPedido` | `POST /api/v1/orders` + `POST /api/v1/orders/{id}/items` (`X-Cliente-Id`) | CrearPedidoRequest, AgregarItemsPedidoRequest → PedidoResponse | ✅ alineado |
| CU-03 | `/carrito` | `pedidosServicie.aplicarCupon` | — no existe en ningún contrato | — | 🟡 siempre mock (D6) |
| CU-04 | `/pagar` | `pedidosServicie.confirmarPedido` | `POST /api/v1/orders/{id}/confirm` (`X-Cliente-Id`) | ConfirmarPedidoRequest { medioPago } → PedidoResponse | ✅ conectado al Checkout (D1) |
| CU-04 | — | `pagosServicie.*` | `POST /api/v1/payments`, `GET /api/v1/payments/{codigoPago}` | CrearPagoRequest → PagoResponse | Alineado pero sin uso en pantallas: el cobro lo hace Pedidos (paso 5) |
| CU-05 | `/inicio` (tarjeta "Pedido en curso") | `pedidosServicie.obtenerPedido` + `homePage/seguimientoPedido.js` | `GET /api/v1/orders/{id}` (`X-Cliente-Id`), cada 20 s hasta ENTREGADO/CANCELADO | PedidoResponse (estado + historial) | ✅ conectado |
| CU-06 | `/perfil` | `userServicie.obtenerUsuarioPorId` | `GET /api/v1/users/{id}` + `GET /api/v1/users/{id}/addresses` ¹ | UsuarioResponse, DireccionResponse | ✅ alineado |
| CU-06 | `/perfil` (datos personales) | `userServicie.actualizarPerfil` | `PUT /api/v1/users/{id}` ¹ | ModificarPerfilRequest → UsuarioResponse | ✅ conectado |
| CU-06 | `/perfil` (direcciones) | `userServicie.crearDireccion` / `marcarDireccionPredeterminada` / `eliminarDireccion` | `POST /api/v1/users/{id}/addresses`, `PATCH …/addresses/{addressId}/default`, `DELETE …/addresses/{addressId}` ¹ | CrearDireccionRequest → DireccionResponse | ✅ conectado (D12) |
| CU-07 | `/pedidos` | `pedidosServicie.listarPedidos` | — no existe en ningún contrato | — | 🟡 siempre mock (D4) |
| CU-08 | `/notificaciones` | `notificacionesServicie.*` | `GET /api/v1/users/{id}/notifications`, `GET/PATCH /api/v1/notifications/{id}[/read]`, `GET /api/v1/channels` | NotificacionResponseDto | ✅ conectado |
| CU-09 | `/pedido` | `opinionesServicie.crearResena` | `POST /api/v1/reviews` (`X-Usuario-Id`, `X-Correlation-Id`) | ResenaRequest { pedidoId int64 } → ResenaResponse | ✅ alineado (D10) |
| CU-09 | `/pedido` | `opinionesServicie.obtenerRating*` | `GET /api/v1/merchants/{id}/rating`, `GET /api/v1/couriers/{id}/rating` | RatingResponse | ✅ listo |
| CU-10 | `/admin/metricas` | `analiticaServicie.obtenerTablero` | `GET /api/v1/analytics/dashboard?periodoDesde=&periodoHasta=` | DashboardResponse, MetricaResumen | ✅ alineado (parcial) |

¹ Está en el contrato propio del módulo pero **no** en el consolidado v1.4.0.

**Datos que las pantallas muestran y el contrato no tiene** (quedan con valor neutro "—" en el mapeo):
rating, tiempo y costo de envío del comercio (son de Opiniones/Logística), descripción e imagen de productos,
desglose envío/tarifa/descuento del pedido, facturación, variación, pedidos por día y rankings del tablero.

---

## 5. Decisiones pendientes con otros equipos

| ID | Tema | Con quién | Propuesta |
|---|---|---|---|
| D1 | ¿Quién dispara el pago? | Pedidos + Pagos | ✅ **Resuelto (16/11):** el Checkout llama `POST /orders/{id}/confirm { medioPago }` y Pedidos cobra con Pagos, como dice el paso 5 del flujo. Respuestas: CONFIRMADO (aprobado), BORRADOR con `pagoId` (pago PENDIENTE), 422 `PAYMENT_REJECTED` (rechazo, se puede reintentar), 503 (Pagos caído). Con el perfil `integracion`, Pedidos necesita a Pagos levantado. |
| D2 | Clave JWT compartida | Todos | Mismo `JWT_SECRET` en todos; Pagos y Analítica deben hacerla configurable. |
| D3 | Medios de pago | Pagos | Los ids del Checkout (`visa-4821`…) son de demo; usar los `codigoMedioPago` registrados en `/payment-methods`. |
| D4 | Historial de pedidos (CU-07) | Pedidos | Ningún contrato tiene un listado por usuario. Consultar al equipo si lo van a publicar; hasta entonces, mock. |
| D5 | Seguimiento de entrega (CU-05) | Logística | Logística no publica ningún GET. El seguimiento usa el estado e historial de `GET /api/v1/orders/{id}` (Pedidos). |
| D6 | Cupones | Pedidos | Fuera del MVP del ecosistema: se deja simulado o se quita de la pantalla. |
| D7 | Direcciones y perfil en el consolidado | Usuarios / cátedra | Se usan los de su Swagger propio (`users/{id}`, `addresses`); falta que estén en el consolidado. |
| D8 | Tipos de id entre módulos | Pedidos + Usuarios | El código de Pedidos usa `comercioId`/`productoId` numéricos (compatibles con Catálogo) aunque su Swagger diga UUID; cliente y dirección son UUID de su Usuarios simulado (`DatosMock`), y Usuarios usa ids numéricos. El Portal manda el cliente/dirección de prueba de Pedidos cuando el id no es UUID. |
| D9 | Token para Notificaciones | Notificaciones + Usuarios | Su back exige JWT firmado con la clave compartida (claims `sub`, `role`). Con Usuarios simulado, cargar un token válido en `VITE_TOKEN_DEMO`. |
| D10 | `pedidoId` de la reseña | Opiniones + Pedidos | `ResenaRequest.pedidoId` es int64, pero Pedidos identifica los pedidos con UUID. Opiniones valida el pedido contra su Pedidos simulado (`PedidosClientMock`: pedidos 1 y 2 ENTREGADOS, 3 EN_CAMINO, todos del usuario 100). Hasta que acuerden el tipo, la reseña se demuestra con el pedido 1 y el usuario 100. El Portal manda el id como número cuando es numérico. |
| D11 | Identidad y rol en Opiniones/Analítica | Opiniones y Analítica | No validan JWT (clave comentada): el usuario va en `X-Usuario-Id` y el tablero no controla el rol ADMIN en el back; el Portal lo restringe con `ProtectedRoute` (RN-10). Su puerto por defecto es 8089, el mismo que Notificaciones: si corren en la misma máquina, uno tiene que cambiarlo. |
| D12 | Código postal obligatorio | Usuarios | `CrearDireccionRequest` exige `codigoPostal` (y `numero`, `ciudad`, `provincia`). Se agregó el campo en el registro y en "Agregar dirección". En el Portal, "barrio" se manda como `ciudad` y la zona CABA/GBA como `provincia`. Etiqueta e indicaciones no están en el contrato: quedan sólo en la sesión del Portal. |

---

## 6. Día de integración (17/11): Catálogo, Pedidos y Notificaciones

> **Estado 17/11:** el commit `3ec088c` puso los 8 `USE_MOCK` en `false`, y se sacaron los datos de demostración que
> quedaban en los componentes: carrito inicial y comercio "La Birra Bar", dirección fija del Checkout, pedido
> "#AR-8942" del Home y de Notificaciones, y pedido "DG-92813", repartidor y reseñas de ejemplo en Calificar.
> Ahora el carrito arranca vacío, la dirección es la predeterminada de Usuarios, el seguimiento y la reseña usan el
> último pedido confirmado (`GET /orders/{id}`) y el promedio sale de `GET /merchants/{id}/rating`.
> **Siguen simulados por no existir en ningún contrato:** cupones (D6) e historial "Mis pedidos" (D4).
> **Siguen con datos de prueba de otro módulo:** `X-Cliente-Id` `1111…` y `direccionEntregaId` `aaaa…`, porque Pedidos
> valida siempre contra su `UsuariosClientMock` (no tiene cliente HTTP de Usuarios ni en el perfil `integracion`, D8).

En `main` todos los servicios quedan con `USE_MOCK = true`. El 17 sólo hay que cambiar estas líneas a `false`:

| Módulo | Archivo | Línea | Endpoints que empieza a consumir |
|---|---|---|---|
| Catálogo | `src/servicies/catalogoServicie.js` | `const USE_MOCK = true;` | `GET /api/v1/catalogo`, `GET /api/v1/comercios/{id}` |
| Pedidos | `src/servicies/pedidosServicie.js` | `const USE_MOCK = true;` | `POST /api/v1/orders`, `POST /api/v1/orders/{id}/items`, `GET /api/v1/orders/{id}`, `POST /api/v1/orders/{id}/confirm` |
| Notificaciones | `src/servicies/notificacionesServicie.js` | `const USE_MOCK = true;` | `GET /api/v1/templates`, `GET /api/v1/users/{id}/notifications`, `GET /api/v1/notifications/{id}`, `PATCH /api/v1/notifications/{id}/read`, `GET /api/v1/channels` |

**Antes de apagar los mocks**

1. En `.env.local`, cargar la dirección de cada módulo y reiniciar `npm run dev`:
   ```
   CATALOGO_PROXY_TARGET=http://<ip-catalogo>:8082
   PEDIDOS_PROXY_TARGET=http://<ip-pedidos>:<puerto>
   NOTIF_PROXY_TARGET=http://<ip-notificaciones>:8089
   ```
2. Pedidos tiene que correr con el perfil **`integracion`** y `CATALOGO_BASE_URL` apuntando a Catálogo. Si no,
   valida contra su catálogo simulado (comercios 10/20, productos 1–4) y rechaza los productos reales.
3. Notificaciones necesita un JWT válido (D9). Si Usuarios está levantado con la misma `JWT_SECRET`, alcanza
   con loguearse. Si no, poner en `.env.local` `VITE_TOKEN_DEMO=<token firmado con la clave compartida>`.
4. Correr `npm run test:contrato`: verifica que el Portal arme los requests tal como dice el Swagger.

**Recorrido para mostrar (pasos 2, 3, 5, 6, 8 y 9 del flujo)**

1. `/inicio` lista los comercios reales de Catálogo (CU-02).
2. Entrar a un comercio, agregar productos: el carrito pasa a ese comercio (un pedido = un comercio).
3. `/carrito` → confirmar: Pedidos crea el borrador y agrega los ítems; valida catálogo, precio y stock (CU-03, paso 4).
4. `/pagar` → elegir medio y confirmar: Pedidos cobra con Pagos y el pedido queda CONFIRMADO (CU-04, pasos 5 y 6).
   Con un rechazo (422 `PAYMENT_REJECTED`) aparece el banner de RN-05 y se reintenta con otro medio.
5. "Seguir mi pedido" → `/inicio`: la tarjeta "Pedido en curso" muestra el estado y las horas del historial de
   `GET /orders/{id}` y se actualiza sola (CU-05, paso 9). Repartidor y mapa no se muestran: Logística no publica GET.
6. `/notificaciones`: aparecen las notificaciones del usuario y se pueden marcar como leídas (CU-08).
7. Errores esperables: producto sin stock (mensaje de Pedidos), comercio inexistente (404), token inválido (401).

**Si algo falla:** volver ese servicio a `USE_MOCK = true`, anotar el motivo en la sección 4 y seguir con el resto.

---

## 7. Resto de los módulos: Usuarios, Opiniones y Analítica, Pagos y Logística

Mismo mecanismo que la sección 6: en `main` quedan con `USE_MOCK = true` y se apagan **de a uno, un commit por archivo**.
Todos están cubiertos por `npm run test:contrato` (38 controles: Catálogo, Pedidos, Notificaciones, Usuarios, Opiniones y Analítica).

| Módulo | Archivo(s) | Endpoints que empieza a consumir | Proxy en `.env.local` |
|---|---|---|---|
| Usuarios (CU-01, CU-06) | `src/servicies/authServicie.js` **y** `src/servicies/userServicie.js` (los dos juntos: el login pide el perfil) | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET/PUT /api/v1/users/{id}`, `GET/POST /api/v1/users/{id}/addresses`, `PATCH …/addresses/{addressId}/default`, `DELETE …/addresses/{addressId}` | `USUARIOS_PROXY_TARGET` |
| Opiniones (CU-09) | `src/servicies/opinionesServicie.js` | `POST /api/v1/reviews`, `GET /api/v1/merchants/{id}/rating`, `GET /api/v1/couriers/{id}/rating` | `OPINIONES_ANALITICA_PROXY_TARGET` |
| Analítica (CU-10) | `src/servicies/analiticaServicie.js` | `GET /api/v1/analytics/dashboard?periodoDesde=&periodoHasta=` | `OPINIONES_ANALITICA_PROXY_TARGET` |
| Pagos (CU-04) | `src/servicies/pagosServicie.js` | Ninguno desde las pantallas: el cobro lo hace Pedidos (D1). Queda alineado a `POST /api/v1/payments` por si se necesita consultar un pago. | `PAGOS_PROXY_TARGET` |
| Logística (pasos 7 y 9) | — | Ninguno: el consolidado sólo tiene operaciones de repartidores y entregas para otros módulos, sin GET para el cliente (D5). El seguimiento sale de Pedidos. | — |

**Orden recomendado para apagar los mocks**

1. **Usuarios primero.** Con el login real, el token que emite Usuarios es el que usan Notificaciones (y Catálogo si
   valida). Requisito: misma `JWT_SECRET` en Usuarios, Notificaciones y Catálogo (D2). Al apagarlo, `VITE_TOKEN_DEMO`
   deja de usarse.
2. **Opiniones y Analítica** (un solo módulo, dos archivos, dos commits). Confirmar IP y puerto (D11).
3. Pagos no se apaga en el Portal: se demuestra a través de Pedidos (sección 6).

**Recorrido para mostrar (pasos 1, 10 y 11 del flujo)**

1. `/login` → "Crear cuenta": `POST /auth/register` y después `POST /auth/login`; la dirección (con código postal)
   se crea con `POST /users/{id}/addresses` como predeterminada (CU-01, paso 1).
2. Email repetido → 409 "Ya existe una cuenta con ese correo electrónico". Clave incorrecta → 401.
3. `/perfil`: editar nombre o teléfono (`PUT /users/{id}`); agregar otra dirección, marcarla predeterminada y
   eliminar una (CU-06). Si el módulo responde error, el perfil no cambia y se muestra el mensaje.
4. `/pedido` (calificar): estrellas al comercio y al repartidor → `POST /reviews` (CU-09, paso 10). Por D10, con
   el usuario 100 y el pedido 1 de los datos de prueba de Opiniones. Calificar dos veces → 409 "Ya calificaste este pedido";
   pedido no entregado → 422 con el mensaje del módulo (RN-08).
5. `/admin/metricas` con un usuario ADMIN: `GET /analytics/dashboard` del período elegido (CU-10, paso 11). Cada
   bloque indica su fuente (RN-09); las métricas que el módulo no informa muestran su error sin romper el resto (RN-11).

**Si algo falla:** igual que en la sección 6: ese servicio vuelve a `USE_MOCK = true` y se anota el motivo.
