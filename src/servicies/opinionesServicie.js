import { ANALITICA_URL } from './api';
import { pedir } from './http';
import { obtenerUsuario } from './authServicie';

/*
 * Módulo Opiniones y Analítica (Grupo 4) — CU-09 Calificar comercio y repartidor.
 * Contrato: doc/swagger-ecosistema.yaml → /api/v1/reviews, /merchants/{id}/rating, /couriers/{id}/rating
 *
 * RN-08: sólo los pedidos ENTREGADOS pueden calificarse, una reseña por
 * usuario y pedido. Lo valida el módulo; el Portal muestra el error.
 */
const API = `${ANALITICA_URL}/api/v1`;

// Cambiar a false cuando el Módulo Opiniones y Analítica esté disponible
const USE_MOCK = true;

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * POST /api/v1/reviews
 * ResenaRequest { pedidoId, tipoObjetivo: COMERCIO|REPARTIDOR, puntuacion, comentario } → ResenaResponse
 * Headers: X-Usuario-Id (obligatorio); X-Correlation-Id lo agrega pedir().
 */
export async function crearResena({ pedidoId, tipoObjetivo, puntuacion, comentario }) {

    if (USE_MOCK) {
        await esperar(500);
        return { id: Date.now(), pedidoId, tipoObjetivo, puntuacion, comentario };
    }

    const usuario = obtenerUsuario();

    // ResenaRequest.pedidoId es int64. Pedidos usa UUID (D10): si el id no es
    // numérico se manda igual y el módulo responde el error de validación.
    const id = /^\d+$/.test(String(pedidoId)) ? Number(pedidoId) : pedidoId;

    return pedir(`${API}/reviews`, {
        method: 'POST',
        headers: { 'X-Usuario-Id': String(usuario?.id) },
        body: { pedidoId: id, tipoObjetivo, puntuacion, comentario },
        mensajeError: 'No pudimos enviar tu calificación. Intentá nuevamente.',
    }).catch((error) => {
        if (error.status === 409) {
            throw new Error('Ya calificaste este pedido.');
        }
        // RN-08: el pedido no existe, no es del usuario o todavía no fue entregado.
        if (error.status === 422) {
            throw new Error(error.message || 'Sólo podés calificar pedidos entregados.');
        }
        throw error;
    });
}

/**
 * GET /api/v1/merchants/{id}/rating → RatingResponse { objetivoId, tipoObjetivo, promedio, cantidadResenas }
 */
export async function obtenerRatingComercio(comercioId) {

    if (USE_MOCK) {
        return { objetivoId: comercioId, tipoObjetivo: 'COMERCIO', promedio: 4.8, cantidadResenas: 1200 };
    }

    return pedir(`${API}/merchants/${comercioId}/rating`, {
        mensajeError: 'No pudimos cargar la calificación del comercio.',
    });
}

/**
 * GET /api/v1/couriers/{id}/rating → RatingResponse
 */
export async function obtenerRatingRepartidor(repartidorId) {

    if (USE_MOCK) {
        return { objetivoId: repartidorId, tipoObjetivo: 'REPARTIDOR', promedio: 4.9, cantidadResenas: 850 };
    }

    return pedir(`${API}/couriers/${repartidorId}/rating`, {
        mensajeError: 'No pudimos cargar la calificación del repartidor.',
    });
}
