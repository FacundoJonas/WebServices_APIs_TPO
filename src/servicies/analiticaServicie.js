import { OPINIONES_ANALITICA_URL } from './api';
import { obtenerToken } from './authServicie';
import { obtenerTableroMock } from './mocks/analiticaMock';

const API = `${OPINIONES_ANALITICA_URL}/api/v1/analytics`;

// Cambiar a false cuando el Módulo Opiniones y Analítica esté disponible
const USE_MOCK = true;

function headers() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${obtenerToken()}`
    };
}

/**
 * CU-10 GET /api/v1/analytics/dashboard?from=&to=
 * Solo para el rol ADMIN (RN-10). Las fechas van en formato YYYY-MM-DD.
 * TODO: acordar con el Equipo 7 la forma de la respuesta.
 */
export async function obtenerTablero(desde, hasta) {

    if (USE_MOCK) {
        return obtenerTableroMock(desde, hasta);
    }

    const params = new URLSearchParams({ from: desde, to: hasta });

    const r = await fetch(`${API}/dashboard?${params}`, {
        headers: headers()
    });

    if (r.status === 403) {
        throw new Error('No tenés permisos para ver las métricas.');
    }

    if (!r.ok) {
        throw new Error('No pudimos cargar las métricas. Intentá nuevamente.');
    }

    return r.json();
}
