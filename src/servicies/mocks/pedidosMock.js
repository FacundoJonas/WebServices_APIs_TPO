
/*
 * Cupones válidos simulados (RN-02).
 */
const cuponesMock = [
    { codigo: "DELIVERYGO20", descuento: 1500, montoMinimo: 5000 },
    { codigo: "BIRRAFEST", descuento: 1500, montoMinimo: 10000 },
]

const ENVIO = 850
const TARIFA_SERVICIO = 350

// Guarda los pedidos creados mientras la página esté abierta.
const pedidosMock = []

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/*
 * API-04 POST /pedidos
 * Recibe DTO-04 (CrearPedidoRequest) y devuelve DTO-05 (PedidoResponse).
 */
export async function crearPedidoMock(pedidoRequest) {

    await esperar(600)

    if (!pedidoRequest.items || pedidoRequest.items.length === 0) {
        throw new Error("No se puede crear un pedido con el carrito vacío.")
    }

    const subtotal = pedidoRequest.items.reduce(
        (total, item) => total + item.precioUnitario * item.cantidad, 0)

    const pedido = {
        id: 1000 + pedidosMock.length + 1,
        estado: "PENDIENTE_PAGO",
        subtotal,
        envio: ENVIO,
        tarifaServicio: TARIFA_SERVICIO,
        descuento: 0,
        total: subtotal + ENVIO + TARIFA_SERVICIO,
    }

    pedidosMock.push(pedido)

    // Se devuelve una copia para no compartir el objeto con el estado de React.
    return { ...pedido }
}

/*
 * API-09 POST /pedidos/{id}/cupon
 * Recibe DTO-08 (AplicarCuponRequest) y devuelve DTO-05 actualizado.
 */
export async function aplicarCuponMock(pedidoId, codigoCupon) {

    await esperar(500)

    const pedido = pedidosMock.find(p => p.id === pedidoId)

    if (!pedido) {
        throw new Error("Pedido no encontrado.")
    }

    const cupon = cuponesMock.find(c => c.codigo === codigoCupon.toUpperCase())

    if (!cupon) {
        throw new Error("El cupón no existe o está vencido.")
    }

    if (pedido.subtotal < cupon.montoMinimo) {
        throw new Error(`El cupón requiere una compra mínima de $ ${cupon.montoMinimo.toLocaleString("es-AR")}.`)
    }

    pedido.descuento = cupon.descuento
    pedido.total = pedido.subtotal + pedido.envio + pedido.tarifaServicio - pedido.descuento

    return { ...pedido }
}

/*
 * Historial simulado de pedidos del usuario (CU-07).
 * Tiene la forma del PedidoResponse con los datos que necesita
 * la pantalla "Mis pedidos": comercio, ítems, historial de estados,
 * dirección, medio de pago y calificación.
 */
const historialMock = [
    {
        id: 1012,
        estado: "EN_CAMINO",
        fecha: "2026-11-02T21:40:00-03:00",
        comercio: { id: 1, nombre: "La Birra Bar" },
        items: [
            { productoId: 11, nombre: "Hamburguesa doble con cheddar", cantidad: 2, precioUnitario: 7200 },
            { productoId: 14, nombre: "Papas rústicas", cantidad: 1, precioUnitario: 2800 },
        ],
        subtotal: 17200, envio: 850, tarifaServicio: 350, descuento: 0, total: 18400,
        direccion: "Av. Corrientes 1450, Piso 4 B · Balvanera, CABA",
        medioPago: "Mastercard •••• 8819",
        repartidor: "Matías G.",
        minutosEstimados: 12,
        historial: [
            { estado: "CONFIRMADO", fecha: "2026-11-02T21:40:00-03:00" },
            { estado: "EN_PREPARACION", fecha: "2026-11-02T21:48:00-03:00" },
            { estado: "EN_CAMINO", fecha: "2026-11-02T22:05:00-03:00" },
        ],
        calificacion: null,
    },
    {
        id: 984,
        estado: "ENTREGADO",
        fecha: "2026-10-28T20:15:00-03:00",
        comercio: { id: 2, nombre: "Pizzería Güerrín" },
        items: [
            { productoId: 21, nombre: "Pizza grande de muzzarella", cantidad: 1, precioUnitario: 9800 },
            { productoId: 23, nombre: "Fainá", cantidad: 2, precioUnitario: 1600 },
        ],
        subtotal: 13000, envio: 950, tarifaServicio: 350, descuento: 1500, total: 12800,
        direccion: "Av. Corrientes 1450, Piso 4 B · Balvanera, CABA",
        medioPago: "Mercado Pago",
        repartidor: "Camila R.",
        historial: [
            { estado: "CONFIRMADO", fecha: "2026-10-28T20:15:00-03:00" },
            { estado: "EN_PREPARACION", fecha: "2026-10-28T20:20:00-03:00" },
            { estado: "EN_CAMINO", fecha: "2026-10-28T20:41:00-03:00" },
            { estado: "ENTREGADO", fecha: "2026-10-28T20:58:00-03:00" },
        ],
        calificacion: null,
    },
    {
        id: 942,
        estado: "ENTREGADO",
        fecha: "2026-10-21T22:00:00-03:00",
        comercio: { id: 3, nombre: "Sushiclub Recoleta" },
        items: [
            { productoId: 31, nombre: "Combo 30 piezas", cantidad: 1, precioUnitario: 24500 },
            { productoId: 35, nombre: "Gyozas de cerdo", cantidad: 1, precioUnitario: 3900 },
        ],
        subtotal: 28400, envio: 1200, tarifaServicio: 350, descuento: 0, total: 29950,
        direccion: "Av. Corrientes 1450, Piso 4 B · Balvanera, CABA",
        medioPago: "Visa •••• 4410",
        repartidor: "Federico P.",
        historial: [
            { estado: "CONFIRMADO", fecha: "2026-10-21T22:00:00-03:00" },
            { estado: "EN_PREPARACION", fecha: "2026-10-21T22:06:00-03:00" },
            { estado: "EN_CAMINO", fecha: "2026-10-21T22:30:00-03:00" },
            { estado: "ENTREGADO", fecha: "2026-10-21T22:52:00-03:00" },
        ],
        calificacion: { puntaje: 4.5, comentario: "Llegó a buena temperatura" },
    },
    {
        id: 890,
        estado: "CANCELADO",
        fecha: "2026-10-14T17:30:00-03:00",
        comercio: { id: 1, nombre: "La Birra Bar" },
        items: [
            { productoId: 12, nombre: "Hamburguesa veggie", cantidad: 1, precioUnitario: 6900 },
        ],
        subtotal: 6900, envio: 850, tarifaServicio: 350, descuento: 0, total: 8100,
        direccion: "Av. Corrientes 1450, Piso 4 B · Balvanera, CABA",
        medioPago: "Visa •••• 4410",
        motivoCancelacion: "El comercio no tenía stock. El reembolso se acredita en 24 h.",
        historial: [
            { estado: "PENDIENTE_PAGO", fecha: "2026-10-14T17:30:00-03:00" },
            { estado: "CANCELADO", fecha: "2026-10-14T17:34:00-03:00" },
        ],
        calificacion: null,
    },
    {
        id: 851,
        estado: "ENTREGADO",
        fecha: "2026-10-05T13:10:00-03:00",
        comercio: { id: 2, nombre: "Pizzería Güerrín" },
        items: [
            { productoId: 22, nombre: "Fugazzeta rellena", cantidad: 1, precioUnitario: 11200 },
        ],
        subtotal: 11200, envio: 950, tarifaServicio: 350, descuento: 0, total: 12500,
        direccion: "Av. Corrientes 1450, Piso 4 B · Balvanera, CABA",
        medioPago: "Mercado Pago",
        repartidor: "Matías G.",
        historial: [
            { estado: "CONFIRMADO", fecha: "2026-10-05T13:10:00-03:00" },
            { estado: "EN_PREPARACION", fecha: "2026-10-05T13:14:00-03:00" },
            { estado: "EN_CAMINO", fecha: "2026-10-05T13:35:00-03:00" },
            { estado: "ENTREGADO", fecha: "2026-10-05T13:51:00-03:00" },
        ],
        calificacion: { puntaje: 5, comentario: "Impecable" },
    },
]

/*
 * CU-07 GET /pedidos?usuarioId=&estados=&page=&size=
 * Devuelve una página de pedidos, del más nuevo al más viejo.
 */
export async function listarPedidosMock(usuarioId, { estados = [], page = 0, size = 4 } = {}) {

    await esperar(700)

    const filtrados = historialMock.filter(
        p => estados.length === 0 || estados.includes(p.estado))

    const inicio = page * size

    return {
        content: filtrados.slice(inicio, inicio + size).map(p => ({ ...p })),
        page,
        size,
        totalElements: filtrados.length,
        totalPages: Math.max(1, Math.ceil(filtrados.length / size)),
    }
}
