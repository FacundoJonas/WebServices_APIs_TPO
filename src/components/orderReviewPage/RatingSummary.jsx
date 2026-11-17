/**
 * Calificación promedio del comercio (CU-09).
 *
 * Viene de GET /api/v1/merchants/{id}/rating (Módulo Opiniones):
 * RatingResponse { objetivoId, tipoObjetivo, promedio, cantidadResenas }.
 * El contrato no publica la distribución por estrellas ni el listado de
 * reseñas, por eso sólo se muestra el promedio y la cantidad.
 *
 * Props:
 * @param {Object|null} rating - RatingResponse, o null mientras carga / si falla.
 * @param {string} error - mensaje si Opiniones no respondió (RN-11).
 */
function RatingSummary({ rating, error }) {

  const promedio = rating?.promedio
  const cantidad = rating?.cantidadResenas ?? 0
  const llenas = Math.floor(promedio ?? 0)
  const media = (promedio ?? 0) - llenas >= 0.5

  return (
    <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-lg self-start">

      <div className="flex items-center gap-space-md">

        <div className="flex flex-col items-center justify-center p-space-md rounded-xl bg-surface-container-low min-w-[100px]">

          <span className="font-display-hero text-display-hero text-on-surface leading-none">
            {promedio != null ? promedio.toFixed(1) : "—"}
          </span>

          <div className="flex items-center justify-center text-selected-stars mt-1">
            {Array.from({ length: llenas }, (_, i) => (
              <span
                key={i}
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1", fontSize: "18px" }}
              >
                star
              </span>
            ))}
            {media && (
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1", fontSize: "18px" }}
              >
                star_half
              </span>
            )}
          </div>
        </div>

        <div>
          <span className="font-title-md text-title-md text-on-surface block">
            Calificación general
          </span>

          <p className="font-body-md text-body-md text-on-surface-variant">
            {error
              ? error
              : rating
                ? <>Basado en <span className="font-body-md-medium text-body-md-medium text-on-surface">{cantidad.toLocaleString("es-AR")} opiniones</span>.</>
                : "Cargando calificación…"}
          </p>
        </div>
      </div>
    </div>
  )
}

export default RatingSummary
