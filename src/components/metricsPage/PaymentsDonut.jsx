import { formatearNumero, formatearPorcentaje } from "./format"

/*
 * Largo de la circunferencia del anillo (radio 14).
 */
const CIRCUNFERENCIA = 2 * Math.PI * 14

/**
 * Anillo con la proporción de pagos aprobados y rechazados.
 *
 * Props:
 * @param {Object} pagos
 * Bloque de pagos del tablero: { aprobados, rechazados, fondosInsuficientes }.
 */
function PaymentsDonut({ pagos }) {

    const segmentos = [
        { label: "Aprobados", cantidad: pagos.aprobados, color: "#006B53", dot: "bg-primary" },
        { label: "Rechazo del emisor", cantidad: pagos.rechazados, color: "#E5A000", dot: "bg-[#E5A000]" },
        { label: "Fondos insuficientes", cantidad: pagos.fondosInsuficientes, color: "#ba1a1a", dot: "bg-error" },
    ]

    const total = segmentos.reduce((suma, s) => suma + s.cantidad, 0)

    /*
     * Cada segmento arranca donde terminó el anterior.
     */
    let recorrido = 0

    return (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-space-md">

            <div className="relative w-36 h-36">

                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90" aria-hidden="true">

                    <circle cx="18" cy="18" r="14" fill="none" stroke="#dce2f3" strokeWidth="4.5" />

                    {segmentos.map((s) => {

                        const largo = total ? (s.cantidad / total) * CIRCUNFERENCIA : 0
                        const offset = -recorrido
                        recorrido += largo

                        return (
                            <circle
                                key={s.label}
                                cx="18" cy="18" r="14" fill="none"
                                stroke={s.color} strokeWidth="4.5"
                                strokeDasharray={`${largo} ${CIRCUNFERENCIA}`}
                                strokeDashoffset={offset}
                            />
                        )
                    })}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                        {formatearPorcentaje(pagos.aprobados, total)}
                    </span>
                    <span className="font-caption-sm text-caption-sm text-on-surface-variant">
                        Aprobados
                    </span>
                </div>
            </div>

            <ul className="flex flex-col gap-space-xs">
                {segmentos.map((s) => (
                    <li key={s.label} className="flex items-center gap-space-xs">

                        <span className={`w-3 h-3 rounded-full shrink-0 ${s.dot}`} />

                        <div className="flex flex-col">
                            <span className="font-body-md-medium text-body-md-medium text-on-surface">
                                {formatearPorcentaje(s.cantidad, total)} {s.label}
                            </span>
                            <span className="font-caption-sm text-caption-sm text-on-surface-variant">
                                {formatearNumero(s.cantidad)} operaciones
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default PaymentsDonut
