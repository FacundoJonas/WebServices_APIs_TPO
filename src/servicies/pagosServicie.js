import { PAGOS_URL } from './api';
import { pedir } from './http';
import { obtenerUsuario } from './authServicie';
import { procesarPagoMock } from './mocks/pagosMock';

/*
 * Módulo Pagos (Grupo 3) — CU-04.
 * Contrato: doc/swagger-ecosistema.yaml → /api/v1/payments
 */
const API = `${PAGOS_URL}/api/v1/payments`;

// Cambiar a false cuando el Módulo Pagos esté disponible
const USE_MOCK = true;

/*
 * Número de intento por pedido. Se usa en la claveControl (idempotencia):
 * el mismo intento no se cobra dos veces, y un reintento usa una clave nueva.
 */
const intentos = new Map();

function siguienteClave(pedidoId) {
    const intento = (intentos.get(pedidoId) ?? 0) + 1;
    intentos.set(pedidoId, intento);
    return `pedido-${pedidoId}-intento-${intento}`;
}

/**
 * POST /api/v1/payments
 * CrearPagoRequest { codigoPedido, codigoUsuario, codigoMedioPago, monto, moneda, claveControl }
 * → PagoResponse { codigoPago, codigoPedido, estado: PENDIENTE|APROBADO|RECHAZADO|REEMBOLSADO, ... }
 *
 * RN-05: sólo un rechazo del medio de pago lleva "codigo".
 * Los errores de red o del servidor no tienen código: no son un rechazo.
 */
async function enviarPago(pagoRequest) {

    const usuario = obtenerUsuario();

    let pago;

    try {
        pago = await pedir(API, {
            method: 'POST',
            body: {
                codigoPedido: String(pagoRequest.pedidoId),
                codigoUsuario: String(usuario?.id),
                codigoMedioPago: pagoRequest.metodoPagoId,
                monto: pagoRequest.monto,
                moneda: 'ARS',
                claveControl: siguienteClave(pagoRequest.pedidoId),
            },
            mensajeError: 'El servicio de pagos no está disponible en este momento. Intentá de nuevo en unos minutos.',
        });
    } catch (error) {
        // 4xx con cuerpo: el medio de pago fue rechazado o los datos no son válidos.
        if (error.status >= 400 && error.status < 500 && error.status !== 401 && error.status !== 403) {
            error.codigo = error.codigo ?? `HTTP_${error.status}`;
        } else {
            error.codigo = undefined;
        }
        throw error;
    }

    // El pago puede crearse y quedar RECHAZADO: también es un rechazo (RN-05).
    if (pago?.estado === 'RECHAZADO') {
        const error = new Error('Tu pago fue rechazado por la entidad emisora. Probá con otro medio de pago.');
        error.codigo = `PAGO_RECHAZADO_${pago.codigoPago ?? ''}`.replace(/_$/, '');
        throw error;
    }

    return pago;
}

/**
 * API-05: procesa el pago de un pedido.
 */
export async function procesarPago(pagoRequest) {

    if (USE_MOCK) {
        return procesarPagoMock(pagoRequest);
    }

    return enviarPago(pagoRequest);
}

/**
 * API-10: reintento después de un rechazo, sin crear un pedido nuevo (DM-03).
 *
 * El contrato no tiene un endpoint de reintento: se crea un pago nuevo
 * para el mismo pedido con otra claveControl.
 */
export async function reintentarPago(pagoRequest) {

    if (USE_MOCK) {
        return procesarPagoMock(pagoRequest);
    }

    return enviarPago(pagoRequest);
}

/**
 * GET /api/v1/payments/{codigoPago} → PagoResponse
 */
export async function obtenerPago(codigoPago) {
    return pedir(`${API}/${codigoPago}`, {
        mensajeError: 'No pudimos consultar el pago.',
    });
}
