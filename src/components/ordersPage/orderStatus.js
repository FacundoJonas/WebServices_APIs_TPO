/*
 * Cómo se muestra cada estado del pedido (Módulo Pedidos).
 */
export const estadosPedido = {
    PENDIENTE_PAGO: {
        label: "Pendiente de pago",
        icon: "schedule",
        classes: "bg-surface-container-high text-on-surface-variant",
    },
    CONFIRMADO: {
        label: "Confirmado",
        icon: "check",
        classes: "bg-primary-fixed/40 text-on-primary-fixed",
    },
    EN_PREPARACION: {
        label: "En preparación",
        icon: "skillet",
        classes: "bg-[#E5A000]/15 text-[#7a5500]",
    },
    EN_CAMINO: {
        label: "En camino",
        icon: "two_wheeler",
        classes: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    },
    ENTREGADO: {
        label: "Entregado",
        icon: "check_circle",
        classes: "bg-primary-fixed/40 text-on-primary-fixed",
    },
    CANCELADO: {
        label: "Cancelado",
        icon: "cancel",
        classes: "bg-error-container text-on-error-container",
    },
}

/*
 * Estados que se consideran "en curso".
 */
export const estadosEnCurso = ["PENDIENTE_PAGO", "CONFIRMADO", "EN_PREPARACION", "EN_CAMINO"]

export function formatearPrecio(valor) {
    return `$ ${valor.toLocaleString("es-AR")}`
}

export function formatearFecha(iso) {
    return new Date(iso).toLocaleString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export function formatearHora(iso) {
    return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}
