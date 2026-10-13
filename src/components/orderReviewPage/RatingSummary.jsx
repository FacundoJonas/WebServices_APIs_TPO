/*
 * Distribución porcentual de las calificaciones.
 *
 * Cada objeto representa:
 * - stars: cantidad de estrellas.
 * - percentage: porcentaje de opiniones.
 */
const distribution = [
  { stars: 5, percentage: 82 },
  { stars: 4, percentage: 12 },
  { stars: 3, percentage: 4 },
  { stars: 2, percentage: 1 },
  { stars: 1, percentage: 1 },
]

/**
 * Resumen estadístico de las calificaciones
 * obtenidas por el comercio.
 *
 * Muestra:
 * - Promedio general.
 * - Representación visual mediante estrellas.
 * - Distribución porcentual por calificación.
 * - Aspectos más destacados por otros usuarios.
 */
function RatingSummary() {

  return (
    <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-lg self-start">

      {/* Promedio general */}
      <div className="flex items-center gap-space-md">

        <div className="flex flex-col items-center justify-center p-space-md rounded-xl bg-surface-container-low min-w-[100px]">

          <span className="font-display-hero text-display-hero text-on-surface leading-none">
            4.8
          </span>

          {/* Representación del promedio mediante estrellas */}
          <div className="flex items-center text-selected-stars mt-1">

            {[1, 2, 3, 4].map((star) => (

              <span
                key={star}
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>

            ))}

            {/* Media estrella para representar la calificación 4.8 */}
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star_half
            </span>
          </div>
        </div>

        <div>

          <span className="font-title-md text-title-md text-on-surface block">
            Calificación general
          </span>

          <p className="font-body-md text-body-md text-on-surface-variant">

            Basado en{" "}

            <span className="font-body-md-medium text-body-md-medium text-on-surface">
              1.240 opiniones
            </span>

            {" "}de clientes verificados.
          </p>
        </div>
      </div>

      {/* Distribución de opiniones por cantidad de estrellas */}
      <div className="space-y-space-xs pt-space-xs">

        {distribution.map((item) => (

          <div
            key={item.stars}
            className="flex items-center gap-space-sm font-caption-sm text-caption-sm"
          >

            {/* Número de estrellas */}
            <span className="w-12 text-on-surface font-caption-bold text-caption-bold flex items-center gap-0.5">

              {item.stars}

              <span
                className="material-symbols-outlined text-[14px] text-selected-stars"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            </span>

            {/* Barra gráfica de porcentaje */}
            <div className="flex-1 h-2.5 bg-surface-container rounded-full overflow-hidden">

              <div
                className="h-full bg-primary-container rounded-full"
                style={{
                  width: `${item.percentage}%`,
                  opacity: item.stars === 5 ? 1 : item.stars === 4 ? 0.8 : item.stars === 3 ? 0.6 : item.stars === 2 ? 0.4 : 0.25
                }}
              />

            </div>

            {/* Porcentaje numérico */}
            <span className="w-10 text-right font-caption-bold text-caption-bold text-on-surface">
              {item.percentage}%
            </span>
          </div>

        ))}
      </div>

      {/* Aspectos mejor valorados */}
      <div className="pt-space-xs space-y-space-xs">

        <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
          Destacados por usuarios
        </span>

        <div className="flex flex-wrap gap-space-xs">

          <Highlight
            icon="thumb_up"
            text="Sabor auténtico (94%)"
          />

          <Highlight
            icon="timer"
            text="Entrega en tiempo (91%)"
          />

          <Highlight
            icon="inventory_2"
            text="Packaging térmico (88%)"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Etiqueta visual reutilizable para mostrar
 * un aspecto destacado del comercio.
 *
 * Props:
 * @param {string} icon - Nombre del ícono de Material Symbols.
 * @param {string} text - Texto que se mostrará al usuario.
 */
function Highlight({ icon, text }) {

  return (
    <span className="px-space-xs py-1 rounded-full bg-surface-container font-caption-sm text-caption-sm text-on-surface-variant flex items-center gap-1">

      <span className="material-symbols-outlined text-[14px] text-primary-container">
        {icon}
      </span>

      {text}
    </span>
  )
}

export default RatingSummary