import { BASE_URL } from './api';
import { obtenerToken } from './authServicie';
import { procesarPagoMock } from './mocks/pagosMock';

const API = `${BASE_URL}/pagos`;

// Cambiar a false cuando el Módulo Pagos esté disponible
const USE_MOCK = true;

/*
 * Envía el pago al endpoint indicado.
 *
 * Sólo un rechazo del medio de pago (4xx) lleva "codigo" (RN-05).
 * Los errores de red o del servidor no tienen código: no son un rechazo.
 * TODO: acordar con el Módulo Pagos el formato del error ({ codigo, mensaje }).
 */
async function enviarPago(url, pagoRequest) {

    let r;

    try {
        r = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${obtenerToken()}`
            },
            body: JSON.stringify(pagoRequest)
        });
    } catch {
        throw new Error('No pudimos comunicarnos con el servicio de pagos. Revisá tu conexión e intentá de nuevo.');
    }

    if (r.status >= 500) {
        throw new Error('El servicio de pagos no está disponible en este momento. Intentá de nuevo en unos minutos.');
    }

    if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        const error = new Error(data.mensaje ?? 'El pago fue rechazado.');
        error.codigo = data.codigo ?? `HTTP_${r.status}`;
        throw error;
    }

    return r.json();
}

/**
 * API-05 POST /pagos
 * DTO-06 PagoRequest -> DTO-05 PedidoResponse
 */
export async function procesarPago(pagoRequest) {

    if (USE_MOCK) {
        return procesarPagoMock(pagoRequest);
    }

    return enviarPago(API, pagoRequest);
}

/**
 * API-10 POST /pagos/reintentar
 * Se usa después de un rechazo, sin crear un pedido nuevo (DM-03).
 */
export async function reintentarPago(pagoRequest) {

    if (USE_MOCK) {
        return procesarPagoMock(pagoRequest);
    }

    return enviarPago(`${API}/reintentar`, pagoRequest);
}
