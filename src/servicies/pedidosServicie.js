import { PEDIDOS_URL } from './api';
import { obtenerToken, obtenerUsuario } from './authServicie';
import { crearPedidoMock, agregarItemsMock, confirmarPedidoMock, consultarPedidoMock, aplicarCuponMock, listarPedidosMock } from './mocks/pedidosMock';

const API = `${PEDIDOS_URL}/api/v1/orders`;

// Cambiar a false cuando el Módulo Pedidos esté disponible
const USE_MOCK = true;
// Se puso en true de nuevo: la PC del equipo de Pedidos (192.168.1.160) no responde desde esta red.

/*
 * El Módulo Pedidos no usa Authorization Bearer: identifica al cliente
 * con el header X-Cliente-Id (ver swagger, ninguna ruta de Pedidos
 * tiene "security: bearerAuth"). Se manda igual el token por las dudas.
 */
function headers() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${obtenerToken()}`,
        'X-Cliente-Id': obtenerUsuario()?.id
    };
}

/**
 * CU-01 POST /orders
 * Crea el pedido en BORRADOR, sin items y con total cero.
 */
export async function crearPedido({ comercioId, direccionEntregaId }) {

    if (USE_MOCK) {
        return crearPedidoMock({ comercioId, direccionEntregaId });
    }

    const r = await fetch(API, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ comercioId, direccionEntregaId })
    });

    if (!r.ok) {
        throw new Error('No se pudo crear el pedido. Intentá nuevamente.');
    }

    return r.json();
}

/**
 * CU-02 POST /orders/{id}/items
 * Carga las líneas del carrito en un pedido en BORRADOR.
 * No se manda precioUnitario: el backend lo calcula contra el Catálogo.
 */
export async function agregarItems(pedidoId, items) {

    if (USE_MOCK) {
        return agregarItemsMock(pedidoId, items);
    }

    const r = await fetch(`${API}/${pedidoId}/items`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
            items: items.map(({ productoId, cantidad }) => ({ productoId, cantidad }))
        })
    });

    if (!r.ok) {
        throw new Error('No se pudieron cargar los productos del pedido.');
    }

    return r.json();
}

/**
 * CU-03 POST /orders/{id}/confirm
 * Revalida el pedido, procesa el cobro con Pagos y lo pasa a CONFIRMADO.
 */
export async function confirmarPedido(pedidoId, medioPago) {

    if (USE_MOCK) {
        return confirmarPedidoMock(pedidoId, medioPago);
    }

    const r = await fetch(`${API}/${pedidoId}/confirm`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ medioPago })
    });

    if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        const error = new Error(data.message ?? 'No se pudo confirmar el pedido.');
        error.codigo = data.code;
        throw error;
    }

    return r.json();
}

/**
 * CU-05 GET /orders/{id}
 * Devuelve el pedido con sus items y su historial de estados.
 */
export async function consultarPedido(pedidoId) {

    if (USE_MOCK) {
        return consultarPedidoMock(pedidoId);
    }

    const r = await fetch(`${API}/${pedidoId}`, {
        headers: headers()
    });

    if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.message ?? 'No se pudo obtener el pedido.');
    }

    return r.json();
}

/**
 * API-09 POST /pedidos/{id}/cupon
 * DTO-08 AplicarCuponRequest -> DTO-05 PedidoResponse
 */
export async function aplicarCupon(pedidoId, codigoCupon) {

    if (USE_MOCK) {
        return aplicarCuponMock(pedidoId, codigoCupon);
    }

    const r = await fetch(`${API}/${pedidoId}/cupon`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ pedidoId, codigoCupon })
    });

    if (!r.ok) {
        throw new Error('El cupón no es válido.');
    }

    return r.json();
}

/**
 * CU-07 GET /pedidos?usuarioId=&estados=&page=&size=
 * Devuelve una página de pedidos del usuario: { content, page, totalPages, totalElements }.
 * TODO: acordar la ruta con el Módulo Pedidos (el enunciado no la fija).
 */
export async function listarPedidos(usuarioId, { estados = [], page = 0, size = 4 } = {}) {

    if (USE_MOCK) {
        return listarPedidosMock(usuarioId, { estados, page, size });
    }

    const params = new URLSearchParams({ usuarioId, page, size });

    if (estados.length > 0) {
        params.set('estados', estados.join(','));
    }

    const r = await fetch(`${API}?${params}`, {
        headers: headers()
    });

    if (!r.ok) {
        throw new Error('No pudimos cargar tus pedidos. Intentá nuevamente.');
    }

    return r.json();
}
