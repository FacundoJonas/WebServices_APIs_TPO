import { BASE_URL } from './api';
import { obtenerToken } from './authServicie';
import { crearPedidoMock, aplicarCuponMock } from './mocks/pedidosMock';

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
