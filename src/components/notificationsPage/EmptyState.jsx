import { Link } from "react-router"

/**
 * Vista que se muestra cuando no hay notificaciones.
 *
 * Props:
 * @param {Function} onRestore
 * Vuelve a mostrar la lista de notificaciones.
 */
function EmptyState({ onRestore }) {

    return (
        <div className="flex flex-col items-center justify-center text-center py-space-3xl px-space-md rounded-2xl bg-surface-container-lowest shadow-sm">

            {/* Ilustración */}
            <div className="relative w-28 h-28 mb-space-lg flex items-center justify-center">

                <div className="absolute inset-0 rounded-full bg-surface-container-low animate-pulse" />

                <div className="relative w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">

          <span className="material-symbols-outlined text-[48px] text-secondary">
            notifications_off
          </span>
                </div>

                <div className="absolute bottom-1 right-2 w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center shadow-sm">

          <span className="material-symbols-outlined text-[16px] text-on-primary-container">
            check
          </span>
                </div>
            </div>

            {/* Mensaje */}
            <h2 className="font-headline-md text-headline-md text-on-surface mb-space-2xs">
                Estás al día
            </h2>

            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mb-space-xl">
                No tenés notificaciones pendientes por el momento. Te avisaremos cuando
                haya novedades de tus pedidos o promos disponibles.
            </p>

            {/* Acciones */}
            <div className="flex items-center gap-space-sm flex-wrap justify-center">

                <Link
                    to="/comercio"
                    className="inline-flex items-center gap-space-xs px-space-lg py-space-xs bg-primary-container text-on-primary font-body-md-medium text-body-md-medium rounded-xl shadow-sm hover:bg-primary transition-colors"
                >

          <span className="material-symbols-outlined text-[20px]">
            storefront
          </span>

                    <span>
            Volver a inicio
          </span>
                </Link>

                <button
                    type="button"
                    onClick={onRestore}
                    className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium rounded-xl transition-colors"
                >

          <span className="material-symbols-outlined text-[20px]">
            refresh
          </span>

                    <span>
            Restaurar lista
          </span>
                </button>
            </div>
        </div>
    )
}

export default EmptyState