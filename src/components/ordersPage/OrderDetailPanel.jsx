import OrderStatusBadge from "./OrderStatusBadge"
import { estadosPedido, formatearHora, formatearPrecio } from "./orderStatus"

/*
 * Pasos que se muestran en la línea de tiempo de un pedido.
 */
const pasos = ["CONFIRMADO", "EN_PREPARACION", "EN_CAMINO", "ENTREGADO"]

/**
 * Panel lateral con el detalle de un pedido:
 * línea de tiempo de estados, productos, totales, dirección y pago.
 *
 * Props:
 * @param {Object} pedido
 * Pedido seleccionado (PedidoResponse).
 *
 * @param {Function} onClose
 * Cierra el panel.
 */
function OrderDetailPanel({ pedido, onClose }) {

    /*
     * Hora en la que el pedido pasó por cada estado.
     */
    const horas = Object.fromEntries(
        pedido.historial.map((paso) => [paso.estado, paso.fecha]))

    const cancelado = pedido.estado === "CANCELADO"

    return (
        <aside className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col gap-space-md lg:sticky lg:top-24">

            {/* Encabezado */}
            <div className="flex items-start justify-between pb-space-sm border-b border-surface-container">

                <div>
                    <div className="flex items-center gap-space-xs">
                        <OrderStatusBadge estado={pedido.estado} />

                        <span className="font-caption-sm text-caption-sm text-on-surface-variant">
                            Pedido #{pedido.id}
                        </span>
                    </div>

                    <h2 className="font-title-md text-title-md text-on-surface mt-space-xs">
                        {pedido.comercio.nombre}
                    </h2>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar detalle"
                    className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>

            {/* Línea de tiempo */}
            <div>
                <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-space-sm">
                    Estado del envío
                </h3>

                {cancelado ? (
                    <p className="font-body-md text-body-md text-error flex items-start gap-space-xs">
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                        {pedido.motivoCancelacion ?? "El pedido fue cancelado."}
                    </p>
                ) : (
                    <div className="relative">

                        {/* Línea vertical */}
                        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-surface-container-high" />

                        <ol className="relative pl-9 flex flex-col gap-space-md">

                            {pasos.map((paso) => {

                                const hecho = Boolean(horas[paso])

                                // El paso en curso se resalta; "Entregado" ya es el final
                                const actual = paso === pedido.estado && paso !== "ENTREGADO"

                                return (
                                    <li key={paso} className={`relative flex items-start justify-between ${hecho ? "" : "opacity-50"}`}>

                                        <span
                                            className={`absolute -left-9 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-surface-container-lowest
                                                ${actual ? "bg-tertiary text-on-tertiary" : hecho ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}
                                        >
                                            <span className="material-symbols-outlined text-[14px]">
                                                {actual ? estadosPedido[paso].icon : hecho ? "check" : "schedule"}
                                            </span>
                                        </span>

                                        <span className={`font-body-md-medium text-body-md-medium ${actual ? "text-tertiary" : "text-on-surface"}`}>
                                            {estadosPedido[paso].label}
                                        </span>

                                        <span className="font-caption-sm text-caption-sm text-on-surface-variant">
                                            {hecho ? formatearHora(horas[paso]) : "—"}
                                        </span>
                                    </li>
                                )
                            })}
                        </ol>
                    </div>
                )}
            </div>

            {/* Productos */}
            <div>
                <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-space-xs">
                    Productos ({pedido.items.length})
                </h3>

                <ul className="flex flex-col divide-y divide-surface-container-low">
                    {pedido.items.map((item) => (
                        <li key={item.productoId} className="py-space-xs flex items-start justify-between gap-space-xs">

                            <span className="flex items-center gap-1.5 font-body-md text-body-md text-on-surface">
                                <span className="w-5 h-5 rounded bg-surface-container flex items-center justify-center text-primary font-caption-bold text-caption-bold">
                                    {item.cantidad}
                                </span>
                                {item.nombre}
                            </span>

                            <span className="font-body-md-medium text-body-md-medium text-on-surface">
                                {formatearPrecio(item.precioUnitario * item.cantidad)}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Totales */}
            <div className="bg-surface rounded-lg p-space-sm flex flex-col gap-1.5 font-body-md text-body-md text-on-surface-variant">

                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatearPrecio(pedido.subtotal)}</span>
                </div>

                <div className="flex justify-between">
                    <span>Envío</span>
                    <span>{formatearPrecio(pedido.envio)}</span>
                </div>

                <div className="flex justify-between">
                    <span>Tarifa de servicio</span>
                    <span>{formatearPrecio(pedido.tarifaServicio)}</span>
                </div>

                {pedido.descuento > 0 && (
                    <div className="flex justify-between text-primary">
                        <span>Descuento por cupón</span>
                        <span>- {formatearPrecio(pedido.descuento)}</span>
                    </div>
                )}

                <div className="border-t border-surface-container my-1" />

                <div className="flex justify-between items-baseline">
                    <span className="font-title-md text-title-md text-on-surface">Total</span>
                    <span className="font-headline-sm text-headline-sm text-primary">
                        {formatearPrecio(pedido.total)}
                    </span>
                </div>
            </div>

            {/* Dirección y pago */}
            <div className="flex flex-col gap-space-xs font-caption-sm text-caption-sm text-on-surface-variant">

                <span className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                    {pedido.direccion}
                </span>

                <span className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px]">payment</span>
                    {pedido.medioPago}
                </span>
            </div>
        </aside>
    )
}

export default OrderDetailPanel
