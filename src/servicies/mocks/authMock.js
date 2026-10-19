
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

export async function loginMock(username, password) {

    // Simulamos una pequeña demora del servidor
    await new Promise(resolve => setTimeout(resolve, 500));

    const usuario = usuariosMock.find(
        u => u.username === username && u.password === password
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
        id: usuario.id,
        username: usuario.username,
        rol: usuario.rol
    };
}
