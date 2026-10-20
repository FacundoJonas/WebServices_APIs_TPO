import { BASE_URL } from './api';
import { obtenerToken } from './authServicie';
import { obtenerUsuarioPorIdMock } from './mocks/usersMock';

const API = `${BASE_URL}/api/v1/users`;

// Cambiar a false cuando el Módulo Usuarios esté disponible
const USE_MOCK = true;

function headers() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${obtenerToken()}`
    };
}

/**
 * GET /api/v1/users/{id}
 * Devuelve los datos del usuario: nombre, apellido, email y direcciones.
 */
export async function obtenerUsuarioPorId(id) {

    if (USE_MOCK) {
        return obtenerUsuarioPorIdMock(id);
    }

    const r = await fetch(`${API}/${id}`, {
        headers: headers()
    });

    if (!r.ok) {
        throw new Error('No se pudieron obtener los datos del usuario');
    }

    return r.json();
}