import { estadosPedido } from "./orderStatus"

/**
 * Chip de color con el estado del pedido.
 *
 * Props:
 * @param {string} estado
 * Estado del pedido. Ejemplo: "EN_CAMINO".
 */
function OrderStatusBadge({ estado }) {

    const config = estadosPedido[estado] ?? estadosPedido.PENDIENTE_PAGO

    return (
        <span className={`inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full font-caption-bold text-caption-bold whitespace-nowrap ${config.classes}`}>

            <span className="material-symbols-outlined text-[16px]">
                {config.icon}
            </span>

            {config.label}
        </span>
    )
}

export default OrderStatusBadge
