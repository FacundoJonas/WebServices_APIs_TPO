
/*
 * Cupones válidos simulados (RN-02).
 */
const cuponesMock = [
    { codigo: "DELIVERYGO20", descuento: 1500, montoMinimo: 5000 },
    { codigo: "BIRRAFEST", descuento: 1500, montoMinimo: 10000 },
]

const ENVIO = 850
const TARIFA_SERVICIO = 350

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/*
 * Todos los pedidos del usuario: tanto los de demo (para que "Mis pedidos"
 * no arranque vacío) como los que se van creando de verdad al comprar.
 * Es una sola fuente: así un pedido recién creado (BORRADOR incluido)
 * también aparece en "Mis pedidos", no solo los de la demo.
 *
 * Tiene la forma de PedidoResponse (estado, items con nombreProducto,
 * historial con estadoAnterior/estadoNuevo/fechaCambio, fechaCreacion).
 * "comercio", "direccion", "medioPago" y "calificacion" son enriquecidos
 * propios del mock: el swagger no los devuelve (solo da comercioId y
 * direccionEntregaId), así que la UI los trata como opcionales.
 */
const pedidosMock = [
    {
        id: 1012,
        estado: "EN_CAMINO",
        fechaCreacion: "2026-11-02T21:40:00-03:00",
        fechaActualizacion: "2026-11-02T22:05:00-03:00",
        comercio: { id: 1, nombre: "La Birra Bar" },
        items: [
            { productoId: 11, nombreProducto: "Hamburguesa doble con cheddar", cantidad: 2, precioUnitario: 7200 },
            { productoId: 14, nombreProducto: "Papas rústicas", cantidad: 1, precioUnitario: 2800 },
        ],
        subtotal: 17200, envio: 850, tarifaServicio: 350, descuento: 0, total: 18400,
        direccion: "Av. Corrientes 1450, Piso 4 B · Balvanera, CABA",
        medioPago: "Mastercard •••• 8819",
        repartidor: "Matías G.",
        minutosEstimados: 12,
        historial: [
            { estadoAnterior: "BORRADOR", estadoNuevo: "CONFIRMADO", fechaCambio: "2026-11-02T21:40:00-03:00", motivo: null },
            { estadoAnterior: "CONFIRMADO", estadoNuevo: "EN_PREPARACION", fechaCambio: "2026-11-02T21:48:00-03:00", motivo: null },
            { estadoAnterior: "EN_PREPARACION", estadoNuevo: "EN_CAMINO", fechaCambio: "2026-11-02T22:05:00-03:00", motivo: null },
        ],
        calificacion: null,
    },
    {
        id: 984,
        estado: "ENTREGADO",
        fechaCreacion: "2026-10-28T20:15:00-03:00",
        fechaActualizacion: "2026-10-28T20:58:00-03:00",
        comercio: { id: 2, nombre: "Pizzería Güerrín" },
        items: [
            { productoId: 21, nombreProducto: "Pizza grande de muzzarella", cantidad: 1, precioUnitario: 9800 },
            { productoId: 23, nombreProducto: "Fainá", cantidad: 2, precioUnitario: 1600 },
        ],
        subtotal: 13000, envio: 950, tarifaServicio: 350, descuento: 1500, total: 12800,
        direccion: "Av. Corrientes 1450, Piso 4 B · Balvanera, CABA",
        medioPago: "Mercado Pago",
        repartidor: "Camila R.",
        historial: [
            { estadoAnterior: "BORRADOR", estadoNuevo: "CONFIRMADO", fechaCambio: "2026-10-28T20:15:00-03:00", motivo: null },
            { estadoAnterior: "CONFIRMADO", estadoNuevo: "EN_PREPARACION", fechaCambio: "2026-10-28T20:20:00-03:00", motivo: null },
            { estadoAnterior: "EN_PREPARACION", estadoNuevo: "EN_CAMINO", fechaCambio: "2026-10-28T20:41:00-03:00", motivo: null },
            { estadoAnterior: "EN_CAMINO", estadoNuevo: "ENTREGADO", fechaCambio: "2026-10-28T20:58:00-03:00", motivo: null },
        ],
        calificacion: null,
    },
    {
        id: 942,
        estado: "ENTREGADO",
        fechaCreacion: "2026-10-21T22:00:00-03:00",
        fechaActualizacion: "2026-10-21T22:52:00-03:00",
        comercio: { id: 3, nombre: "Sushiclub Recoleta" },
        items: [
            { productoId: 31, nombreProducto: "Combo 30 piezas", cantidad: 1, precioUnitario: 24500 },
            { productoId: 35, nombreProducto: "Gyozas de cerdo", cantidad: 1, precioUnitario: 3900 },
        ],
        subtotal: 28400, envio: 1200, tarifaServicio: 350, descuento: 0, total: 29950,
        direccion: "Av. Corrientes 1450, Piso 4 B · Balvanera, CABA",
        medioPago: "Visa •••• 4410",
        repartidor: "Federico P.",
        historial: [
            { estadoAnterior: "BORRADOR", estadoNuevo: "CONFIRMADO", fechaCambio: "2026-10-21T22:00:00-03:00", motivo: null },
            { estadoAnterior: "CONFIRMADO", estadoNuevo: "EN_PREPARACION", fechaCambio: "2026-10-21T22:06:00-03:00", motivo: null },
            { estadoAnterior: "EN_PREPARACION", estadoNuevo: "EN_CAMINO", fechaCambio: "2026-10-21T22:30:00-03:00", motivo: null },
            { estadoAnterior: "EN_CAMINO", estadoNuevo: "ENTREGADO", fechaCambio: "2026-10-21T22:52:00-03:00", motivo: null },
        ],
        calificacion: { puntaje: 4.5, comentario: "Llegó a buena temperatura" },
    },
    {
        id: 890,
        estado: "CANCELADO",
        fechaCreacion: "2026-10-14T17:30:00-03:00",
        fechaActualizacion: "2026-10-14T17:34:00-03:00",
        comercio: { id: 1, nombre: "La Birra Bar" },
        items: [
            { productoId: 12, nombreProducto: "Hamburguesa veggie", cantidad: 1, precioUnitario: 6900 },
        ],
        subtotal: 6900, envio: 850, tarifaServicio: 350, descuento: 0, total: 8100,
        direccion: "Av. Corrientes 1450, Piso 4 B · Balvanera, CABA",
        medioPago: "Visa •••• 4410",
        historial: [
            { estadoAnterior: null, estadoNuevo: "BORRADOR", fechaCambio: "2026-10-14T17:30:00-03:00", motivo: null },
            { estadoAnterior: "BORRADOR", estadoNuevo: "CANCELADO", fechaCambio: "2026-10-14T17:34:00-03:00", motivo: "El comercio no tenía stock. El reembolso se acredita en 24 h." },
        ],
        calificacion: null,
    },
    {
        id: 851,
        estado: "ENTREGADO",
        fechaCreacion: "2026-10-05T13:10:00-03:00",
        fechaActualizacion: "2026-10-05T13:51:00-03:00",
        comercio: { id: 2, nombre: "Pizzería Güerrín" },
        items: [
            { productoId: 22, nombreProducto: "Fugazzeta rellena", cantidad: 1, precioUnitario: 11200 },
        ],
        subtotal: 11200, envio: 950, tarifaServicio: 350, descuento: 0, total: 12500,
        direccion: "Av. Corrientes 1450, Piso 4 B · Balvanera, CABA",
        medioPago: "Mercado Pago",
        repartidor: "Matías G.",
        historial: [
            { estadoAnterior: "BORRADOR", estadoNuevo: "CONFIRMADO", fechaCambio: "2026-10-05T13:10:00-03:00", motivo: null },
            { estadoAnterior: "CONFIRMADO", estadoNuevo: "EN_PREPARACION", fechaCambio: "2026-10-05T13:14:00-03:00", motivo: null },
            { estadoAnterior: "EN_PREPARACION", estadoNuevo: "EN_CAMINO", fechaCambio: "2026-10-05T13:35:00-03:00", motivo: null },
            { estadoAnterior: "EN_CAMINO", estadoNuevo: "ENTREGADO", fechaCambio: "2026-10-05T13:51:00-03:00", motivo: null },
        ],
        calificacion: { puntaje: 5, comentario: "Impecable" },
    },
]

/*
 * CU-01 POST /orders
 * Crea el pedido en BORRADOR, sin items y con total cero.
 */
export async function crearPedidoMock({ comercioId, direccionEntregaId }) {

    await esperar(600)

    const ahora = new Date().toISOString()

    const id = Math.max(...pedidosMock.map(p => p.id), 1000) + 1

    const pedido = {
        id,
        comercioId,
        direccionEntregaId,
        estado: "BORRADOR",
        items: [],
        // subtotal/envio/tarifaServicio/descuento no están en PedidoResponse:
        // son un desglose propio del Front para mostrar el resumen del carrito.
        subtotal: 0,
        envio: ENVIO,
        tarifaServicio: TARIFA_SERVICIO,
        descuento: 0,
        total: 0,
        moneda: "ARS",
        fechaCreacion: ahora,
        fechaActualizacion: ahora,
        historial: [],
    }

    pedidosMock.push(pedido)

    // Se devuelve una copia para no compartir el objeto con el estado de React.
    return { ...pedido }
}

/*
 * CU-02 POST /orders/{id}/items
 * Carga las líneas del carrito en el pedido y recalcula el total.
 */
export async function agregarItemsMock(pedidoId, items) {

    await esperar(500)

    const pedido = pedidosMock.find(p => p.id === pedidoId)

    if (!pedido) {
        throw new Error("Pedido no encontrado.")
    }

    pedido.items = items
    pedido.subtotal = items.reduce((total, item) => total + item.precioUnitario * item.cantidad, 0)
    pedido.total = pedido.subtotal + pedido.envio + pedido.tarifaServicio - pedido.descuento
    pedido.fechaActualizacion = new Date().toISOString()

    return { ...pedido }
}

/*
 * CU-03 POST /orders/{id}/confirm
 * Pasa el pedido a CONFIRMADO y simula el pago con el medio elegido.
 */
export async function confirmarPedidoMock(pedidoId, medioPago) {

    await esperar(800)

    const pedido = pedidosMock.find(p => p.id === pedidoId)

    if (!pedido) {
        throw new Error("Pedido no encontrado.")
    }

    const ahora = new Date().toISOString()

    pedido.historial.push({
        estadoAnterior: pedido.estado,
        estadoNuevo: "CONFIRMADO",
        fechaCambio: ahora,
        motivo: null,
    })

    pedido.estado = "CONFIRMADO"
    pedido.medioPago = medioPago
    pedido.pagoId = `mock-pago-${pedido.id}`
    pedido.fechaActualizacion = ahora

    return { ...pedido }
}

/*
 * CU-05 GET /orders/{id}
 */
export async function consultarPedidoMock(pedidoId) {

    await esperar(400)

    const idBuscado = String(pedidoId)

    const pedido = pedidosMock.find(p => String(p.id) === idBuscado)

    if (!pedido) {
        throw new Error("Pedido no encontrado.")
    }

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
 * CU-07 GET /pedidos?usuarioId=&estados=&page=&size=
 * Devuelve una página de pedidos, del más nuevo al más viejo.
 */
export async function listarPedidosMock(usuarioId, { estados = [], page = 0, size = 4 } = {}) {

    await esperar(700)

    const filtrados = pedidosMock
        .filter(p => estados.length === 0 || estados.includes(p.estado))
        .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))

    const inicio = page * size

    return {
        content: filtrados.slice(inicio, inicio + size).map(p => ({ ...p })),
        page,
        size,
        totalElements: filtrados.length,
        totalPages: Math.max(1, Math.ceil(filtrados.length / size)),
    }
}
