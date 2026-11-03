import { BASE_URL } from './api';
import { obtenerToken } from './authServicie';
import { crearPedidoMock, aplicarCuponMock, listarPedidosMock } from './mocks/pedidosMock';

const API = `${BASE_URL}/pedidos`;

// Cambiar a false cuando el Módulo Pedidos esté disponible
const USE_MOCK = true;

function headers() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${obtenerToken()}`
    };
}

/**
 * API-04 POST /pedidos
 * DTO-04 CrearPedidoRequest -> DTO-05 PedidoResponse
 */
export async function crearPedido(pedidoRequest) {

    if (USE_MOCK) {
        return crearPedidoMock(pedidoRequest);
    }

    const r = await fetch(API, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(pedidoRequest)
    });

    if (!r.ok) {
        throw new Error('No se pudo crear el pedido. Intentá nuevamente.');
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
