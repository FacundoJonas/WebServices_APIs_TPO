/**
 * Tarjeta informativa pequeña (push, resumen semanal, preferencias).
 *
 * Props:
 * @param {string} icon
 * Nombre del ícono de Material Symbols.
 *
 * @param {string} iconColor
 * Clase de color del ícono.
 *
 * @param {string} title
 * Texto principal.
 *
 * @param {string} subtitle
 * Texto secundario.
 */
function InfoTile({ icon, iconColor, title, subtitle }) {

    return (
        <div className="flex items-center gap-space-md p-space-md rounded-xl bg-surface-container-low">

            <div className={`w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center shadow-sm ${iconColor}`}>

        <span className="material-symbols-outlined text-[22px]">
          {icon}
        </span>
            </div>

            <div className="flex flex-col">

        <span className="font-body-md-medium text-body-md-medium text-on-surface">
          {title}
        </span>

                <span className="font-caption-sm text-caption-sm text-secondary">
          {subtitle}
        </span>
            </div>
        </div>
    )
}

export default InfoTile