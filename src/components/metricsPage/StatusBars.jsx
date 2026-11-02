import { formatearNumero, formatearPorcentaje } from "./format"

/*
 * Texto y color de cada estado del pedido.
 */
const estados = {
    ENTREGADO: { label: "Entregado", color: "bg-primary" },
    EN_CAMINO: { label: "En camino", color: "bg-tertiary" },
    EN_PREPARACION: { label: "En preparación", color: "bg-[#E5A000]" },
    CANCELADO: { label: "Cancelado", color: "bg-error" },
}

/**
 * Barras horizontales con la cantidad de pedidos por estado.
 *
 * Props:
 * @param {Array} porEstado
 * Lista de { estado, cantidad }.
 */
function StatusBars({ porEstado }) {

    const total = porEstado.reduce((suma, e) => suma + e.cantidad, 0)

    return (
        <ul className="flex flex-col gap-space-md">
            {porEstado.map(({ estado, cantidad }) => {

                const config = estados[estado] ?? { label: estado, color: "bg-outline" }

                return (
                    <li key={estado}>

                        <div className="flex justify-between items-center mb-1">

                            <span className="font-body-md-medium text-body-md-medium text-on-surface flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                                {config.label}
                            </span>

                            <span className="font-body-md-medium text-body-md-medium text-on-surface">
                                {formatearNumero(cantidad)}
                                <span className="font-caption-sm text-caption-sm text-on-surface-variant ml-1">
                                    ({formatearPorcentaje(cantidad, total)})
                                </span>
                            </span>
                        </div>

                        <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                            <div
                                className={`h-full rounded-full ${config.color}`}
                                style={{ width: total ? `${(cantidad / total) * 100}%` : 0 }}
                            />
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}

export default StatusBars
