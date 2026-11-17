import { PEDIDOS_URL } from './api';
import { pedir } from './http';
import { obtenerComercioPorId } from './catalogoServicie';
import { crearPedidoMock, aplicarCuponMock, listarPedidosMock, confirmarPedidoMock, obtenerPedidoMock } from './mocks/pedidosMock';

/*
 * Módulo Pedidos (santi28/uade-deliverygo-ms-orders) — CU-03, CU-05, CU-07.
 * Contrato: doc/swagger-ecosistema.yaml → /api/v1/orders
 *
 * Todas las operaciones piden el header X-Cliente-Id (id del usuario logueado).
 */
const API = `${PEDIDOS_URL}/api/v1/orders`;

// Cambiar a false cuando el Módulo Pedidos esté disponible
const USE_MOCK = false;

/*
 * Ni el consolidado del ecosistema (v1.4.0) ni el Swagger del módulo Pedidos
 * tienen cupones: aplicarCupon queda simulado (ver docs/integraciones-equipos.md, D6).
 * El listado de pedidos por usuario (D4) ya lo publicó Pedidos como CU-06
 * (GET /api/v1/orders) y listarPedidos lo consume.
 */

/*
 * Pedidos guarda cliente y dirección como UUID, pero Usuarios usa ids
 * numéricos (inconsistencia entre módulos, D8 en docs/integraciones-equipos.md).
 * Mientras Pedidos valide contra su Usuarios simulado, si el id no es UUID se
 * usa el cliente y la dirección de sus datos de prueba (DatosMock del módulo).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLIENTE_PRUEBA = import.meta.env.VITE_PEDIDOS_CLIENTE_ID ?? '11111111-1111-1111-1111-111111111111';
const DIRECCION_PRUEBA = import.meta.env.VITE_PEDIDOS_DIRECCION_ID ?? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function comoUuid(id, respaldo) {
    return UUID.test(String(id)) ? String(id) : respaldo;
}

function headersCliente(clienteId) {
    return { 'X-Cliente-Id': comoUuid(clienteId, CLIENTE_PRUEBA) };
}

/*
 * PedidoResponse { id, clienteId, comercioId, direccionEntregaId, estado,
 * total, moneda, pagoId, items: ItemResponse[], historial } → formato del Portal.
 *
 * El contrato no separa envío, tarifa ni descuento: van en 0 y el total
 * es el que calcula Pedidos.
 */
function mapearPedido(dto) {
    const subtotal = (dto.items ?? []).reduce((suma, item) => suma + (item.subtotal ?? 0), 0);

    return {
        id: dto.id,
        estado: dto.estado,
        clienteId: dto.clienteId,
        comercioId: dto.comercioId,
        pagoId: dto.pagoId,
        subtotal: subtotal || dto.total,
        envio: 0,
        tarifaServicio: 0,
        descuento: 0,
        total: dto.total,
        moneda: dto.moneda,
        items: dto.items ?? [],
        historial: dto.historial ?? [],
    };
}

/**
 * CU-03: crea el pedido y le agrega los ítems del carrito.
 *
 * 1. POST /api/v1/orders            CrearPedidoRequest { comercioId, direccionEntregaId } → BORRADOR
 * 2. POST /api/v1/orders/{id}/items AgregarItemsPedidoRequest { items: [{ productoId, cantidad }] }
 *
 * Pedidos valida usuario, catálogo, precio y disponibilidad (paso 4 del flujo).
 */
export async function crearPedido(pedidoRequest) {

    if (USE_MOCK) {
        return crearPedidoMock(pedidoRequest);
    }

    const headers = headersCliente(pedidoRequest.usuarioId);

    await cancelarBorradorDeOtroComercio(headers, pedidoRequest.comercioId);

    // Si ya hay un borrador de este comercio, Pedidos devuelve ese en vez de crear otro (REP-01).
    const borrador = await pedir(API, {
        method: 'POST',
        headers,
        body: {
            comercioId: pedidoRequest.comercioId,
            direccionEntregaId: comoUuid(pedidoRequest.direccionEntregaId, DIRECCION_PRUEBA),
        },
        mensajeError: 'No se pudo crear el pedido. Intentá nuevamente.',
    });

    const pedido = await sincronizarItems(borrador, pedidoRequest.items, headers);

    return mapearPedido(pedido);
}

/*
 * Pedidos admite un solo borrador por cliente (REP-01) y no mezcla comercios
 * (MIXED_MERCHANT). Si quedó un borrador abierto de otro comercio (un pago que
 * no se terminó, un carrito anterior), se cancela antes de crear el nuevo.
 */
async function cancelarBorradorDeOtroComercio(headers, comercioId) {

    const pagina = await pedir(`${API}?pagina=0&tamanio=100`, {
        headers,
        mensajeError: 'No se pudo crear el pedido. Intentá nuevamente.',
    });

    const borradores = (pagina.pedidos ?? []).filter((pedido) =>
        pedido.estado === 'BORRADOR' && String(pedido.comercioId) !== String(comercioId));

    for (const borrador of borradores) {
        await pedir(`${API}/${borrador.id}`, {
            method: 'DELETE',
            headers,
            mensajeError: 'No se pudo descartar el pedido anterior. Intentá nuevamente.',
        });
    }
}

/*
 * Deja las líneas del borrador iguales al carrito (CU-02):
 *   - producto que ya no está en el carrito → DELETE /{id}/items/{productoId}
 *   - producto con otra cantidad            → PUT    /{id}/items/{productoId}
 *   - producto nuevo                        → POST   /{id}/items
 * Un borrador recién creado no tiene líneas, así que sólo se hace el POST.
 */
async function sincronizarItems(borrador, items, headers) {

    const actuales = new Map((borrador.items ?? []).map((item) => [String(item.productoId), item.cantidad]));
    const deseados = new Map(items.map((item) => [String(item.productoId), item.cantidad]));

    let pedido = borrador;

    for (const productoId of actuales.keys()) {
        if (!deseados.has(productoId)) {
            pedido = await pedir(`${API}/${borrador.id}/items/${productoId}`, {
                method: 'DELETE',
                headers,
                mensajeError: 'No se pudo actualizar el pedido.',
            });
        }
    }

    for (const [productoId, cantidad] of deseados) {
        if (actuales.has(productoId) && actuales.get(productoId) !== cantidad) {
            pedido = await pedir(`${API}/${borrador.id}/items/${productoId}`, {
                method: 'PUT',
                headers,
                body: { cantidad },
                mensajeError: 'No se pudo actualizar el pedido.',
            });
        }
    }

    const nuevos = items.filter((item) => !actuales.has(String(item.productoId)));

    if (nuevos.length > 0) {
        pedido = await pedir(`${API}/${borrador.id}/items`, {
            method: 'POST',
            headers,
            body: {
                items: nuevos.map((item) => ({
                    productoId: item.productoId,
                    cantidad: item.cantidad,
                })),
            },
            mensajeError: 'No se pudieron agregar los productos al pedido.',
        });
    }

    return pedido;
}

/**
 * CU-05: GET /api/v1/orders/{id} → PedidoResponse (estado e historial).
 */
export async function obtenerPedido(pedidoId, clienteId) {

    if (USE_MOCK) {
        return obtenerPedidoMock(pedidoId);
    }

    const pedido = await pedir(`${API}/${pedidoId}`, {
        headers: headersCliente(clienteId),
        mensajeError: 'No pudimos cargar el pedido.',
    });

    return mapearPedido(pedido);
}

/**
 * CU-03/CU-04: POST /api/v1/orders/{id}/confirm
 * ConfirmarPedidoRequest { medioPago } → PedidoResponse
 *
 * Pasos 5 y 6 del flujo: Pedidos cobra con Pagos (el Portal no llama a Pagos).
 * Respuestas del módulo (PedidoService.confirmarPedido):
 *   - pago APROBADO  → 200, pedido CONFIRMADO.
 *   - pago PENDIENTE → 200, pedido sigue en BORRADOR con pagoId (Pagos autoriza aparte).
 *   - pago RECHAZADO → 422 PAYMENT_REJECTED, pedido sigue en BORRADOR (se puede reintentar).
 *   - Pagos caído    → 503, nunca se confirma sin cobro.
 *
 * Sólo PAYMENT_REJECTED es un rechazo del medio de pago (RN-05) y lleva "codigo";
 * el resto (precio cambiado, sin stock, Pagos caído) se muestra como error general.
 */
export async function confirmarPedido(pedidoId, clienteId, medioPago) {

    if (USE_MOCK) {
        return confirmarPedidoMock(pedidoId, medioPago);
    }

    try {
        const pedido = await pedir(`${API}/${pedidoId}/confirm`, {
            method: 'POST',
            headers: headersCliente(clienteId),
            body: { medioPago },
            mensajeError: 'No se pudo confirmar el pedido. Intentá nuevamente.',
        });

        return mapearPedido(pedido);
    } catch (error) {
        if (error.codigo === 'PAYMENT_REJECTED') {
            error.message = 'Tu pago fue rechazado por la entidad emisora. Probá con otro medio de pago.';
        } else {
            error.codigo = undefined;
        }
        throw error;
    }
}

/**
 * API-09 Aplicar cupón.
 * No existe en ningún contrato de Pedidos (D6): el total que se cobra es el de
 * Pedidos, así que un descuento simulado mostraría un importe que no se cobra.
 * Con el módulo real se informa que no está disponible; el mock queda para USE_MOCK.
 */
export async function aplicarCupon(pedidoId, codigoCupon) {

    if (USE_MOCK) {
        return aplicarCuponMock(pedidoId, codigoCupon);
    }

    throw new Error('Los cupones todavía no están disponibles.');
}

/*
 * Nombre de cada comercio para las tarjetas del historial. Pedidos sólo
 * devuelve comercioId, así que el nombre sale de Catálogo y se guarda
 * para no volver a pedirlo en cada página.
 */
const nombresComercio = new Map();

function nombreComercio(comercioId) {
    if (!nombresComercio.has(comercioId)) {
        nombresComercio.set(comercioId, obtenerComercioPorId(comercioId)
            .then((comercio) => comercio.name)
            .catch(() => `Comercio #${comercioId}`));
    }
    return nombresComercio.get(comercioId);
}

/*
 * PedidoResponse (detalle) → formato que usa la página "Mis pedidos"
 * (el mismo que tenía el mock: comercio.nombre, fecha, items con nombre, etc.).
 */
function mapearPedidoHistorial(dto, nombre) {
    const items = (dto.items ?? []).map((item) => ({
        productoId: item.productoId,
        nombre: item.nombreProducto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
    }));
    const historial = (dto.historial ?? []).map((paso) => ({
        estado: paso.estadoNuevo,
        fecha: paso.fechaCambio,
    }));
    const cancelacion = (dto.historial ?? []).find((paso) => paso.estadoNuevo === 'CANCELADO');

    return {
        ...mapearPedido(dto),
        fecha: dto.fechaCreacion,
        comercio: { id: dto.comercioId, nombre },
        items,
        historial,
        motivoCancelacion: cancelacion?.motivo,
        calificacion: null,
    };
}

/**
 * CU-07 Historial de pedidos del usuario.
 * Devuelve { content, page, size, totalPages, totalElements }.
 *
 * GET /api/v1/orders?pagina=&tamanio= (CU-06 del módulo Pedidos) → PaginaPedidosResponse
 * { pedidos: PedidoResumenResponse[], pagina, tamanio, totalElementos, totalPaginas }.
 *
 * Pedidos no filtra por estado, así que se trae el historial completo y el
 * filtro y la paginación se hacen acá. Los BORRADOR (carrito sin confirmar)
 * no son pedidos para el usuario y no se muestran. Para la página visible se
 * pide el detalle (ítems e historial) y el nombre del comercio a Catálogo.
 */
export async function listarPedidos(usuarioId, { estados = [], page = 0, size = 4 } = {}) {

    if (USE_MOCK) {
        return listarPedidosMock(usuarioId, { estados, page, size });
    }

    const headers = headersCliente(usuarioId);

    const respuesta = await pedir(`${API}?pagina=0&tamanio=100`, {
        headers,
        mensajeError: 'No pudimos cargar tus pedidos.',
    });

    const filtrados = (respuesta.pedidos ?? [])
        .filter((pedido) => pedido.estado !== 'BORRADOR')
        .filter((pedido) => estados.length === 0 || estados.includes(pedido.estado));

    const inicio = page * size;

    const content = await Promise.all(
        filtrados.slice(inicio, inicio + size).map(async (resumen) => {
            const [detalle, nombre] = await Promise.all([
                pedir(`${API}/${resumen.id}`, {
                    headers,
                    mensajeError: 'No pudimos cargar tus pedidos.',
                }),
                nombreComercio(resumen.comercioId),
            ]);
            return mapearPedidoHistorial(detalle, nombre);
        }),
    );

    return {
        content,
        page,
        size,
        totalElements: filtrados.length,
        totalPages: Math.max(1, Math.ceil(filtrados.length / size)),
    };
}

/*
 * Estados en los que un pedido está "en curso" para el seguimiento (CU-05).
 */
const ESTADOS_EN_CURSO = ['CONFIRMADO', 'EN_PREPARACION', 'EN_CAMINO'];

/**
 * CU-05: pedido en curso del usuario, para el Home y Notificaciones.
 * Devuelve { id, storeName } o null si no hay ninguno.
 *
 * Se lo pregunta a Pedidos (GET /api/v1/orders, el más reciente primero), no a la
 * sesión del navegador: así aparece aunque el pedido se haya hecho en otra pestaña
 * o antes de volver a iniciar sesión. El pedido que se acaba de pagar en esta sesión
 * también cuenta aunque siga en BORRADOR (pago pendiente de autorización).
 */
export async function buscarPedidoEnCurso(usuarioId) {

    const ultimo = obtenerUltimoPedido();

    if (USE_MOCK) {
        return ultimo;
    }

    const pagina = await pedir(`${API}?pagina=0&tamanio=100`, {
        headers: headersCliente(usuarioId),
        mensajeError: 'No pudimos consultar tu pedido en curso.',
    });

    const enCurso = (pagina.pedidos ?? []).find((pedido) =>
        ESTADOS_EN_CURSO.includes(pedido.estado)
        || (pedido.estado === 'BORRADOR' && String(pedido.id) === String(ultimo?.id)));

    if (!enCurso) {
        return null;
    }

    const storeName = String(enCurso.id) === String(ultimo?.id) && ultimo?.storeName
        ? ultimo.storeName
        : await nombreComercio(enCurso.comercioId);

    return { id: enCurso.id, storeName };
}

/*
 * Último pedido confirmado en esta sesión. Lo guarda el Checkout y lo usa
 * el seguimiento del Home (CU-05). Se guarda en sessionStorage, igual que la sesión.
 */
const CLAVE_ULTIMO_PEDIDO = 'ultimoPedido';

export function guardarUltimoPedido({ id, storeName }) {
    sessionStorage.setItem(CLAVE_ULTIMO_PEDIDO, JSON.stringify({ id, storeName }));
}

export function olvidarUltimoPedido() {
    sessionStorage.removeItem(CLAVE_ULTIMO_PEDIDO);
}

export function obtenerUltimoPedido() {
    try {
        return JSON.parse(sessionStorage.getItem(CLAVE_ULTIMO_PEDIDO));
    } catch {
        return null;
    }
}
