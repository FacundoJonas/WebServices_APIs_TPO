/**
 * Contenedor de una métrica del tablero.
 *
 * Al pie muestra siempre la fuente y el período (RN-09).
 * Si la fuente falló, muestra el error con un botón para reintentar,
 * sin afectar al resto del tablero (falla parcial, RN-11).
 *
 * Props:
 * @param {string} title
 * @param {string} subtitle
 * @param {string} icon
 * Ícono de Material Symbols.
 *
 * @param {string} fuente
 * Módulo de donde salen los datos. Ejemplo: "Pagos".
 *
 * @param {string} periodo
 * Texto del período. Ejemplo: "01/10/2026 – 31/10/2026".
 *
 * @param {string} error
 * Mensaje de error de la fuente, si falló.
 *
 * @param {Function} onRetry
 * Vuelve a pedir el tablero.
 *
 * @param {string} className
 * Clases extra (por ejemplo, el ancho en la grilla).
 */
function MetricCard({ title, subtitle, icon, fuente, periodo, error, onRetry, className = "", children }) {

    return (
        <section
            className={`rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-md
                ${error ? "bg-error-container/20" : "bg-surface-container-lowest"} ${className}`}
        >
            <div>
                <div className="flex items-start justify-between gap-space-sm">

                    <div>
                        <h2 className="font-title-md text-title-md text-on-surface">
                            {title}
                        </h2>

                        {subtitle && (
                            <p className="font-caption-sm text-caption-sm text-on-surface-variant">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {icon && (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
                            ${error ? "bg-error/10 text-error" : "bg-primary-fixed/40 text-primary"}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {error ? "warning" : icon}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-space-md">
                    {error ? (
                        <div className="flex flex-col items-start gap-space-sm">

                            <p className="font-body-md text-body-md text-on-surface-variant">
                                No pudimos cargar los datos de {fuente}. {error}
                            </p>

                            <button
                                type="button"
                                onClick={onRetry}
                                className="px-space-md py-1.5 rounded-full bg-error text-on-error font-caption-bold text-caption-bold flex items-center gap-1 shadow-sm hover:opacity-90 transition-opacity"
                            >
                                <span className="material-symbols-outlined text-[16px]">refresh</span>
                                Reintentar
                            </button>
                        </div>
                    ) : children}
                </div>
            </div>

            {/* Fuente y período */}
            <p className="pt-space-xs border-t border-surface-container-high flex items-center gap-1 text-on-surface-variant font-caption-sm text-caption-sm">
                <span className="material-symbols-outlined text-[14px]">dataset</span>
                Fuente: {fuente} · {periodo}
            </p>
        </section>
    )
}

export default MetricCard
