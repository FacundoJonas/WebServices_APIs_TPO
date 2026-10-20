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