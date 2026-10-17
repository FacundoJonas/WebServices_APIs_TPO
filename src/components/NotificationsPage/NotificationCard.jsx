/**
 * Tarjeta individual del Centro de Notificaciones.
 *
 * Props:
 * @param {Object} notification
 * Datos de la notificación (icono, badge, título, descripción, acción, etc.).
 *
 * @param {Function} onClick
 * Función que se ejecuta al hacer clic sobre la tarjeta (marca como leída).
 */
function NotificationCard({ notification, onClick }) {

    const { icon, iconClass, badge, badgeClass, time, title, description, action, read } = notification

    return (
        <article
            onClick={onClick}
            className="group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md p-space-md lg:p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
            <div className="flex items-start gap-space-md min-w-0">

                {/* Ícono de la notificación */}
                <div className={`relative shrink-0 flex items-center justify-center w-12 h-12 rounded-xl ${iconClass}`}>

                    <span className="material-symbols-outlined text-[26px]">
                        {icon}
                    </span>

                    {/* Punto de "no leída". Solo se muestra si read = false */}
                    {!read && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary-container ring-2 ring-surface-container-lowest" />
                    )}
                </div>

                {/* Contenido */}
                <div className="flex flex-col min-w-0">

                    <div className="flex items-center gap-space-xs flex-wrap mb-1">

                        <span className={`inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full font-caption-bold text-[11px] leading-none ${badgeClass}`}>
                            {badge}
                        </span>
                        <span className="font-caption-sm text-caption-sm text-secondary">
                            {time}
                        </span>
                    </div>

                    <h3 className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">
                        {title}
                    </h3>

                    <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mt-0.5">
                        {description}
                    </p>
                </div>
            </div>

            {/* Acción de la derecha. Cambia según action.kind */}
            <div className="flex items-center gap-space-xs shrink-0 self-end md:self-center">
                <NotificationAction action={action} />
            </div>
        </article>
    )
}

/**
 * Renderiza la acción de la tarjeta según su tipo.
 *
 * Tipos posibles:
 * "link"     -> texto con flecha.
 * "button"   -> botón con fondo.
 * "text"     -> botón de texto subrayable.
 * "verified" -> etiqueta de verificado.
 */
function NotificationAction({ action }) {

    if (action.kind === "link") {

        return (
            <span className="inline-flex items-center gap-1 text-primary-container font-body-md-medium text-body-md-medium">

        {action.label}

                <span className="material-symbols-outlined text-[18px]">
          chevron_right
        </span>
      </span>
        )
    }

    if (action.kind === "button") {

        return (
            <button
                type="button"
                className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-body-md-medium text-body-md-medium transition-colors"
            >

                {action.icon && (
                    <span className="material-symbols-outlined text-primary-container text-[18px]">
            {action.icon}
          </span>
                )}

                <span>
          {action.label}
        </span>
            </button>
        )
    }

    if (action.kind === "text") {

        return (
            <button
                type="button"
                className="text-primary font-body-md-medium text-body-md-medium hover:underline"
            >
                {action.label}
            </button>
        )
    }

    // action.kind === "verified"
    return (
        <span className="flex items-center gap-space-xs text-outline">

      <span className="font-caption-sm text-caption-sm">
        {action.label}
      </span>

      <span className="material-symbols-outlined text-[18px] text-primary-container">
        verified_user
      </span>
    </span>
    )
}

export default NotificationCard