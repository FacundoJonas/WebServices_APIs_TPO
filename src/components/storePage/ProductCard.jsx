/*
function ProductCard({ product, onAdd }) {
  const {
    name,
    description,
    price,
    image,
    badge,
    badgeIcon,
    badgeColor = "text-primary",
    available = true,
  } = product

  if (!available) {
    return (
      <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm opacity-60 relative overflow-hidden select-none">

        <div className="absolute top-3 right-3 z-10">
         
          <span className="px-space-xs py-1 rounded-md bg-secondary-container text-on-secondary-container font-caption-bold text-caption-bold uppercase tracking-wider flex items-center gap-1">
           
            <span className="material-symbols-outlined text-[14px]"> block</span>
            Sin stock
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md">

          <div className="flex-1 min-w-0">

            <h3 className="font-title-md text-title-md text-secondary font-semibold">{name}</h3>
            <p className="font-body-md text-body-md text-secondary line-clamp-2 mt-1">{description}</p>
            <div className="flex items-center gap-space-md mt-space-md">

              <span className="font-title-md text-title-md text-secondary font-semibold line-through">$ {price.toLocaleString("es-AR")}</span>
              <button
                type="button"
                disabled
                className="h-10 px-space-md rounded-lg bg-surface-container text-secondary font-body-md-medium text-body-md-medium flex items-center gap-1.5 cursor-not-allowed"
              >

                <span className="material-symbols-outlined text-[18px]">remove_shopping_cart</span>
                Agotado
              </button>
            </div>
          </div>

          <div className="w-full sm:w-28 h-40 sm:h-28 rounded-lg overflow-hidden shrink-0 bg-surface-container-high grayscale">

            <img src={image} alt={name} className="w-full h-full object-cover"/>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center justify-between gap-space-md group">

      <div className="flex-1 min-w-0">

        {badge && (
          <div className="flex items-center gap-space-xs mb-1">

            {badgeIcon && (
              <span
                className={`material-symbols-outlined text-[16px] ${badgeColor}`}
                style={{
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                {badgeIcon}
              </span>
            )}

            <span className={`font-caption-bold text-caption-bold uppercase tracking-wide ${badgeColor}`}>{badge}</span>
          </div>
        )}

        <h3 className="font-title-md text-title-md text-on-surface font-semibold group-hover:text-primary-container transition-colors">{name}</h3>

        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mt-1">{description}</p>

        <div className="flex items-center justify-between sm:justify-start gap-space-md mt-space-md">

          <span className="font-title-md text-title-md text-on-surface font-bold tracking-tight">$ {price.toLocaleString("es-AR")}</span>

          <button
            type="button"
            onClick={() => onAdd(product)}
            className="h-10 px-space-md rounded-lg bg-primary-container text-on-primary font-body-md-medium text-body-md-medium flex items-center gap-1.5 shadow-sm hover:bg-primary transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Agregar</span>
          </button>
        </div>
      </div>

      <div className="w-full sm:w-28 h-40 sm:h-28 rounded-lg overflow-hidden shrink-0 bg-surface-container relative">

        <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
      </div>
    </article>
  )
}

export default ProductCard
*/

/**
 * Tarjeta reutilizable para representar un producto
 * disponible dentro del catálogo del comercio.
 *
 * Props:
 * @param {Object} product
 * Objeto que contiene la información del producto.
 *
 * @param {Function} onAdd
 * Función ejecutada cuando el usuario agrega
 * el producto al carrito.
 */
function ProductCard({ product, onAdd }) {

  /*
   * Desestructuración de las propiedades
   * utilizadas dentro de la tarjeta.
   *
   * badgeColor y available incluyen valores
   * por defecto en caso de no estar definidos.
   */
  const {
    name,
    description,
    price,
    image,
    badge,
    badgeIcon,
    badgeColor = "text-primary",
    available = true,
  } = product

  /*
   * Si el producto no está disponible,
   * se renderiza una versión deshabilitada.
   */
  if (!available) {

    return (
      <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm opacity-60 relative overflow-hidden select-none">

        {/* Indicador de producto sin stock */}
        <div className="absolute top-3 right-3 z-10">

          <span className="px-space-xs py-1 rounded-md bg-secondary-container text-on-secondary-container font-caption-bold text-caption-bold uppercase tracking-wider flex items-center gap-1">

            <span className="material-symbols-outlined text-[14px]">
              block
            </span>

            Sin stock
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md">

          {/* Información del producto */}
          <div className="flex-1 min-w-0">

            <h3 className="font-title-md text-title-md text-secondary font-semibold">
              {name}
            </h3>

            <p className="font-body-md text-body-md text-secondary line-clamp-2 mt-1">
              {description}
            </p>

            <div className="flex items-center gap-space-md mt-space-md">

              {/* Precio tachado para indicar indisponibilidad */}
              <span className="font-title-md text-title-md text-secondary font-semibold line-through">
                $ {price.toLocaleString("es-AR")}
              </span>

              {/* Botón deshabilitado */}
              <button
                type="button"
                disabled
                className="h-10 px-space-md rounded-lg bg-surface-container text-secondary font-body-md-medium text-body-md-medium flex items-center gap-1.5 cursor-not-allowed"
              >

                <span className="material-symbols-outlined text-[18px]">
                  remove_shopping_cart
                </span>

                Agotado
              </button>
            </div>
          </div>

          {/* Imagen desaturada del producto */}
          <div className="w-full sm:w-28 h-40 sm:h-28 rounded-lg overflow-hidden shrink-0 bg-surface-container-high grayscale">

            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </article>
    )
  }

  /*
   * Si el producto está disponible,
   * se renderiza su versión interactiva.
   */
  return (
    <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center justify-between gap-space-md group">

      {/* Información del producto */}
      <div className="flex-1 min-w-0">

        {/*
         * La etiqueta destacada solo se muestra
         * cuando el producto posee la propiedad badge.
         */}
        {badge && (

          <div className="flex items-center gap-space-xs mb-1">

            {/* Ícono opcional de la etiqueta */}
            {badgeIcon && (

              <span
                className={`material-symbols-outlined text-[16px] ${badgeColor}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {badgeIcon}
              </span>
            )}

            <span className={`font-caption-bold text-caption-bold uppercase tracking-wide ${badgeColor}`}>
              {badge}
            </span>
          </div>

        )}

        {/* Nombre */}
        <h3 className="font-title-md text-title-md text-on-surface font-semibold group-hover:text-primary-container transition-colors">
          {name}
        </h3>

        {/* Descripción */}
        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mt-1">
          {description}
        </p>

        {/* Precio y acción de compra */}
        <div className="flex items-center justify-between sm:justify-start gap-space-md mt-space-md">

          <span className="font-title-md text-title-md text-on-surface font-bold tracking-tight">
            $ {price.toLocaleString("es-AR")}
          </span>

          <button
            type="button"
            /* Se envía el objeto product completo al componente padre */
            onClick={() => onAdd(product)}
            className="h-10 px-space-md rounded-lg bg-primary-container text-on-primary font-body-md-medium text-body-md-medium flex items-center gap-1.5 shadow-sm hover:bg-primary transition-all active:scale-95"
          >

            <span className="material-symbols-outlined text-[18px]">
              add
            </span>

            <span>
              Agregar
            </span>
          </button>
        </div>
      </div>

      {/* Imagen del producto */}
      <div className="w-full sm:w-28 h-40 sm:h-28 rounded-lg overflow-hidden shrink-0 bg-surface-container relative">

        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    </article>
  )
}

export default ProductCard