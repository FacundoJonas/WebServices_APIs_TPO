const usuariosMock = [
    {
        id: 1,
        nombre: "Administrador",
        apellido: "DeliveryGo",
        email: "admin@gmail.com",
        direcciones: []
    },
    {
        id: 2,
        nombre: "Lucas",
        apellido: "Martínez",
        email: "cliente@gmail.com",
        direcciones: [
            {
                id: 1,
                calle: "Av. Corrientes 1450, Piso 4 B",
                barrio: "Balvanera",
                ciudad: "CABA"
            }
        ]
    },
    {
        id: 3,
        nombre: "La Birra Bar",
        apellido: "",
        email: "local@gmail.com",
        direcciones: []
    }
];

export async function obtenerUsuarioPorIdMock(id) {

    await new Promise(resolve => setTimeout(resolve, 500));

    const usuario = usuariosMock.find(u => u.id === id);

    if (!usuario) {
        throw new Error("Usuario no encontrado");
    }

    return usuario;
}

/*
 * Crea el perfil de un usuario recién registrado.
 * Lo usa registerMock para que GET /users/{id} lo encuentre.
 */
export function crearPerfilMock(perfil) {
    usuariosMock.push(perfil);
}

/*
 * POST /api/v1/users/{id}/addresses
 * Agrega una dirección al perfil simulado.
 */
export async function crearDireccionMock(usuarioId, direccion) {

    await new Promise(resolve => setTimeout(resolve, 300));

    const usuario = usuariosMock.find(u => u.id === usuarioId);

    if (!usuario) {
        throw new Error("Usuario no encontrado");
    }

    const nueva = {
        id: Math.max(0, ...usuario.direcciones.map(d => d.id)) + 1,
        etiqueta: usuario.direcciones.length === 0 ? "Casa" : undefined,
        ...direccion
    };

    usuario.direcciones.push(nueva);

    return nueva;
}
