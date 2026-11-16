import { crearPerfilMock } from './usersMock';

const usuariosMock = [
    {
        id: 1,
        username: "admin@gmail.com",
        password: "1234",
        rol: "ADMIN"
    },
    {
        id: 2,
        username: "cliente@gmail.com",
        password: "1234",
        rol: "CLIENTE"
    },
    {
        id: 3,
        username: "local@gmail.com",
        password: "1234",
        rol: "LOCAL"
    }
];

export async function loginMock(email, password) {

    // Simulamos una pequeña demora del servidor
    await new Promise(resolve => setTimeout(resolve, 500));

    const usuario = usuariosMock.find(
        u => u.username === email && u.password === password
    );

    if (!usuario) {
        throw new Error("Usuario o contraseña incorrectos");
    }

    // JWT ficticio. No es un token firmado ni sirve para autenticar
    // solicitudes reales contra Spring Boot.
    const token = `mock.${btoa(JSON.stringify({
        sub: usuario.username,
        id: usuario.id,
        rol: usuario.rol
    }))}.mock`;

    return {
        token,
        usuarioId: usuario.id
    };
}

/*
 * POST /api/v1/auth/register
 * Rechaza el registro si el email ya existe (regla "Email único").
 *
 * Los usuarios nuevos viven en memoria: se pierden al recargar la página.
 * El backend real no guarda la contraseña en texto plano.
 */
export async function registerMock(datos) {

    // Simulamos una pequeña demora del servidor
    await new Promise(resolve => setTimeout(resolve, 500));

    const existe = usuariosMock.some(u => u.username === datos.email);

    if (existe) {
        throw new Error("Ya existe una cuenta con ese correo electrónico.");
    }

    const id = Math.max(...usuariosMock.map(u => u.id)) + 1;

    usuariosMock.push({
        id,
        username: datos.email,
        password: datos.password,
        rol: "CLIENTE"
    });

    crearPerfilMock({
        id,
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        telefono: datos.telefono,
        rol: "CLIENTE",
        // El registro ya no pide dirección, así que arranca sin ninguna.
        direcciones: []
    });

    return { id, email: datos.email, rol: "CLIENTE" };
}