import { PEDIDOS_URL } from './api';
import { pedir } from './http';
import { crearPedidoMock, aplicarCuponMock, listarPedidosMock, confirmarPedidoMock, obtenerPedidoMock } from './mocks/pedidosMock';

/*
 * Módulo Pedidos (santi28/uade-deliverygo-ms-orders) — CU-03, CU-05, CU-07.
 * Contrato: doc/swagger-ecosistema.yaml → /api/v1/orders
 *
 * Todas las operaciones piden el header X-Cliente-Id (id del usuario logueado).
 */
const API = `${PEDIDOS_URL}/api/v1/orders`;

// Cambiar a false cuando el Módulo Pedidos esté disponible
const USE_MOCK = true;

/*
 * Ni el consolidado del ecosistema (v1.4.0) ni el Swagger del módulo Pedidos
 * tienen cupones ni listado de pedidos por usuario. Esas dos funciones quedan
 * siempre simuladas hasta que el módulo publique el endpoint
 * (ver docs/integraciones-equipos.md, D4 y D6).
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

    const borrador = await pedir(API, {
        method: 'POST',
        headers,
        body: {
            comercioId: pedidoRequest.comercioId,
            direccionEntregaId: comoUuid(pedidoRequest.direccionEntregaId, DIRECCION_PRUEBA),
        },
        mensajeError: 'No se pudo crear el pedido. Intentá nuevamente.',
    });

    const pedido = await pedir(`${API}/${borrador.id}/items`, {
        method: 'POST',
        headers,
        body: {
            items: pedidoRequest.items.map((item) => ({
                productoId: item.productoId,
                cantidad: item.cantidad,
            })),
        },
        mensajeError: 'No se pudieron agregar los productos al pedido.',
    });

    return mapearPedido(pedido);
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
 * No existe en ningún contrato de Pedidos: queda simulado (D6).
 */
export async function aplicarCupon(pedidoId, codigoCupon) {
    return aplicarCuponMock(pedidoId, codigoCupon);
}

/**
 * CU-07 Historial de pedidos del usuario.
 * Devuelve { content, page, totalPages, totalElements }.
 * No existe en ningún contrato de Pedidos: queda simulado (D4).
 */
export async function listarPedidos(usuarioId, { estados = [], page = 0, size = 4 } = {}) {
    return listarPedidosMock(usuarioId, { estados, page, size });
}
