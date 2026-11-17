/*
 * CU-05 Seguir el estado del pedido (paso 9 del flujo: Portal ↔ Pedidos).
 *
 * Convierte el PedidoResponse de GET /api/v1/orders/{id} (ya mapeado por
 * pedidosServicie) al formato de ActiveOrderCard / OrderStepper.
 *
 * Estados del contrato: BORRADOR, CONFIRMADO, EN_PREPARACION, EN_CAMINO,
 * ENTREGADO, CANCELADO. Repartidor, mapa y distancia son de Logística, que no
 * publica ningún GET: con un pedido real esos bloques no se muestran.
 */

const PASOS = [
    { id: "confirmed", estado: "CONFIRMADO", label: "Confirmado", icon: "check" },
    { id: "preparing", estado: "EN_PREPARACION", label: "En preparación", icon: "skillet" },
    { id: "on-the-way", estado: "EN_CAMINO", label: "En camino", icon: "two_wheeler" },
    { id: "delivered", estado: "ENTREGADO", label: "Entregado", icon: "home" },
]

const TEXTO_ESTADO = {
    BORRADOR: "Esperando la confirmación del pago",
    CONFIRMADO: "Pedido confirmado: el comercio lo va a preparar",
    EN_PREPARACION: "El comercio está preparando tu pedido",
    EN_CAMINO: "Tu pedido está en camino",
    ENTREGADO: "Pedido entregado",
    CANCELADO: "Pedido cancelado",
}

/** Estados en los que el pedido ya no cambia: se deja de consultar. */
export const ESTADOS_FINALES = ["ENTREGADO", "CANCELADO"]

function hora(fecha) {
    if (!fecha) return ""
    return `${new Date(fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })} hs`
}

/**
 * @param {Object} pedido     pedido mapeado por pedidosServicie (estado, historial)
 * @param {string} storeName  nombre del comercio guardado al confirmar
 */
export function armarSeguimiento(pedido, storeName) {

    const actual = PASOS.findIndex((paso) => paso.estado === pedido.estado)

    const steps = PASOS.map((paso, i) => {
        const cambio = pedido.historial?.findLast?.((h) => h.estadoNuevo === paso.estado)
            ?? pedido.historial?.filter((h) => h.estadoNuevo === paso.estado).at(-1)

        let status = "pending"
        if (actual > i || pedido.estado === "ENTREGADO") status = "done"
        else if (actual === i) status = "current"

        return {
            id: paso.id,
            label: paso.label,
            icon: status === "done" ? "check" : paso.icon,
            time: cambio ? hora(cambio.fechaCambio) : "Pendiente",
            status,
        }
    })

    // Progreso de la barra: 0 % en BORRADOR, 100 % al entregar.
    const progress = actual < 0 ? 0 : Math.round(((actual + 1) / PASOS.length) * 100)

    const ultimoCambio = pedido.historial?.at(-1)

    return {
        id: pedido.id,
        storeName: storeName ?? "Tu pedido",
        etaLabel: `${TEXTO_ESTADO[pedido.estado] ?? pedido.estado}${ultimoCambio ? ` · ${hora(ultimoCambio.fechaCambio)}` : ""}`,
        estado: pedido.estado,
        progress,
        steps,
        courier: null,
        mapImage: null,
        distanceLabel: null,
        trackingPath: "/pedidos",
    }
}
