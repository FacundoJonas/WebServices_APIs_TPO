import { obtenerToken } from './authServicie';

/*
 * Cliente HTTP común a todos los servicios del Portal.
 *
 * Antes cada servicio repetía su propio fetch, sus headers y su manejo de
 * errores. Acá queda en un solo lugar lo que pide el contrato del ecosistema:
 *   - JWT Bearer (lo emite Usuarios y lo validan los demás módulos).
 *   - X-Correlation-Id en cada request, para seguir una operación entre módulos.
 *   - Errores con formato común (ErrorResponse: status, code, message).
 *
 * RN-11: ante un 4xx/5xx o una falla de red se lanza un Error con un mensaje
 * comprensible, y la pantalla decide cómo mostrarlo sin romperse.
 */

/**
 * Genera un id para el header X-Correlation-Id.
 */
export function nuevoCorrelationId() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return `portal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Lee el mensaje de error de la respuesta.
 * Usuarios, Pedidos y Pagos devuelven ErrorResponse { code, message };
 * Catálogo devuelve ErrorResponseDTO { error, message }.
 */
async function leerError(r) {
    const data = await r.json().catch(() => ({}));
    return {
        codigo: data.code ?? data.codigo ?? data.error ?? null,
        mensaje: data.message ?? data.mensaje ?? null,
    };
}

/**
 * Hace un request JSON a un módulo.
 *
 * @param {string} url              URL completa (prefijo del módulo + ruta del contrato)
 * @param {Object} opciones
 * @param {string} opciones.method  GET por defecto
 * @param {Object} opciones.body    se envía como JSON
 * @param {Object} opciones.headers headers extra (ej. X-Cliente-Id)
 * @param {boolean} opciones.auth   si es false no se manda el token (endpoints públicos)
 * @param {string} opciones.mensajeError mensaje para el usuario si falla
 * @returns {Promise<any>} el cuerpo de la respuesta, o null si es 204
 */
export async function pedir(url, { method = 'GET', body, headers = {}, auth = true, mensajeError = 'Ocurrió un error. Intentá nuevamente.' } = {}) {

    const token = auth ? obtenerToken() : null;

    let r;

    try {
        r = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Correlation-Id': nuevoCorrelationId(),
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...headers,
            },
            ...(body !== undefined && { body: JSON.stringify(body) }),
        });
    } catch {
        const error = new Error('No pudimos comunicarnos con el servidor. Revisá tu conexión e intentá de nuevo.');
        error.status = 0;
        throw error;
    }

    if (!r.ok) {
        const { codigo, mensaje } = await leerError(r);

        let texto = mensaje ?? mensajeError;
        if (r.status === 401) texto = 'Tu sesión venció. Volvé a iniciar sesión.';
        if (r.status === 403) texto = 'No tenés permisos para realizar esta acción.';
        if (r.status >= 500) texto = mensajeError;

        const error = new Error(texto);
        error.status = r.status;
        error.codigo = codigo;
        throw error;
    }

    if (r.status === 204) {
        return null;
    }

    return r.json().catch(() => null);
}
