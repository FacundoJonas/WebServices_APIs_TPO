/*
 * Ícono de cada tipo de dirección.
 */
const labelIcons = {
    Casa: "home",
    Trabajo: "work",
    Otro: "bookmark",
}

/**
 * Tarjeta de una dirección guardada.
 *
 * Props:
 * @param {Object} direccion
 * { id, etiqueta, calle, pisoDepto, barrio, ciudad, indicaciones }.
 *
 * @param {boolean} isDefault
 * Indica si es la dirección predeterminada.
 *
 * @param {Function} onSetDefault
 * Marca la dirección como predeterminada.
 *
 * @param {Function} onDelete
 * Elimina la dirección.
 */
function AddressCard({ direccion, isDefault, onSetDefault, onDelete }) {

    const etiqueta = direccion.etiqueta ?? "Casa"

    /**
     * Pide confirmación antes de eliminar.
     */
    function handleDelete() {
        if (window.confirm(`¿Eliminar la dirección "${direccion.calle}"?`)) {
            onDelete()
        }
    }

    return (
        <div
            className={`rounded-xl p-space-lg flex flex-col md:flex-row md:items-start justify-between gap-space-md
                ${isDefault ? "bg-surface-container-low" : "bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow"}`}
        >

            <div className="flex items-start gap-space-md">

                {/* Ícono según el tipo de dirección */}
                <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                        ${isDefault ? "bg-primary-fixed text-primary" : "bg-surface-container text-primary"}`}
                >
                    <span className="material-symbols-outlined text-[26px]">
                        {labelIcons[etiqueta] ?? "location_on"}
                    </span>
                </div>

                <div className="flex flex-col">

                    <div className="flex items-center gap-space-sm flex-wrap">

                        <span className="font-headline-sm text-headline-sm text-on-surface">
                            {etiqueta}
                        </span>

                        {isDefault && (
                            <span className="px-space-xs py-0.5 rounded-full bg-primary text-on-primary font-caption-bold text-caption-bold flex items-center gap-1">

                                <span className="material-symbols-outlined text-[13px]">
                                    check
                                </span>

                                Predeterminada
                            </span>
                        )}
                    </div>

                    <p className="font-body-lg-medium text-body-lg-medium text-on-surface mt-1">
                        {direccion.calle}
                        {direccion.pisoDepto && `, ${direccion.pisoDepto}`}
                    </p>

                    <p className="font-body-md text-body-md text-secondary">
                        {direccion.barrio}, {direccion.ciudad}
                    </p>

                    {/* Indicaciones para el repartidor */}
                    {direccion.indicaciones && (
                        <div className="mt-space-sm p-space-sm rounded-lg bg-surface-container flex items-start gap-space-xs max-w-xl">

                            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                                info
                            </span>

                            <p className="font-body-md text-body-md text-on-surface-variant">
                                <span className="font-body-md-medium text-body-md-medium text-on-surface">
                                    Indicaciones:
                                </span>{" "}
                                {direccion.indicaciones}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Acciones. La predeterminada no se puede eliminar. */}
            {!isDefault && (
                <div className="flex items-center gap-space-xs self-end md:self-start shrink-0">

                    <button
                        type="button"
                        onClick={onSetDefault}
                        className="px-space-sm py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-caption-bold text-caption-bold flex items-center gap-1 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            check_circle
                        </span>

                        Usar como predeterminada
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        aria-label={`Eliminar dirección ${direccion.calle}`}
                        className="p-space-xs rounded-lg bg-surface-container-low hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            delete
                        </span>
                    </button>
                </div>
            )}
        </div>
    )
}

export default AddressCard
