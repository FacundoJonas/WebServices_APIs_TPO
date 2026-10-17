/*
 * Pasos del proceso de compra.
 */
const steps = [
  { id: 1, label: "Carrito" },
  { id: 2, label: "Pago y Entrega" },
  { id: 3, label: "En preparación" },
]

/**
 * Indicador de progreso del checkout.
 *
 * Props:
 * @param {number} current - Paso actual (1, 2 o 3).
 */
function CheckoutSteps({ current }) {

  return (
    <ol className="flex items-center gap-space-xs">

      {steps.map((step, index) => {

        const done = step.id < current
        const active = step.id === current

        return (
          <li key={step.id} className="flex items-center gap-space-xs">

            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-caption-bold text-caption-bold
                ${done ? "text-primary-container" : active ? "bg-primary text-on-primary" : "bg-surface-container text-secondary"}`}
            >
              {done
                ? <span className="material-symbols-outlined text-[20px]">check_circle</span>
                : step.id}
            </span>

            <span
              className={`font-caption-bold text-caption-bold hidden sm:inline
                ${done ? "text-primary-container" : active ? "text-on-surface" : "text-secondary"}`}
            >
              {step.label}
            </span>

            {index < steps.length - 1 && (
              <span className={`w-6 sm:w-10 h-0.5 ${done ? "bg-primary-container" : "bg-surface-container-high"}`} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default CheckoutSteps
