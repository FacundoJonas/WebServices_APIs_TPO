import { PAGOS_URL } from './api';
import { pedir } from './http';
import { procesarPagoMock } from './mocks/pagosMock';

/*
 * Módulo Pagos (Grupo 3) — CU-04.
 * Contrato: doc/swagger-ecosistema.yaml → /api/v1/payments
 *
 * El Portal llama a Pagos directo con un usuario fijo: el usuario de demo del
 * módulo (Ana). Pagos no conoce a los usuarios del Módulo Usuarios (sus ids son
 * numéricos y Pagos usa UUID), así que el codigoUsuario va siempre el mismo y el
 * resto del pago (pedido, monto, medio, clave) sale del pedido real.
 */
const API = `${PAGOS_URL}/api/v1/payments`;

// Cambiar a false cuando el Módulo Pagos esté disponible
const USE_MOCK = false;

/*
 * Usuario fijo con el que se paga: el de demo del Módulo Pagos
 * (UsuariosClientSimulado.USUARIO_ANA). Se puede cambiar en .env.local.
 */
const USUARIO_PAGOS = import.meta.env.VITE_PAGOS_USUARIO_ID ?? '00000000-0000-0000-0000-000000000001';

/*
 * Pagos emite su propio JWT (POST /auth/login): no acepta el de Usuarios.
 * La cuenta de demo del módulo (demo / demo123) es la de ese usuario fijo.
 */
const CUENTA_PAGOS = {
    username: import.meta.env.VITE_PAGOS_USERNAME ?? 'demo',
    password: import.meta.env.VITE_PAGOS_PASSWORD ?? 'demo123',
};

/*
 * Número de ejemplo con el que se registra cada tipo de medio en Pagos
 * (Pagos sólo guarda los últimos 4: RN-08).
 */
const NUMERO_DE_EJEMPLO = {
    TARJETA_CREDITO: '4111 1111 1111 1111',
    TARJETA_DEBITO: '4000 0000 0000 0002',
    BILLETERA_VIRTUAL: 'demo@billetera',
    TRANSFERENCIA: '0000003100000000000001',
};

/* Estados de un pago que son un rechazo del medio de pago (RN-05). */
const ESTADOS_RECHAZO = ['RECHAZADO', 'NO_AUTORIZADO', 'ERROR'];

let sesionPagos = null;               // { token, vence }
const mediosRegistrados = new Map();  // tipo → codigoMedioPago

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
 * POST /auth/login → TokenDto { token, expiresInSeconds }.
 * Se reutiliza hasta un minuto antes de que venza.
 */
async function tokenPagos() {

    if (sesionPagos && Date.now() < sesionPagos.vence) {
        return sesionPagos.token;
    }

    const respuesta = await pedir(`${PAGOS_URL}/auth/login`, {
        method: 'POST',
        auth: false,
        body: CUENTA_PAGOS,
        mensajeError: 'El servicio de pagos no está disponible en este momento. Intentá de nuevo en unos minutos.',
    });

    sesionPagos = {
        token: respuesta.token,
        vence: Date.now() + Math.max(0, (respuesta.expiresInSeconds ?? 3600) - 60) * 1000,
    };

    return sesionPagos.token;
}

function headersPagos(token) {
    return { Authorization: `Bearer ${token}` };
}

/**
 * Medio de pago del usuario fijo para el tipo elegido en el checkout.
 * POST /api/v1/payment-methods MedioPagoRequest { tipo, numero } → MedioPagoResponse { codigoMedioPago }
 * Se registra una vez por tipo y se reutiliza.
 */
async function medioDePago(tipo, token) {

    if (!mediosRegistrados.has(tipo)) {
        const medio = await pedir(`${PAGOS_URL}/api/v1/payment-methods`, {
            method: 'POST',
            auth: false,
            headers: headersPagos(token),
            body: { tipo, numero: NUMERO_DE_EJEMPLO[tipo] ?? '0000' },
            mensajeError: 'No pudimos registrar el medio de pago.',
        });
        mediosRegistrados.set(tipo, medio.codigoMedioPago);
    }

    return mediosRegistrados.get(tipo);
}

/**
 * POST /api/v1/payments
 * CrearPagoRequest { codigoPedido, codigoUsuario, codigoMedioPago, monto, moneda, claveControl }
 * → PagoResponse { codigoPago, codigoPedido, estado: PENDIENTE|APROBADO|RECHAZADO|NO_AUTORIZADO|ERROR, motivo, ... }
 *
 * RN-05: sólo un rechazo del medio de pago lleva "codigo".
 * Los errores de red o del servidor no tienen código: no son un rechazo.
 */
async function enviarPago(pagoRequest) {

    let pago;

    try {
        const token = await tokenPagos();

        pago = await pedir(API, {
            method: 'POST',
            auth: false,
            headers: headersPagos(token),
            body: {
                codigoPedido: String(pagoRequest.pedidoId),
                codigoUsuario: USUARIO_PAGOS,
                codigoMedioPago: await medioDePago(pagoRequest.metodoPagoId, token),
                monto: Number(pagoRequest.monto),
                moneda: pagoRequest.moneda ?? 'ARS',
                claveControl: siguienteClave(pagoRequest.pedidoId),
            },
            mensajeError: 'El servicio de pagos no está disponible en este momento. Intentá de nuevo en unos minutos.',
        });
    } catch (error) {
        // 4xx con cuerpo: el medio de pago fue rechazado o los datos no son válidos.
        if (error.status >= 400 && error.status < 500 && error.status !== 401 && error.status !== 403) {
            error.codigo = error.codigo ?? `HTTP_${error.status}`;
        } else {
            // 401/403: el token de Pagos venció o no sirve; se pide uno nuevo en el próximo intento.
            if (error.status === 401 || error.status === 403) sesionPagos = null;
            error.codigo = undefined;
        }
        throw error;
    }

    // El pago puede crearse y quedar rechazado: también es un rechazo (RN-05).
    if (ESTADOS_RECHAZO.includes(pago?.estado)) {
        const error = new Error(pago.estado === 'RECHAZADO'
            ? 'Tu pago fue rechazado por fondos insuficientes. Probá con otro medio de pago.'
            : 'Tu pago no fue autorizado por la entidad emisora. Probá con otro medio de pago.');
        error.codigo = pago.estado === 'RECHAZADO' ? 'INSUFFICIENT_FUNDS' : `PAGO_${pago.estado}`;
        throw error;
    }

    return pago;
}

/**
 * API-05: procesa el pago de un pedido.
 * pagoRequest { pedidoId, monto, moneda, metodoPagoId (TARJETA_CREDITO | TARJETA_DEBITO | BILLETERA_VIRTUAL | TRANSFERENCIA) }
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
    const token = await tokenPagos();
    return pedir(`${API}/${codigoPago}`, {
        auth: false,
        headers: headersPagos(token),
        mensajeError: 'No pudimos consultar el pago.',
    });
}
