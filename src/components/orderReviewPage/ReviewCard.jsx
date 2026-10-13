/**
 * Tarjeta reutilizable que representa una opinión
 * realizada por otro usuario de DeliveryGo.
 *
 * Props:
 * @param {string} image
 * Imagen de perfil del usuario. Es opcional.
 *
 * @param {string} initials
 * Iniciales utilizadas como avatar cuando no existe imagen.
 *
 * @param {string} name
 * Nombre visible del usuario.
 *
 * @param {number} rating
 * Calificación del usuario entre 1 y 5.
 *
 * @param {string} date
 * Fecha relativa de publicación de la opinión.
 *
 * @param {string} tag
 * Etiqueta relacionada con la reseña.
 *
 * @param {string} text
 * Contenido textual de la opinión.
 *
 * @param {number} usefulCount
 * Cantidad de usuarios que marcaron la reseña como útil.
 */
function ReviewCard({ image, initials, name, rating, date, tag, text, usefulCount }) {

  return (
    <article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-sm hover:shadow-md transition-shadow">

      {/* Información principal del usuario */}
      <div className="flex items-start justify-between gap-space-sm">

        <div className="flex items-center gap-space-sm">

          {/* Si existe imagen se utiliza, sino se muestran iniciales */}
          {image ? (
            <img
              src={image}
              alt={`Perfil de ${name}`}
              className="w-11 h-11 rounded-full object-cover shadow-sm"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center font-caption-bold text-caption-bold text-on-surface shadow-sm">
              {initials}
            </div>
          )}

          <div>

            {/* Nombre y estado de usuario verificado */}
            <div className="flex items-center gap-space-xs">

              <span className="font-title-md text-title-md text-on-surface">
                {name}
              </span>

              <span
                className="material-symbols-outlined text-primary-container text-[16px]"
                title="Comprador verificado"
              >
                verified
              </span>
            </div>

            {/* Calificación y fecha */}
            <div className="flex items-center gap-space-xs mt-0.5">

              <div className="flex items-center">

                {/*
                 * Se generan siempre cinco estrellas.
                 *
                 * Las estrellas iguales o menores al rating
                 * utilizan el color de selección.
                 */}
                {[1, 2, 3, 4, 5].map((star) => (

                  <span
                    key={star}
                    className={`material-symbols-outlined text-[16px]
                    ${ star <= rating ? "text-selected-stars" : "text-secondary-container" }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>

                ))}
              </div>

              <span className="font-caption-sm text-caption-sm text-secondary">
                • {date}
              </span>
            </div>
          </div>
        </div>

        {/* Etiqueta temática de la opinión */}
        <span className="px-space-xs py-0.5 rounded-full bg-surface-container-low text-primary-container font-caption-bold text-caption-bold hidden sm:inline-block">
          {tag}
        </span>
      </div>

      {/* Contenido de la reseña */}
      <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
        “{text}”
      </p>

      {/* Acciones sociales de la reseña */}
      <div className="flex items-center gap-space-sm pt-space-2xs text-secondary font-caption-sm text-caption-sm">

        {/* Acción visual para marcar la opinión como útil */}
        <button
          type="button"
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >

          <span className="material-symbols-outlined text-[16px]">
            thumb_up
          </span>

          <span>
            Útil ({usefulCount})
          </span>
        </button>

        {/* Acción visual para comentar */}
        <button
          type="button"
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >

          <span className="material-symbols-outlined text-[16px]">
            chat_bubble_outline
          </span>

          <span>
            Comentar
          </span>
        </button>
      </div>
    </article>
  )
}

export default ReviewCard