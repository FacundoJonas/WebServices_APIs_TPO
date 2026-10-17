
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
