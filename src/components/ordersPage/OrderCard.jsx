import OrderStatusBadge from "./OrderStatusBadge"
import { estadosEnCurso, formatearFecha, formatearPrecio } from "./orderStatus"

/**
 * Tarjeta de un pedido en el historial.
 *
 * Las acciones dependen del estado:
 * - En curso: "Seguir en vivo".
 * - Entregado sin calificar: "Calificar" (RN-08).
 * - Entregado y calificado: muestra el puntaje.
 * - Entregado o cancelado: "Volver a pedir".
 *
 * Props:
 * @param {Object} pedido
 * Pedido (PedidoResponse).
 *
 * @param {boolean} selected
 * Indica si es el pedido que se ve en el panel de detalle.
 *
 * @param {Function} onSelect
 * Abre el detalle del pedido.
 *
 * @param {Function} onRate
 * Lleva a la pantalla de calificación.
 *
 * @param {Function} onReorder
 * Vuelve a armar el pedido en el comercio.
 */
function OrderCard({ pedido, selected, onSelect, onRate, onReorder }) {

    const enCurso = estadosEnCurso.includes(pedido.estado)
    const entregado = pedido.estado === "ENTREGADO"
    const cancelado = pedido.estado === "CANCELADO"

    /*
     * Iniciales del comercio para el avatar. Ejemplo: "La Birra Bar" -> "LB".
     */
    const initials = pedido.comercio.nombre
        .split(" ")
        .slice(0, 2)
        .map((palabra) => palabra[0])
        .join("")
        .toUpperCase()

    const resumen = pedido.items
        .map((item) => `${item.cantidad}x ${item.nombre}`)
        .join(", ")

    return (
        <article
            className={`bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col gap-space-md
                ${selected ? "ring-2 ring-primary-container" : ""}`}
        >
            {/* Comercio, fecha y estado */}
            <div className="flex items-start justify-between gap-space-sm">

                <div className="flex items-center gap-space-sm">

                    <div className="w-12 h-12 rounded-xl bg-primary-fixed/50 text-primary flex items-center justify-center font-title-md text-title-md shrink-0">
                        {initials}
                    </div>

                    <div>
                        <h2 className="font-title-md text-title-md text-on-surface">
                            {pedido.comercio.nombre}
                        </h2>

                        <p className="font-caption-sm text-caption-sm text-on-surface-variant">
                            {formatearFecha(pedido.fecha)} · Pedido{" "}
                            <span className="font-caption-bold text-caption-bold text-on-surface">
                                #{pedido.id}
                            </span>
                        </p>
                    </div>
                </div>

                <OrderStatusBadge estado={pedido.estado} />
            </div>

            {/* Productos y total */}
            <div className="bg-surface rounded-lg p-space-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">

                <div>
                    <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
                        {resumen}
                    </p>

                    {pedido.motivoCancelacion && (
                        <p className="font-caption-sm text-caption-sm text-error mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">info</span>
                            {pedido.motivoCancelacion}
                        </p>
                    )}
                </div>

                <div className="flex sm:flex-col items-baseline sm:items-end justify-between gap-1 shrink-0">

                    <span className="font-caption-sm text-caption-sm text-on-surface-variant">
                        {cancelado ? "Monto reintegrado" : "Total"}
                    </span>

                    <span className={`font-headline-sm text-headline-sm ${cancelado ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                        {formatearPrecio(pedido.total)}
                    </span>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap items-center justify-between gap-space-sm">

                <div className="flex items-center gap-space-xs text-on-surface-variant font-caption-sm text-caption-sm">

                    {pedido.calificacion ? (
                        <span className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container-low text-on-surface font-caption-bold text-caption-bold">
                            <span className="material-symbols-outlined text-[16px] text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                                star
                            </span>
                            Calificado {pedido.calificacion.puntaje}
                        </span>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-[18px]">credit_card</span>
                            {pedido.medioPago}
                        </>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-space-xs">

                    <button
                        type="button"
                        onClick={onSelect}
                        className="px-space-md py-space-xs rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium transition-colors"
                    >
                        Ver detalle
                    </button>

                    {enCurso && (
                        <button
                            type="button"
                            onClick={onSelect}
                            className="px-space-md py-space-xs rounded-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-body-md-medium text-body-md-medium shadow-sm transition-all flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[18px]">near_me</span>
                            Seguir en vivo
                        </button>
                    )}

                    {(entregado || cancelado) && (
                        <button
                            type="button"
                            onClick={onReorder}
                            className="px-space-md py-space-xs rounded-full bg-surface-container-lowest border border-outline-variant/40 text-primary hover:bg-surface-container-low font-body-md-medium text-body-md-medium transition-all flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[18px]">replay</span>
                            Volver a pedir
                        </button>
                    )}

                    {entregado && !pedido.calificacion && (
                        <button
                            type="button"
                            onClick={onRate}
                            className="px-space-md py-space-xs rounded-full bg-primary-container hover:bg-primary text-on-primary font-body-md-medium text-body-md-medium shadow-sm transition-all flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                star
                            </span>
                            Calificar
                        </button>
                    )}
                </div>
            </div>
        </article>
    )
}

export default OrderCard
