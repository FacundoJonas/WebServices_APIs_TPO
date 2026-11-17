import { USUARIOS_URL } from './api';
import { pedir } from './http';
import { loginMock, registerMock } from './mocks/authMock';
import { obtenerUsuarioPorId } from './userServicie';

/*
 * Módulo Usuarios y Autenticación (Grupo 2).
 * Contrato: doc/swagger-ecosistema.yaml → /api/v1/auth/*
 */
const API = `${USUARIOS_URL}/api/v1/auth`;

// Cambiar a false cuando el Módulo Usuarios esté disponible
const USE_MOCK = true;

/**
 * POST /api/v1/auth/login
 * LoginRequest { email, password } → LoginResponse { token, tipo, expiraEn, usuarioId, nombre, rol }
 *
 * Con el usuarioId pide el perfil (GET /api/v1/users/{id}) y guarda todo
 * en sessionStorage. El mismo token se usa en todos los módulos.
 */
export async function login(email, password) {

    let data;

    if (USE_MOCK) {
        data = await loginMock(email, password);
    } else {
        data = await pedir(`${API}/login`, {
            method: 'POST',
            auth: false,
            body: { email, password },
            mensajeError: 'No pudimos iniciar sesión. Intentá nuevamente.',
        }).catch((error) => {
            if (error.status === 401 || error.status === 400) {
                throw new Error('Email o contraseña incorrectos.');
            }
            throw error;
        });
    }

    // El contrato devuelve "usuarioId"; el mock, "id".
    const usuarioId = data.usuarioId ?? data.id;

    // El token se guarda primero porque /users/{id} lo necesita
    sessionStorage.setItem('token', data.token);

    try {
        const usuario = await obtenerUsuarioPorId(usuarioId);

        sessionStorage.setItem('usuario', JSON.stringify({
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            telefono: usuario.telefono,
            rol: data.rol ?? usuario.rol,
            direcciones: usuario.direcciones
        }));

        return { ...data, ...usuario, id: usuarioId };

    } catch (error) {
        // Si falla el perfil, no dejamos una sesión a medias
        logout();
        throw error;
    }
}

/**
 * POST /api/v1/auth/register
 * RegistrarUsuarioRequest { nombre, apellido, email, telefono, password } → UsuarioResponse
 *
 * Crea un usuario CLIENTE. No inicia la sesión: de eso se encarga login().
 * La dirección no forma parte del registro en el contrato: se crea después
 * con POST /api/v1/users/{id}/addresses (ver AuthProvider.register).
 */
export async function register(datos) {

    if (USE_MOCK) {
        return registerMock(datos);
    }

    return pedir(`${API}/register`, {
        method: 'POST',
        auth: false,
        body: {
            nombre: datos.nombre,
            apellido: datos.apellido,
            email: datos.email,
            telefono: datos.telefono,
            password: datos.password,
        },
        mensajeError: 'No pudimos crear tu cuenta. Intentá nuevamente.',
    }).catch((error) => {
        if (error.status === 409) {
            throw new Error('Ya existe una cuenta con ese correo electrónico.');
        }
        throw error;
    });
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
