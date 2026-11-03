import { formatearFechaCorta, formatearNumero } from "./format"

const WIDTH = 760
const HEIGHT = 200

/**
 * Gráfico de línea con la cantidad de pedidos por día.
 * Marca el día con más pedidos y el promedio del período.
 *
 * Props:
 * @param {Array} porDia
 * Lista de { fecha: "YYYY-MM-DD", cantidad }.
 */
function OrdersLineChart({ porDia }) {

    if (porDia.length === 0) {
        return (
            <p className="font-body-md text-body-md text-on-surface-variant">
                No hay pedidos en el período.
            </p>
        )
    }

    const max = Math.max(...porDia.map((d) => d.cantidad))
    const promedio = porDia.reduce((suma, d) => suma + d.cantidad, 0) / porDia.length

    /*
     * Convierte una posición de la lista y una cantidad en coordenadas del SVG.
     * Se deja un 10% de margen arriba para que el pico no toque el borde.
     */
    const x = (i) => (porDia.length === 1 ? WIDTH / 2 : (i / (porDia.length - 1)) * WIDTH)
    const y = (cantidad) => HEIGHT - (cantidad / (max * 1.1)) * HEIGHT

    const linea = porDia.map((d, i) => `${x(i)},${y(d.cantidad)}`).join(" ")
    const area = `0,${HEIGHT} ${linea} ${WIDTH},${HEIGHT}`

    const pico = porDia.findIndex((d) => d.cantidad === max)

    /*
     * Etiquetas del eje X: hasta 6 fechas repartidas en el período.
     */
    const paso = Math.max(1, Math.ceil(porDia.length / 6))
    const etiquetas = porDia.filter((_, i) => i % paso === 0)

    return (
        <div>
            <div className="flex flex-wrap items-center gap-space-md mb-space-sm font-caption-sm text-caption-sm text-on-surface-variant">

                <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-primary" /> Pedidos por día
                </span>

                <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-outline" /> Promedio ({Math.round(promedio)} por día)
                </span>

                <span className="inline-flex items-center gap-1 text-primary font-caption-bold text-caption-bold">
                    Pico: {formatearFechaCorta(porDia[pico].fecha)} · {formatearNumero(max)} pedidos
                </span>
            </div>

            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                preserveAspectRatio="none"
                className="w-full h-56 overflow-visible"
                role="img"
                aria-label={`Pedidos por día. Máximo ${max}, promedio ${Math.round(promedio)}.`}
            >
                <defs>
                    <linearGradient id="ordersArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#006B53" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#00A884" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Promedio */}
                <line
                    x1="0" x2={WIDTH} y1={y(promedio)} y2={y(promedio)}
                    stroke="#6c7a74" strokeDasharray="4 4" strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                />

                <polygon points={area} fill="url(#ordersArea)" />

                <polyline
                    points={linea}
                    fill="none" stroke="#006B53" strokeWidth="3"
                    strokeLinejoin="round" strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />

                <circle cx={x(pico)} cy={y(max)} r="5" fill="#00A884" stroke="#ffffff" strokeWidth="2" />
            </svg>

            <div className="flex justify-between pt-space-xs border-t border-surface-container-high font-caption-sm text-caption-sm text-on-surface-variant">
                {etiquetas.map((d) => (
                    <span key={d.fecha}>{formatearFechaCorta(d.fecha).slice(0, 5)}</span>
                ))}
            </div>
        </div>
    )
}

export default OrdersLineChart
