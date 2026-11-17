/**
 * Calificación general del comercio (Módulo Opiniones).
 *
 * GET /api/v1/merchants/{id}/rating → RatingResponse { promedio, cantidadResenas }.
 * El contrato no publica la distribución por estrellas ni un listado de
 * reseñas, así que sólo se muestran el promedio y la cantidad.
 *
 * Props:
 * @param {Object|null} rating - RatingResponse, o null si todavía no hay datos.
 */
function RatingSummary({ rating }) {

  const cantidad = rating?.cantidadResenas ?? 0
  const promedio = Number(rating?.promedio ?? 0)

  /*
   * Estrellas llenas, media estrella y vacías para el promedio.
   */
  const llenas = Math.floor(promedio)
  const media = promedio - llenas >= 0.5
  const estrellas = [1, 2, 3, 4, 5].map((n) =>
    n <= llenas ? "star" : n === llenas + 1 && media ? "star_half" : "star_outline")

  return (
    <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-lg self-start">

      {cantidad === 0 ? (

        <p className="font-body-md text-body-md text-on-surface-variant">
          Este comercio todavía no tiene calificaciones. ¡La tuya puede ser la primera!
        </p>

      ) : (

        <div className="flex items-center gap-space-md">

          <div className="flex flex-col items-center justify-center p-space-md rounded-xl bg-surface-container-low min-w-[100px]">

            <span className="font-display-hero text-display-hero text-on-surface leading-none">
              {promedio.toLocaleString("es-AR", { maximumFractionDigits: 1 })}
            </span>

            <div className="flex items-center justify-center text-selected-stars mt-1">
              {estrellas.map((icono, i) => (
                <span
                  key={i}
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: icono === "star_outline" ? "'FILL' 0" : "'FILL' 1", fontSize: "18px" }}
                >
                  {icono === "star_outline" ? "star" : icono}
                </span>
              ))}
            </div>
          </div>

          <div>

            <span className="font-title-md text-title-md text-on-surface block">
              Calificación general
            </span>

            <p className="font-body-md text-body-md text-on-surface-variant">
              Basado en{" "}
              <span className="font-body-md-medium text-body-md-medium text-on-surface">
                {cantidad.toLocaleString("es-AR")} {cantidad === 1 ? "opinión" : "opiniones"}
              </span>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RatingSummary
