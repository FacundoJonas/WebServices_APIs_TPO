import { BASE_URL } from './api';
import { loginMock } from './mocks/authMock';
const API = `${BASE_URL}/v1/auth`;

// Cambiar a false cuando quieras utilizar Spring Boot
const USE_MOCK = true;

export async function login(username, password) {

    let data;

    if (USE_MOCK) {
        data = await loginMock(username, password);
    } else {

        const r = await fetch(`${API}`, {
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

    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('usuario', JSON.stringify({
        username: data.username,
        nombre: data.nombre,
        rol: data.rol
    }));

    return data;
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
