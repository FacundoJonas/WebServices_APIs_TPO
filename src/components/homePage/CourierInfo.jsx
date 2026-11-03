/**
 * Información del repartidor asignado al pedido.
 *
 * Props:
 * @param {Object} courier
 * Repartidor con la forma { name, rating, image, vehicle }.
 */
function CourierInfo({ courier }) {

    return (
        <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-low rounded-xl p-space-sm">

            <div className="flex items-center gap-space-sm">

                {/* Foto con insignia de verificado */}
                <div className="relative">

                    <img
                        src={courier.image}
                        alt={`Repartidor ${courier.name}`}
                        className="w-10 h-10 rounded-full object-cover shadow-sm"
                    />

                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary-container text-on-primary flex items-center justify-center">

                        <span className="material-symbols-outlined text-[10px]">
                            check
                        </span>
                    </span>
                </div>

                {/* Nombre, calificación y vehículo */}
                <div className="flex flex-col">

                    <div className="flex items-center gap-space-xs">

                        <span className="font-body-md-medium text-body-md-medium text-on-surface">
                            {courier.name}
                        </span>

                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-container-lowest text-on-surface font-caption-bold text-[11px] shadow-sm">

                            <span
                                className="material-symbols-outlined text-primary-container text-[12px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                star
                            </span>

                            {courier.rating}
                        </span>
                    </div>

                    <span className="font-caption-sm text-caption-sm text-on-surface-variant">
                        {courier.vehicle}
                    </span>
                </div>
            </div>

            {/* Contacto */}
            <div className="flex items-center gap-space-xs">

                <button
                    type="button"
                    aria-label="Llamar al repartidor"
                    className="p-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
                >

                    <span className="material-symbols-outlined text-[18px]">
                        phone
                    </span>
                </button>

                <button
                    type="button"
                    aria-label="Enviar mensaje al repartidor"
                    className="p-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
                >

                    <span className="material-symbols-outlined text-[18px]">
                        chat
                    </span>
                </button>
            </div>
        </div>
    )
}

export default CourierInfo