import { NOTIF_URL } from './api';

const API = `${NOTIF_URL}/api/v1/notifications`;

// El Módulo Notificaciones (006) ya está disponible, por eso no usa mock

/**
 * GET /api/v1/notifications/{id}
 */
export async function obtenerNotificacion(id) {

    const r = await fetch(`${API}/${id}`);

    if (!r.ok) {
        console.error('Error al obtener notificación:', await r.json().catch(() => null));
        throw new Error('No pudimos cargar la notificación. Intentá nuevamente.');
    }

    return r.json();
}

/**
 * POST /api/v1/notifications/{id}/retry
 */
export async function reintentarNotificacion(id) {

    const r = await fetch(`${API}/${id}/retry`, {
        method: 'POST'
    });

    if (!r.ok) {
        console.error('Error al reintentar notificación:', await r.json().catch(() => null));
        throw new Error('No pudimos reintentar el envío. Intentá nuevamente.');
    }

    return r.json();
}

/**
 * POST /api/v1/notifications
 * { destinatarioId, plantillaId, canal, parametros }
 */
export async function crearNotificacion(datos) {

    const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });

    if (!r.ok) {
        console.error('Error al crear notificación:', await r.json().catch(() => null));
        throw new Error('No pudimos crear la notificación. Intentá nuevamente.');
    }

    return r.json();
}
