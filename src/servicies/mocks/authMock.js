
const usuariosMock = [
    {
        username: "admin@gmail.com",
        password: "123456",
        rol: "ADMIN",
        nombre: "Administrador"
    },
    {
        username: "cliente@gmail.com",
        password: "123456",
        rol: "CLIENTE",
        nombre: "Cliente de prueba"
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
        rol: usuario.rol
    }))}.mock`;

    return {
        token,
        username: usuario.username,
        nombre: usuario.nombre,
        rol: usuario.rol
    };
}
