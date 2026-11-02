/**
 * Selector del período del tablero: atajos y fechas desde/hasta.
 *
 * Props:
 * @param {Array} presets
 * Atajos con la forma { id, label }.
 *
 * @param {string} activePreset
 * id del atajo elegido, o "" si se eligieron fechas a mano.
 *
 * @param {string} desde
 * @param {string} hasta
 * Fechas en formato YYYY-MM-DD.
 *
 * @param {Function} onPreset
 * Recibe el id del atajo.
 *
 * @param {Function} onRange
 * Recibe (desde, hasta) cuando se cambia una fecha.
 */
function PeriodSelector({ presets, activePreset, desde, hasta, onPreset, onRange }) {

    const inputClass = "h-9 px-space-xs rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/30"

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm flex-wrap">

            <div className="inline-flex p-1 bg-surface-container-low rounded-full">
                {presets.map((preset) => (
                    <button
                        key={preset.id}
                        type="button"
                        onClick={() => onPreset(preset.id)}
                        className={`px-space-sm py-1 rounded-full font-body-md-medium text-body-md-medium transition-all
                            ${activePreset === preset.id ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-xl">

                <span className="material-symbols-outlined text-primary text-[20px]">
                    calendar_today
                </span>

                <label className="sr-only" htmlFor="metricas-desde">Desde</label>
                <input
                    id="metricas-desde"
                    type="date"
                    value={desde}
                    max={hasta}
                    onChange={(e) => e.target.value && onRange(e.target.value, hasta)}
                    className={inputClass}
                />

                <span className="font-caption-sm text-caption-sm text-on-surface-variant">hasta</span>

                <label className="sr-only" htmlFor="metricas-hasta">Hasta</label>
                <input
                    id="metricas-hasta"
                    type="date"
                    value={hasta}
                    min={desde}
                    onChange={(e) => e.target.value && onRange(desde, e.target.value)}
                    className={inputClass}
                />
            </div>
        </div>
    )
}

export default PeriodSelector
