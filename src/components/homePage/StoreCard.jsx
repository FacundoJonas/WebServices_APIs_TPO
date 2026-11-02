import { Link } from "react-router"

/**
 * Tarjeta de un comercio en la grilla de destacados.
 *
 * Props:
 * @param {Object} store
 * Comercio con la forma:
 * { id, name, description, rating, deliveryTime: { min, max },
 *   shippingCost, isOpen, opensAt, image, path }
 *
 * @param {boolean} isFavorite
 * Indica si el comercio está guardado como favorito.
 *
 * @param {Function} onToggleFavorite
 * Se ejecuta al hacer clic en el corazón.
 */
function StoreCard({ store, isFavorite, onToggleFavorite }) {

    const hasFreeShipping = store.shippingCost === 0

    /**
     * Evita que el clic en el corazón active el Link de la tarjeta.
     */
    function handleFavoriteClick(event) {
        event.preventDefault()
        event.stopPropagation()
        onToggleFavorite()
    }

    return (
        <Link
            to={store.path}
            className={`group flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden
                ${store.isOpen ? "" : "opacity-85"}`}
        >

            {/* Imagen y etiquetas */}
            <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-container">

                <img
                    src={store.image}
                    alt={store.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300
                        ${store.isOpen ? "" : "grayscale-[30%]"}`}
                />

                {/* Estado del comercio */}
                {store.isOpen ? (

                    <span className="absolute top-space-xs left-space-xs px-2.5 py-1 rounded-full bg-primary-container text-on-primary font-caption-bold text-[11px] shadow-sm flex items-center gap-1">

                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />

                        Abierto
                    </span>

                ) : (

                    <span className="absolute top-space-xs left-space-xs px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-caption-bold text-[11px] shadow-sm flex items-center gap-1">

                        <span className="material-symbols-outlined text-[13px]">
                            schedule
                        </span>

                        Cerrado • Abre {store.opensAt} hs
                    </span>
                )}

                {/* Etiqueta de envío gratis */}
                {hasFreeShipping && (
                    <span className="absolute bottom-space-xs left-space-xs px-2 py-0.5 rounded bg-tertiary text-on-tertiary font-caption-bold text-[10px] shadow-sm">
                        Envío Gratis
                    </span>
                )}

                {/* Favorito */}
                <button
                    type="button"
                    aria-label="Guardar en favoritos"
                    onClick={handleFavoriteClick}
                    className={`absolute top-space-xs right-space-xs w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-colors
                        ${isFavorite ? "text-error" : "text-on-surface hover:text-error"}`}
                >

                    <span
                        className="material-symbols-outlined text-[18px]"
                        style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                        favorite
                    </span>
                </button>
            </div>

            {/* Información del comercio */}
            <div className="p-space-md flex-1 flex flex-col justify-between space-y-space-xs">

                <div>

                    <div className="flex items-start justify-between gap-space-xs">

                        <h3 className="font-title-md text-title-md text-on-surface font-bold group-hover:text-primary transition-colors line-clamp-1">
                            {store.name}
                        </h3>

                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface font-caption-bold text-[12px] shrink-0">

                            <span
                                className="material-symbols-outlined text-primary-container text-[14px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                star
                            </span>

                            {store.rating}
                        </span>
                    </div>

                    <p className="font-caption-sm text-caption-sm text-on-surface-variant line-clamp-1">
                        {store.description}
                    </p>
                </div>

                {/* Tiempo de entrega y costo de envío */}
                <div className={`flex items-center justify-between pt-space-xs font-caption-bold text-caption-bold
                    ${store.isOpen ? "text-on-surface-variant" : "text-secondary"}`}
                >

                    <span className={`flex items-center gap-1 ${store.isOpen ? "text-on-surface" : ""}`}>

                        <span className="material-symbols-outlined text-[16px] text-secondary">
                            schedule
                        </span>

                        {store.deliveryTime.min}-{store.deliveryTime.max} min
                    </span>

                    {hasFreeShipping ? (

                        <span className="flex items-center gap-1 text-primary font-bold">

                            <span className="material-symbols-outlined text-[16px]">
                                redeem
                            </span>

                            Gratis
                        </span>

                    ) : (

                        <span className="flex items-center gap-1">

                            <span className="material-symbols-outlined text-[16px] text-secondary">
                                delivery_dining
                            </span>

                            Envío ${store.shippingCost.toLocaleString("es-AR")}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default StoreCard