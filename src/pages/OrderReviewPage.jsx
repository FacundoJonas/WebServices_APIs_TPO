import { useState } from "react"

import RatingStars from "../components/orderReviewPage/RatingStars"
import QuickChip from "../components/orderReviewPage/QuickChip"
import OrderSummary from "../components/orderReviewPage/OrderSummary"
import ReviewCard from "../components/orderReviewPage/ReviewCard"
import RatingSummary from "../components/orderReviewPage/RatingSummary"
import SuccessModal from "../components/orderReviewPage/SuccessModal"

import courierImage from "../assets/matias.png"
import agustinImage from "../assets/agustin.png"
import florenciaImage from "../assets/florencia.png"

/*
 * Imágen temporal.
 *
 * Actualmente se utiliza el logo de DeliveryGo como reemplazo
 * hasta contar con la imágen definitiva del restaurante.
 */
import restaurantImage from "../assets/deliverygo_logo.png"

/*
 * Opciones rápidas que el usuario puede seleccionar
 * para destacar aspectos positivos de la entrega.
 *
 * Cada opción contiene:
 * - id: identificador único utilizado internamente.
 * - icon: nombre del ícono de Material Symbols.
 * - label: texto visible para el usuario.
 */
const quickOptions = [
  {
    id: "punctuality",
    icon: "schedule",
    label: "Puntualidad impecable",
  },
  {
    id: "temperature",
    icon: "whatshot",
    label: "Comida caliente / temperatura ideal",
  },
  {
    id: "packaging",
    icon: "takeout_dining",
    label: "Presentación y empaque",
  },
  {
    id: "friendly",
    icon: "sentiment_very_satisfied",
    label: "Trato amable y cordial",
  },
  {
    id: "complete",
    icon: "checklist",
    label: "Pedido completo",
  },
]

/**
 * Página de valoración de un pedido finalizado.
 *
 * Permite al usuario:
 * - Calificar al comercio.
 * - Calificar al repartidor.
 * - Seleccionar aspectos destacados de la entrega.
 * - Escribir una reseña de hasta 500 caracteres.
 * - Seleccionar una propina.
 * - Visualizar opiniones de otros usuarios.
 * - Confirmar el envío de la reseña mediante un modal.
 */
function OrderReviewPage() {

  /*
   * Calificación seleccionada para el comercio.
   * El valor puede variar entre 0 y 5.
   */
  const [storeRating, setStoreRating] = useState(0)

  /*
   * Calificación seleccionada para el repartidor.
   * El valor puede variar entre 0 y 5.
   */
  const [courierRating, setCourierRating] = useState(0)

  /*
   * Guarda los identificadores de los QuickChip
   * seleccionados por el usuario.
   *
   * Ejemplo:
   * ["punctuality", "packaging"]
   */
  const [selectedChips, setSelectedChips] = useState([])

  /*
   * Guarda el comentario escrito en la reseña.
   */
  const [review, setReview] = useState("")

  /*
   * Guarda el monto de propina seleccionado.
   * La opción inicial es $400.
   */
  const [selectedTip, setSelectedTip] = useState(400)

  /*
   * Determina si el modal de confirmación
   * se encuentra visible.
   */
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  /**
   * Agrega o elimina un aspecto destacado de la lista.
   *
   * Si el id ya estaba seleccionado se elimina.
   * Si todavía no estaba seleccionado se agrega.
   */
  function toggleChip(id) {
    setSelectedChips((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  /**
   * Actualiza el contenido de la reseña.
   *
   * slice limita el texto a un máximo de
   * 500 caracteres.
   */
  function handleReviewChange(event) {
    setReview(event.target.value.slice(0, 500))
  }

  /**
   * Simula el envío de la reseña.
   *
   * Únicamente abre el modal de confirmación.
   */
  function handleSubmit() {
    setShowSuccessModal(true)
  }

  return (
    <main id="top" className="w-full pt-20 bg-background min-h-[calc(100vh-280px)]">

      <div className="flex flex-col w-full">

        {/* Contenedor principal de la página */}
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop w-full py-space-xl space-y-space-2xl">

          {/* Estado del pedido */}
          <div className="flex flex-wrap items-center justify-between gap-space-sm">

            {/* Referencia al pedido actual */}
            <div className="flex items-center gap-space-xs text-on-surface-variant">

              <a
                href="#top"
                className="flex items-center gap-space-2xs hover:text-primary transition-colors font-body-md text-body-md"
              >
                <span className="material-symbols-outlined text-[18px]">
                  arrow_back
                </span>

                <span>
                  Mis Pedidos
                </span>
              </a>

              <span className="text-outline-variant font-caption-sm text-caption-sm">
                /
              </span>

              <span className="font-body-md-medium text-body-md-medium text-on-surface">
                Pedido #DG-92813
              </span>
            </div>

            {/* Estado actual de la entrega */}
            <div className="flex items-center gap-space-xs px-space-sm py-space-2xs bg-surface-container rounded-full">

              <span className="w-2 h-2 rounded-full bg-primary-container" />

              <span className="font-caption-bold text-caption-bold text-on-surface">
                Entregado hace 18 min
              </span>
            </div>
          </div>

          {/* Sección principal de valoración */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">

            {/* Formulario principal de la reseña */}
            <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg sm:p-space-xl shadow-md space-y-space-xl">

              {/* Información del comercio y pedido entregado */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md bg-surface-container-low p-space-md sm:p-space-lg rounded-xl">

                <div className="flex items-center gap-space-md">

                  <img
                    src={restaurantImage}
                    alt="La Birra Bar"
                    className="w-16 h-16 rounded-xl object-cover shadow-sm shrink-0"
                  />

                  <div>

                    <span className="inline-flex items-center gap-space-2xs px-space-xs py-0.5 rounded-full bg-primary-container/15 text-primary font-caption-bold text-caption-bold mb-1">

                      <span className="material-symbols-outlined text-[14px]">
                        task_alt
                      </span>

                      Entrega completada
                    </span>

                    <h1 className="font-headline-md text-headline-md text-on-surface leading-snug">
                      ¡Tu pedido de La Birra Bar ya fue entregado!
                    </h1>

                    <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                      ¿Cómo estuvo tu experiencia gastronómica hoy?
                    </p>
                  </div>
                </div>
              </div>

              {/* Calificación de la comida y preparación */}
              <div className="space-y-space-sm bg-surface rounded-xl p-space-lg">

                <div className="flex items-center gap-space-xs">

                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">

                    <span className="material-symbols-outlined text-[20px]">
                      lunch_dining
                    </span>
                  </div>

                  <label className="font-title-md text-title-md text-on-surface">
                    Calificá la comida y preparación de La Birra Bar
                  </label>
                </div>

                <RatingStars
                  value={storeRating}
                  onChange={setStoreRating}
                />
              </div>

              {/* Calificación del servicio del repartidor */}
              <div className="space-y-space-sm bg-surface rounded-xl p-space-lg">

                <div className="flex items-center gap-space-sm">

                  <img
                    src={courierImage}
                    alt="Imagen repartidor"
                    className="w-10 h-10 rounded-full object-cover shadow-sm"
                  />

                  <div>

                    <label className="font-title-md text-title-md text-on-surface">
                      Calificá el servicio y la atención de Matías G.
                    </label>

                    <p className="font-caption-sm text-caption-sm text-on-surface-variant">
                      Tu repartidor en bicicleta motorizada
                    </p>
                  </div>
                </div>

                <RatingStars
                  value={courierRating}
                  onChange={setCourierRating}
                />
              </div>

              {/* Aspectos rápidos para destacar de la entrega */}
              <div className="space-y-space-xs">

                <div className="flex items-center justify-between">

                  <label className="font-title-md text-title-md text-on-surface">
                    ¿Qué aspectos querés destacar de esta entrega?
                  </label>

                  <span className="font-caption-sm text-caption-sm text-secondary">
                    Elegí las que quieras
                  </span>
                </div>

                {/* Las opciones se generan dinámicamente desde quickOptions */}
                <div className="flex flex-wrap gap-space-xs pt-space-2xs">

                  {quickOptions.map((option) => (
                    <QuickChip
                      key={option.id}
                      icon={option.icon}
                      label={option.label}
                      selected={selectedChips.includes(option.id)}
                      onClick={() => toggleChip(option.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Comentario opcional del usuario */}
              <div className="space-y-space-2xs">

                <label
                  htmlFor="review-textarea"
                  className="font-title-md text-title-md text-on-surface flex items-center gap-space-2xs"
                >

                  <span>
                    Contanos más sobre tu pedido
                  </span>

                  <span className="font-body-md text-body-md text-secondary font-normal">
                    (opcional)
                  </span>
                </label>

                {/* Input controlado: el contenido proviene del review */}
                <textarea
                  id="review-textarea"
                  rows={3}
                  value={review}
                  onChange={handleReviewChange}
                  maxLength={500}
                  placeholder="¿Qué fue lo que más te gustó de las hamburguesas o qué podemos mejorar? Tu comentario ayuda a la comunidad."
                  className="w-full p-space-md rounded-xl bg-surface text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/20 transition-all resize-none shadow-sm"
                />

                {/* Contador dinámico de caracteres */}
                <div className="flex justify-between items-center px-1">

                  <span className="font-caption-sm text-caption-sm text-on-surface-variant">
                    Máximo 500 caracteres
                  </span>

                  <span className="font-caption-sm text-caption-sm text-secondary">
                    {review.length} / 500
                  </span>
                </div>
              </div>

              {/* Acción final de envío */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-xs">

                <div className="flex items-center gap-space-xs text-on-surface-variant">

                  <span className="material-symbols-outlined text-primary-container text-[20px]">
                    verified_user
                  </span>

                  <span className="font-caption-sm text-caption-sm">
                    Tu valoración se publicará con tu nombre de usuario visible
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full sm:w-auto px-space-xl py-space-sm bg-primary-container hover:bg-primary text-on-primary rounded-lg font-title-md text-title-md flex items-center justify-center gap-space-xs shadow-sm hover:shadow-md active:scale-98 transition-all"
                >

                  <span>
                    Enviar reseña y finalizar
                  </span>

                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>

            {/* Aside de la sección principal de valoración */}
            <aside className="lg:col-span-4 space-y-space-md">

              {/* Resumen del pedido y selector de propina */}
              <OrderSummary
                selectedTip={selectedTip}
                onTipChange={setSelectedTip}
              />

              {/* Información sobre garantía */}
              <div className="p-space-md bg-surface-container-low rounded-xl flex items-start gap-space-sm">

                <span className="material-symbols-outlined text-primary-container text-[26px] shrink-0">
                  shield_with_heart
                </span>

                <div>

                  <span className="font-body-md-medium text-body-md-medium text-on-surface block">
                    Garantía de Entrega y Calidad
                  </span>

                  <p className="font-caption-sm text-caption-sm text-on-surface-variant mt-0.5">
                    Si algo no salió según lo esperado con tu comida o entrega,
                    podés abrir un reclamo inmediato desde el soporte 24/7.
                  </p>
                </div>
              </div>
            </aside>
          </section>

          {/* Opiniones de la comunidad */}
          <section className="space-y-space-lg pt-space-md">

            {/* Encabezado de la sección */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-xs">

              <div>

                <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-primary">
                  Comunidad DeliveryGo
                </span>

                <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                  Opiniones de la comunidad sobre La Birra Bar
                </h2>
              </div>

              {/* Selector visual de ordenamiento */}
              <button
                type="button"
                className="flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium transition-colors"
              >

                <span className="material-symbols-outlined text-[18px]">
                  tune
                </span>

                <span>
                  Más recientes
                </span>

                <span className="material-symbols-outlined text-[18px]">
                  arrow_drop_down
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">

              {/* Resumen estadístico de calificaciones */}
              <RatingSummary />

              {/* Lista de reseñas de clientes */}
              <div className="lg:col-span-8 space-y-space-md">

                <ReviewCard
                  image={agustinImage}
                  name="Agustín R."
                  rating={5}
                  date="Hace 2 días"
                  tag="Hamburguesa Golden Doble"
                  text="La hamburguesa Golden Doble llegó súper caliente y las papas bien crocantes. Excelente servicio de entrega."
                  usefulCount={14}
                />

                <ReviewCard
                  image={florenciaImage}
                  name="Florencia M."
                  rating={5}
                  date="Hace 5 días"
                  tag="Empaque Térmico"
                  text="Impecable La Birra Bar como siempre. El empaque térmico mantuvo todo en perfecto estado."
                  usefulCount={9}
                />

                <ReviewCard
                  initials="MP"
                  name="Martín P."
                  rating={4}
                  date="Hace 1 semana"
                  tag="Entrega Rápida"
                  text="Muy ricas las salsas caseras. La entrega tardó solo 25 minutos."
                  usefulCount={5}
                />

                {/* Acción visual para futuras reseñas adicionales */}
                <div className="pt-space-xs text-center">

                  <button
                    type="button"
                    className="px-space-xl py-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium transition-colors inline-flex items-center gap-space-xs"
                  >

                    <span>
                      Cargar más opiniones de clientes
                    </span>

                    <span className="material-symbols-outlined text-[18px]">
                      expand_more
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Modal de confirmación. Solo cuando showSuccessModal = true */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => { setShowSuccessModal(false) }}
      />

    </main>
  )
}

export default OrderReviewPage