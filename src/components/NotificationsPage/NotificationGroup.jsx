import NotificationCard from "./NotificationCard"

/**
 * Agrupa notificaciones bajo un título ("Hoy", "Esta semana", etc.).
 *
 * Props:
 * @param {string} title
 * Título del grupo.
 *
 * @param {string} subtitle
 * Texto secundario al lado del título.
 *
 * @param {boolean} highlight
 * Si es true muestra un punto verde al lado del título.
 *
 * @param {Array} notifications
 * Notificaciones que pertenecen al grupo.
 *
 * @param {Function} onRead
 * Recibe el id de la notificación clickeada.
 */
function NotificationGroup({ title, subtitle, highlight, notifications, onRead }) {

    return (
        <section className="flex flex-col gap-space-md">

            {/* Encabezado del grupo */}
            <div className="flex items-center gap-space-xs">

        <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
          {title}
        </span>

                {highlight && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                )}

                <span className="font-caption-sm text-caption-sm text-outline">
          {subtitle}
        </span>
            </div>

            {/* Tarjetas del grupo */}
            <div className="flex flex-col gap-space-sm">

                {notifications.map((notification) => (
                    <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onClick={() => onRead(notification.id)}
                    />
                ))}
            </div>
        </section>
    )
}

export default NotificationGroup