import { BASE_URL } from './api';
import { loginMock, registerMock } from './mocks/authMock';

import { obtenerUsuarioPorId } from './userServicie';
const API = `${BASE_URL}/api/v1/auth`;

// Cambiar a false cuando quieras utilizar Spring Boot
const USE_MOCK = true;

/**
 * POST /api/v1/auth/login
 *
 * Inicia sesión y, con el id que devuelve, pide los datos
 * del usuario (GET /api/v1/users/{id}). Guarda todo en sessionStorage.
 */
export async function login(username, password) {

    let data;

    if (USE_MOCK) {
        data = await loginMock(username, password);
    } else {

        const r = await fetch(`${API}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!r.ok) {
            throw new Error('Credenciales inválidas');
        }

        data = await r.json();
    }

    // El token se guarda primero porque /users/{id} lo necesita
    sessionStorage.setItem('token', data.token);

    try {
        const usuario = await obtenerUsuarioPorId(data.id);

        sessionStorage.setItem('usuario', JSON.stringify({
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            telefono: usuario.telefono,
            rol: data.rol,
            direcciones: usuario.direcciones
        }));

        return { ...data, ...usuario };

    } catch (error) {
        // Si falla el perfil, no dejamos una sesión a medias
        logout();
        throw error;
    }
}

/**
 * POST /api/v1/auth/register
 *
 * Crea un usuario nuevo. No inicia la sesión: de eso se encarga login().
 */
export async function register(datos) {

    if (USE_MOCK) {
        return registerMock(datos);
    }

    const r = await fetch(`${API}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
    });

    if (r.status === 409) {
        throw new Error('Ya existe una cuenta con ese correo electrónico.');
    }

    if (!r.ok) {
        throw new Error('No pudimos crear tu cuenta. Intentá nuevamente.');
    }

    return r.json();
}

export function obtenerToken() {
    return sessionStorage.getItem('token');
}

export function obtenerUsuario() {
    const usuario = sessionStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
}

export function logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
}
