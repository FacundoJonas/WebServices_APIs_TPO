/**
 * Encabezado visual del comercio.
 *
 * Props:
 * @param {string} bannerImage
 * Imagen principal de portada.
 *
 * @param {string} logoImage
 * Logo o imagen del comercio.
 *
 * @param {boolean} favorite
 * Indica si el comercio está marcado como favorito.
 *
 * @param {Function} onToggleFavorite
 * Función que cambia el estado de favorito.
 */
function StoreHero({ bannerImage, logoImage, favorite, onToggleFavorite }) {

  return (
    <section className="w-full relative bg-surface-container-low overflow-hidden">

      {/* Imagen principal del comercio */}
      <div
        className="relative w-full h-64 md:h-80 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bannerImage})`,
        }}
      >

        {/* Gradiente para mejorar la legibilidad sobre la imagen */}
        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-on-surface/40 to-transparent" />

        {/* Acciones rápidas */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-space-xs">

          {/* Favorito */}
          <button
            type="button"
            aria-label="Favorito"
            onClick={onToggleFavorite}
            className={` p-space-xs rounded-full bg-surface-container-lowest/80 backdrop-blur-md shadow-sm transition-transform active:scale-95
              ${ favorite ? "text-error" : "text-secondary" }`}
          >

            {/* Corazón se muestra relleno o solamente con contorno */}
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: favorite ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>

          </button>
        </div>
      </div>

      {/* Tarjeta principal superpuesta sobre el banner */}
      <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop -mt-16 md:-mt-20 relative z-20 pb-space-lg">

        <div className="bg-surface-container-lowest rounded-xl p-space-md md:p-space-lg shadow-md flex flex-col md:flex-row md:items-center justify-between gap-space-md">

          {/* Información principal del comercio */}
          <div className="flex items-start md:items-center gap-space-md">

            {/* Logo del comercio */}
            <div className="relative shrink-0">

              <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shadow-sm bg-surface-container-highest p-1">

                <img
                  src={logoImage}
                  alt="La Birra Bar"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              {/* Indicador de comercio oficial */}
              <span className="absolute -bottom-1 -right-1 bg-primary-container text-on-primary font-caption-bold text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
                OFICIAL
              </span>
            </div>

            {/* Datos del comercio */}
            <div className="flex flex-col">

              <div className="flex items-center gap-space-xs flex-wrap">

                <h1 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-on-surface tracking-tight">
                  La Birra Bar
                </h1>

                <span className="px-space-xs py-0.5 bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-md">
                  Almagro
                </span>

              </div>

              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                Hamburguesas artesanales smash, cervezas tiradas & guarniciones premium
              </p>

              {/* Información resumida */}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-space-md mt-space-xs font-body-md text-body-md text-on-surface-variant">

                <StoreInfo
                  icon="star"
                  text="4.8"
                />

                <StoreInfo
                  icon="schedule"
                  text="25-35 min"
                />

                <StoreInfo
                  icon="moped"
                  text="Envío: $850"
                />

                {/* Estado actual del comercio */}
                <div className="flex items-center gap-1 text-primary font-body-md-medium">

                  <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />

                  <span>
                    Abierto: 11:30 a 00:30 hs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Promoción y pedido mínimo */}
          <div className="flex flex-row md:flex-col items-start md:items-end">

            <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-caption-bold text-caption-bold">

              <span className="material-symbols-outlined text-[16px]">
                local_fire_department
              </span>

              20% OFF con DeliveryGo Prime

            </div>

            <p className="text-secondary font-caption-sm text-caption-sm mt-1">
              Pedido mínimo: $4.500
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Elemento reutilizable para mostrar información
 * resumida del comercio.
 *
 * Props:
 * @param {string} icon
 * Nombre del ícono de Material Symbols.
 *
 * @param {string} text
 * Texto que acompaña al ícono.
 */
function StoreInfo({ icon, text }) {

  return (
    <div className="flex items-center gap-1">

      <span className="material-symbols-outlined text-[18px] text-primary">
        {icon}
      </span>

      <span className="font-body-md-medium text-on-surface">
        {text}
      </span>
    </div>
  )
}

export default StoreHero