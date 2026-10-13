import { useState } from "react"

/*
 * Descripciones asociadas a cada nivel de calificación.
 *
 * La clave representa la cantidad de estrellas seleccionada
 * y el valor representa el texto que se muestra al usuario.
 */
const descriptions = {
  1: "Malo - 1 estrella",
  2: "Regular - 2 estrellas",
  3: "Bueno - 3 estrellas",
  4: "Muy bueno - 4 estrellas",
  5: "Excelente - 5 estrellas",
}

/**
 * Componente reutilizable para seleccionar una
 * calificación entre 1 y 5 estrellas.
 *
 * Props:
 * @param {number} value
 * Calificación actualmente seleccionada.
 *
 * @param {Function} onChange
 * Función que se ejecuta cuando el usuario selecciona
 * una estrella.
 */
function RatingStars({ value, onChange }) {

  /*
   * Guarda temporalmente la estrella sobre la cual
   * se encuentra posicionado el mouse.
   *
   * No modifica todavía la calificación definitiva.
   */
  const [hoverValue, setHoverValue] = useState(0)

  /*
   * Si el usuario está recorriendo las estrellas con
   * el mouse se muestra hoverValue.
   *
   * En caso contrario se utiliza la calificación
   * seleccionada definitivamente.
   */
  const displayedValue = hoverValue || value

  return (
    <div>

      {/* Descripción textual de la calificación */}
      <span className="font-caption-bold text-caption-bold text-primary-container">
        {displayedValue > 0 ? descriptions[displayedValue] : "Tocá una estrella"}
      </span>

      {/* Generación dinámica de las cinco estrellas */}
      <div className="flex items-center gap-space-xs pt-space-xs">

        {[1, 2, 3, 4, 5].map((star) => (

          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange(star)}
            className={`p-1 rounded-lg hover:scale-110 active:scale-95 transition-all
              ${ star <= displayedValue ? "text-selected-stars" : "text-secondary-container" }`}
          >

            <span
              className="material-symbols-outlined text-[36px]"
              style={{
                fontVariationSettings: "'FILL' 1",
              }}
            >
              star
            </span>
          </button>

        ))}
      </div>
    </div>
  )
}

export default RatingStars