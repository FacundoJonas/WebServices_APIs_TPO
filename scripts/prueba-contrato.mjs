/*
 * Prueba de contrato del Portal contra doc/swagger-ecosistema.yaml.
 *
 * Ejecuta los servicios reales con USE_MOCK apagado (sólo en memoria, no
 * modifica los archivos) y con un fetch simulado que responde con la forma
 * exacta de los DTO del Swagger. Verifica URL, método, headers y body que
 * manda el Portal, y que la respuesta se mapee a lo que usan las pantallas.
 *
 * Uso: npm run test:contrato
 */
import { createServer } from 'vite';
const root = process.cwd();
const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true, hmr: false },
  plugins: [{ name: 'sin-mock', transform(code, id) { if (id.includes('/servicies/') && !id.includes('/mocks/')) return code.replace('const USE_MOCK = true;', 'const USE_MOCK = false;'); } }] });
const store = {}; globalThis.sessionStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v) }, removeItem: k => { delete store[k] } };
store.token = 'jwt-de-prueba'; store.usuario = JSON.stringify({ id: 2, direcciones: [] });
const llamadas = []; let rutas = [];
globalThis.fetch = async (url, op = {}) => { llamadas.push({ url, method: op.method ?? 'GET', headers: op.headers, body: op.body && JSON.parse(op.body) });
  const r = rutas.find(([re]) => re.test(url)); if (!r) return new Response('{}', { status: 404 });
  const [, status, body] = r; if (status === 204) return new Response(null, { status }); return new Response(JSON.stringify(typeof body === 'function' ? body(url, op) : body), { status }); };
const ok = (c, m) => { console.log(`${c ? 'OK  ' : 'FALLA'} ${m}`); if (!c) process.exitCode = 1; };

// ── Catálogo ──
const prod = (id, comercioId, cat) => ({ id, nombre: `Prod ${id}`, precio: 1000 + id, disponible: true, estado: 'ACTIVO', comercioId, categorias: [{ id: cat, nombre: `Cat ${cat}` }] });
const todos = Array.from({ length: 130 }, (_, i) => prod(i + 1, i < 100 ? 10 : 20, i % 3));
rutas = [
  [/\/catalogo-api\/api\/v1\/catalogo\?/, 200, (url) => { const q = new URL(url, 'http://x').searchParams; const page = +q.get('page'), size = +q.get('size'); const cid = q.get('comercioId'); const f = cid ? todos.filter(p => String(p.comercioId) === cid) : todos; return { items: f.slice(page * size, page * size + size), page, size, total: f.length }; }],
  [/\/catalogo-api\/api\/v1\/comercios\/10$/, 200, { id: 10, cuit: '30-1', razonSocial: 'Pizzería Demo', estado: 'ACTIVO' }],
  [/\/catalogo-api\/api\/v1\/comercios\/20$/, 200, { id: 20, cuit: '30-2', razonSocial: 'Kiosco Demo', estado: 'INACTIVO' }],
];
const cat = await server.ssrLoadModule('/src/servicies/catalogoServicie.js');
llamadas.length = 0;
const comercios = await cat.obtenerComercios();
ok(llamadas.every(l => !l.headers.Authorization), 'Catálogo: GET públicos sin token');
ok(llamadas.filter(l => l.url.includes('/catalogo?')).every(l => /size=100/.test(l.url)), 'Catálogo: size=100 (límite del módulo)');
ok(comercios.length === 2 && comercios.find(c => c.id === 10).products.length === 100 && comercios.find(c => c.id === 20).products.length === 30, 'Catálogo: pagina 130 productos y agrupa por comercio');
ok(comercios.find(c => c.id === 10).name === 'Pizzería Demo' && comercios.find(c => c.id === 20).isOpen === false, 'Catálogo: mapea razonSocial y estado');
const c20 = await cat.obtenerComercioPorId(20);
ok(c20.products.length === 30 && c20.products[0].categoryName === 'Cat 1' && c20.products[0].price === 1101, 'Catálogo: detalle por comercioId con productos y categorías');
ok(llamadas.some(l => l.url.includes('/api/v1/catalogo?comercioId=20')), 'Catálogo: filtra por comercioId en el back');
rutas.push([/comercios\/99$/, 404, { error: 'NOT_FOUND', message: 'Comercio no encontrado' }]);
try { await cat.obtenerComercioPorId(99); ok(false, 'Catálogo: 404'); } catch (e) { ok(e.message === 'No encontramos ese comercio.', 'Catálogo: 404 → mensaje para el usuario'); }

// ── Pedidos ──
const pedidoResp = (estado, items = []) => ({ id: '0f0e0d0c-0000-0000-0000-000000000001', clienteId: '11111111-1111-1111-1111-111111111111', comercioId: 10, direccionEntregaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', estado, total: 3500, moneda: 'ARS', items, historial: [] });
rutas = [
  [/\/pedidos-api\/api\/v1\/orders$/, 201, pedidoResp('BORRADOR')],
  [/\/pedidos-api\/api\/v1\/orders\/[^/]+\/items$/, 200, pedidoResp('BORRADOR', [{ id: 'x', productoId: 5, nombreProducto: 'Prod 5', cantidad: 2, precioUnitario: 1500, subtotal: 3000 }])],
  [/\/pedidos-api\/api\/v1\/orders\/[^/]+\/confirm$/, 200, pedidoResp('CONFIRMADO')],
  [/\/pedidos-api\/api\/v1\/orders\/[^/]+$/, 200, pedidoResp('EN_CAMINO')],
];
const ped = await server.ssrLoadModule('/src/servicies/pedidosServicie.js');
llamadas.length = 0;
const pedido = await ped.crearPedido({ usuarioId: 2, comercioId: 10, direccionEntregaId: 1, items: [{ productoId: 5, cantidad: 2, precioUnitario: 1500 }], notas: 'x' });
const [crear, items] = llamadas;
ok(crear.method === 'POST' && crear.url === '/pedidos-api/api/v1/orders', 'Pedidos: POST /api/v1/orders por el proxy');
ok(JSON.stringify(crear.body) === JSON.stringify({ comercioId: 10, direccionEntregaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }), 'Pedidos: CrearPedidoRequest { comercioId, direccionEntregaId(UUID) }');
ok(crear.headers['X-Cliente-Id'] === '11111111-1111-1111-1111-111111111111' && crear.headers['X-Correlation-Id'], 'Pedidos: X-Cliente-Id (UUID) y X-Correlation-Id');
ok(items.url.endsWith('/orders/0f0e0d0c-0000-0000-0000-000000000001/items') && JSON.stringify(items.body) === JSON.stringify({ items: [{ productoId: 5, cantidad: 2 }] }), 'Pedidos: POST /items con LineaItem { productoId, cantidad }');
ok(pedido.id === '0f0e0d0c-0000-0000-0000-000000000001' && pedido.total === 3500 && pedido.subtotal === 3000 && pedido.envio === 0, 'Pedidos: mapea PedidoResponse a lo que usa el carrito');
const conf = await ped.confirmarPedido(pedido.id, 2, 'cccccccc-cccc-cccc-cccc-cccccccccccc');
ok(conf.estado === 'CONFIRMADO' && JSON.stringify(llamadas.at(-1).body) === JSON.stringify({ medioPago: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }), 'Pedidos: confirm { medioPago }');
const enCamino = await ped.obtenerPedido(pedido.id, 2);
ok(enCamino.estado === 'EN_CAMINO', 'Pedidos: GET /orders/{id} (seguimiento CU-05)');
const { armarSeguimiento } = await server.ssrLoadModule('/src/components/homePage/seguimientoPedido.js');
const tarjeta = armarSeguimiento({ ...enCamino, historial: [
  { estadoAnterior: 'BORRADOR', estadoNuevo: 'CONFIRMADO', fechaCambio: '2026-11-17T20:12:00-03:00' },
  { estadoAnterior: 'CONFIRMADO', estadoNuevo: 'EN_PREPARACION', fechaCambio: '2026-11-17T20:25:00-03:00' },
  { estadoAnterior: 'EN_PREPARACION', estadoNuevo: 'EN_CAMINO', fechaCambio: '2026-11-17T20:40:00-03:00' } ] }, 'Pizzería Demo');
ok(tarjeta.steps.map(p => p.status).join() === 'done,done,current,pending' && tarjeta.steps[2].time !== 'Pendiente' && tarjeta.courier === null, 'Seguimiento: estado e historial → pasos de la tarjeta del Home (sin datos inventados de Logística)');
rutas.unshift([/\/orders\/rechazado\/confirm$/, 422, { status: 422, code: 'PAYMENT_REJECTED', message: 'Pagos rechazo el pago' }]);
try { await ped.confirmarPedido('rechazado', 2, 'visa'); ok(false, 'Pedidos: rechazo'); } catch (e) { ok(e.codigo === 'PAYMENT_REJECTED', 'Pedidos: 422 PAYMENT_REJECTED → rechazo del medio de pago (RN-05)'); }
rutas.unshift([/\/orders\/caro\/confirm$/, 422, { status: 422, code: 'PRICE_CHANGED', message: 'El precio del producto 5 cambió' }]);
try { await ped.confirmarPedido('caro', 2, 'visa'); ok(false, 'Pedidos: precio'); } catch (e) { ok(!e.codigo && e.message === 'El precio del producto 5 cambió', 'Pedidos: PRICE_CHANGED → error general, no rechazo de pago'); }
rutas.unshift([/\/orders$/, 422, { status: 422, code: 'PRODUCTO_NO_DISPONIBLE', message: 'El producto 5 no está disponible' }]);
try { await ped.crearPedido({ usuarioId: 2, comercioId: 10, direccionEntregaId: 1, items: [] }); ok(false, 'Pedidos: error'); } catch (e) { ok(e.message === 'El producto 5 no está disponible' && e.codigo === 'PRODUCTO_NO_DISPONIBLE', 'Pedidos: ErrorResponse → mensaje del módulo (RN-11)'); }

// ── Notificaciones ──
rutas = [
  [/\/notif-api\/api\/v1\/templates/, 200, [{ id: 1, nombre: 'Pedido en camino', asunto: 'Tu pedido está en camino', cuerpo: 'Hola' }]],
  [/\/notif-api\/api\/v1\/users\/2\/notifications/, 200, { content: [{ id: 7, destinatarioId: 2, plantillaId: 1, canal: 'EMAIL', estado: 'ENVIADA', cantidadIntentos: 1 }] }],
  [/\/notif-api\/api\/v1\/notifications\/7\/read/, 200, { id: 7, estado: 'ENVIADA' }],
  [/\/notif-api\/api\/v1\/channels/, 200, [{ tipo: 'EMAIL', nombre: 'Email', activo: true }]],
];
const notif = await server.ssrLoadModule('/src/servicies/notificacionesServicie.js');
llamadas.length = 0;
const lista = await notif.listarNotificacionesDeUsuario(2);
ok(Array.isArray(lista) && lista.length === 1, 'Notificaciones: GET /users/{id}/notifications (página)');
ok(llamadas.every(l => (l.headers.Authorization ?? '') === 'Bearer jwt-de-prueba'), 'Notificaciones: manda el JWT');
await notif.marcarNotificacionLeida(7); ok(llamadas.at(-1).method === 'PATCH', 'Notificaciones: PATCH /notifications/{id}/read');
ok((await notif.listarCanales()).length >= 1, 'Notificaciones: GET /channels');

// ── Usuarios (CU-01, CU-06) ──
const dirDto = { id: 5, calle: 'Av. Corrientes', numero: '1450', piso: '4', departamento: 'B', ciudad: 'Balvanera', provincia: 'Ciudad Autónoma de Buenos Aires', codigoPostal: 'C1042AAP', predeterminada: true };
rutas = [
  [/\/usuarios-api\/api\/v1\/auth\/login$/, 200, { token: 'jwt-real', tipo: 'Bearer', expiraEn: '2026-11-17T23:00:00Z', usuarioId: 7, nombre: 'Ana', rol: 'CLIENTE' }],
  [/\/usuarios-api\/api\/v1\/auth\/register$/, 201, { id: 7, nombre: 'Ana', apellido: 'Pérez', email: 'ana@example.com', rol: 'CLIENTE', estado: 'ACTIVO' }],
  [/\/usuarios-api\/api\/v1\/users\/7\/addresses\/5\/default$/, 200, dirDto],
  [/\/usuarios-api\/api\/v1\/users\/7\/addresses\/5$/, 204, null],
  [/\/usuarios-api\/api\/v1\/users\/7\/addresses$/, 200, (url, op) => op.method === 'POST' ? { ...dirDto, id: 6, predeterminada: false } : [{ ...dirDto, id: 6, predeterminada: false }, dirDto]],
  [/\/usuarios-api\/api\/v1\/users\/7$/, 200, { id: 7, nombre: 'Ana', apellido: 'Pérez', email: 'ana@example.com', telefono: null, rol: 'CLIENTE', estado: 'ACTIVO' }],
];
const auth = await server.ssrLoadModule('/src/servicies/authServicie.js');
const usr = await server.ssrLoadModule('/src/servicies/userServicie.js');
llamadas.length = 0;
const sesion = await auth.login('ana@example.com', 'ClaveDemo2026!');
ok(llamadas[0].method === 'POST' && JSON.stringify(llamadas[0].body) === JSON.stringify({ email: 'ana@example.com', password: 'ClaveDemo2026!' }) && !llamadas[0].headers.Authorization, 'Usuarios: POST /auth/login con LoginRequest y sin token');
ok(llamadas.slice(1).every(l => l.headers.Authorization === 'Bearer jwt-real') && llamadas.some(l => l.url.endsWith('/users/7')), 'Usuarios: con el token emitido pide GET /users/{usuarioId}');
ok(sesion.id === 7 && sesion.rol === 'CLIENTE' && sesion.direcciones[0].id === 5 && sesion.direcciones[0].pisoDepto === 'Piso 4 B' && sesion.direcciones[0].barrio === 'Balvanera', 'Usuarios: DireccionResponse → formato del Portal, predeterminada primero');
llamadas.length = 0;
await auth.register({ nombre: 'Ana', apellido: 'Pérez', email: 'ana@example.com', telefono: '', password: 'ClaveDemo2026!', direccion: {} });
ok(JSON.stringify(Object.keys(llamadas[0].body)) === JSON.stringify(['nombre', 'apellido', 'email', 'telefono', 'password']), 'Usuarios: RegistrarUsuarioRequest sólo con campos del contrato');
llamadas.length = 0;
await usr.crearDireccion(7, { calle: 'Av. Corrientes 1450', pisoDepto: 'Piso 4 B', barrio: 'Balvanera', ciudad: 'CABA', codigoPostal: 'C1042AAP' }, { predeterminada: true });
const req = llamadas[0].body;
ok(req.calle === 'Av. Corrientes' && req.numero === '1450' && req.piso === '4' && req.departamento === 'B' && req.ciudad === 'Balvanera' && req.provincia === 'Ciudad Autónoma de Buenos Aires' && req.codigoPostal === 'C1042AAP' && req.predeterminada === true, 'Usuarios: CrearDireccionRequest con todos los obligatorios (calle, numero, ciudad, provincia, codigoPostal)');
await usr.actualizarPerfil(7, { nombre: 'Ana', apellido: 'Gómez', email: 'ana@example.com', telefono: '' });
ok(llamadas.at(-1).method === 'PUT' && llamadas.at(-1).url.endsWith('/users/7') && llamadas.at(-1).body.email === 'ana@example.com' && llamadas.at(-1).body.telefono === null, 'Usuarios: PUT /users/{id} con ModificarPerfilRequest');
await usr.marcarDireccionPredeterminada(7, 5);
ok(llamadas.at(-1).method === 'PATCH' && llamadas.at(-1).url.endsWith('/addresses/5/default'), 'Usuarios: PATCH /addresses/{addressId}/default');
await usr.eliminarDireccion(7, 5);
ok(llamadas.at(-1).method === 'DELETE' && llamadas.at(-1).url.endsWith('/users/7/addresses/5'), 'Usuarios: DELETE /addresses/{addressId} (204)');
rutas.unshift([/\/auth\/login$/, 401, { status: 401, code: 'INVALID_CREDENTIALS', message: 'Credenciales incorrectas' }]);
try { await auth.login('x@x.com', 'mala-clave'); ok(false, 'Usuarios: 401'); } catch (e) { ok(e.message === 'Email o contraseña incorrectos.', 'Usuarios: 401 → mensaje de credenciales'); }
rutas.unshift([/\/auth\/register$/, 409, { status: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'El email ya está registrado' }]);
try { await auth.register({ nombre: 'a', apellido: 'b', email: 'ana@example.com', password: '12345678' }); ok(false, 'Usuarios: 409'); } catch (e) { ok(e.message.startsWith('Ya existe una cuenta'), 'Usuarios: 409 → email ya registrado'); }

// ── Opiniones (CU-09) ──
store.usuario = JSON.stringify({ id: 100, direcciones: [] });
rutas = [
  [/\/opiniones-analitica-api\/api\/v1\/reviews$/, 201, (url, op) => ({ id: 9001, usuarioId: 100, ...JSON.parse(op.body), objetivoId: 10, fechaCreacion: '2026-11-17T20:00:00' })],
  [/\/opiniones-analitica-api\/api\/v1\/merchants\/10\/rating$/, 200, { objetivoId: 10, tipoObjetivo: 'COMERCIO', promedio: 4.75, cantidadResenas: 12 }],
];
const op = await server.ssrLoadModule('/src/servicies/opinionesServicie.js');
llamadas.length = 0;
await op.crearResena({ pedidoId: '1', tipoObjetivo: 'COMERCIO', puntuacion: 5, comentario: 'Excelente' });
ok(llamadas[0].url === '/opiniones-analitica-api/api/v1/reviews' && llamadas[0].headers['X-Usuario-Id'] === '100' && llamadas[0].headers['X-Correlation-Id'], 'Opiniones: POST /reviews con X-Usuario-Id y X-Correlation-Id');
ok(JSON.stringify(llamadas[0].body) === JSON.stringify({ pedidoId: 1, tipoObjetivo: 'COMERCIO', puntuacion: 5, comentario: 'Excelente' }), 'Opiniones: ResenaRequest con pedidoId int64');
ok((await op.obtenerRatingComercio(10)).promedio === 4.75, 'Opiniones: GET /merchants/{id}/rating');
rutas.unshift([/\/reviews$/, 409, { status: 409, error: 'DUPLICATE_REVIEW', message: 'Ya existe una reseña' }]);
try { await op.crearResena({ pedidoId: 1, tipoObjetivo: 'COMERCIO', puntuacion: 5 }); ok(false, 'Opiniones: 409'); } catch (e) { ok(e.message === 'Ya calificaste este pedido.', 'Opiniones: 409 → reseña duplicada (RN-08)'); }

// ── Analítica (CU-10) ──
rutas = [[/\/opiniones-analitica-api\/api\/v1\/analytics\/dashboard\?/, 200, { generadoEn: '2026-11-17T20:00:00', parcial: true, metricas: [
  { fuente: 'RESENAS', tipoMetrica: 'PROMEDIO_CALIFICACION', periodoDesde: '2026-11-01', periodoHasta: '2026-11-17', valor: 4.5 },
  { fuente: 'RESENAS', tipoMetrica: 'CANTIDAD_RESENAS', periodoDesde: '2026-11-01', periodoHasta: '2026-11-17', valor: 8 },
  { fuente: 'PEDIDOS', tipoMetrica: 'PEDIDOS_ENTREGADOS', periodoDesde: '2026-11-01', periodoHasta: '2026-11-17', valor: 2 } ] }]];
const ana = await server.ssrLoadModule('/src/servicies/analiticaServicie.js');
llamadas.length = 0;
const tablero = await ana.obtenerTablero('2026-11-01', '2026-11-17');
ok(llamadas[0].url === '/opiniones-analitica-api/api/v1/analytics/dashboard?periodoDesde=2026-11-01&periodoHasta=2026-11-17', 'Analítica: GET /analytics/dashboard?periodoDesde=&periodoHasta=');
ok(tablero.opiniones.promedio === 4.5 && tablero.pedidos.porEstado[0].cantidad === 2 && tablero.pagos.error && tablero.parcial === true, 'Analítica: métricas por fuente; la que falta muestra error sólo en su bloque (RN-11)');

await server.close();
