import { ANALITICA_URL } from './api';
import { pedir, nuevoCorrelationId } from './http';
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
 * Headers obligatorios: X-Usuario-Id y X-Correlation-Id.
 */
export async function crearResena({ pedidoId, tipoObjetivo, puntuacion, comentario }) {

    if (USE_MOCK) {
        await esperar(500);
        return { id: Date.now(), pedidoId, tipoObjetivo, puntuacion, comentario };
    }

    const usuario = obtenerUsuario();

    return pedir(`${API}/reviews`, {
        method: 'POST',
        headers: {
            'X-Usuario-Id': String(usuario?.id),
            'X-Correlation-Id': nuevoCorrelationId(),
        },
        body: { pedidoId, tipoObjetivo, puntuacion, comentario },
        mensajeError: 'No pudimos enviar tu calificación. Intentá nuevamente.',
    }).catch((error) => {
        if (error.status === 409) {
            throw new Error('Ya calificaste este pedido.');
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
