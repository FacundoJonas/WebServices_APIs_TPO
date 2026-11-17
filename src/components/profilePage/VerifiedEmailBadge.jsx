/**
 * Tilde verde que indica que el email está validado.
 *
 * Al pasar el mouse (o al enfocarlo con el teclado) muestra un cartel
 * que explica que por ese medio se envían las notificaciones
 * (canal EMAIL del Módulo Notificaciones).
 *
 * Props:
 * @param {string} className
 * Clases extra para ubicarlo (por ejemplo, dentro de un input).
 */
function VerifiedEmailBadge({ className = "" }) {

    const message = "Email validado, por este medio se envían las notificaciones"

    return (
        <span
            tabIndex={0}
            role="img"
            aria-label={message}
            className={`group relative inline-flex shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/40 ${className}`}
        >
            <span
                className="material-symbols-outlined text-[18px] text-primary-container"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
            >
                check_circle
            </span>

            {/* Cartel que aparece al pasar el mouse o al enfocar */}
            <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full right-0 mb-2 w-56 rounded-lg bg-inverse-surface px-space-sm py-space-xs text-left font-caption-sm text-caption-sm text-inverse-on-surface shadow-lg opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 z-20"
            >
                {message}
            </span>
        </span>
    )
}

export default VerifiedEmailBadge
