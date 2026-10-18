/*
 * Planes de cuotas disponibles para tarjetas de crédito.
 */
const installmentOptions = [1, 3, 6]

/*
 * Texto visible según el código de rechazo.
 */
function rejectionReason(code) {
  return code.includes("INSUFFICIENT_FUNDS") ? "Fondos insuficientes" : "Rechazada por el emisor"
}

/**
 * Opción individual de medio de pago.
 */
function PaymentOption({ method, selected, rejectionCode, onSelect }) {

  const rejected = Boolean(rejectionCode)

  return (
    <label
      className={`flex items-center gap-space-md p-space-md rounded-lg transition-colors
        ${rejected ? "bg-surface-container-low opacity-60 cursor-not-allowed" : selected ? "bg-primary-fixed/30 ring-2 ring-primary-container cursor-pointer" : "bg-surface-container-low hover:bg-surface-container cursor-pointer"}`}
    >

      {/* Un medio rechazado no se puede volver a elegir (RN-05) */}
      <input
        type="radio"
        name="payment-method"
        checked={selected}
        disabled={rejected}
        onChange={() => onSelect(method.id)}
        className="w-5 h-5 accent-primary shrink-0"
      />

      <span className="w-12 h-8 rounded-md bg-surface-container-lowest flex items-center justify-center shadow-sm shrink-0">
        <span className="material-symbols-outlined text-primary text-[20px]">{method.icon}</span>
      </span>

      <div className="flex-1 min-w-0">

        <p className="font-body-md-medium text-body-md-medium text-on-surface flex flex-wrap items-center gap-space-xs">
          {method.name}

          {rejected && (
            <span className="px-2 py-0.5 rounded bg-error text-on-error font-caption-bold text-caption-bold">
              Rechazada
            </span>
          )}

          {!rejected && method.badge && (
            <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant font-caption-bold text-caption-bold">
              {method.badge}
            </span>
          )}
        </p>

        <p className="font-caption-sm text-caption-sm text-on-surface-variant">
          {method.detail}
        </p>
      </div>

      <span className={`font-caption-bold text-caption-bold hidden sm:inline shrink-0 ${rejected ? "text-error" : "text-primary"}`}>
        {rejected ? rejectionReason(rejectionCode) : method.hint}
      </span>
    </label>
  )
}

/**
 * CMP-08 SelectorMetodoPago: medios guardados y cuotas.
 *
 * Props:
 * @param {Array} methods - Medios de pago del usuario.
 * @param {string|null} selectedId - Medio seleccionado.
 * @param {Object} rejections - Medios rechazados: { [id]: codigo }.
 * @param {Function} onSelect - Cambia el medio seleccionado.
 * @param {number} installments - Cantidad de cuotas.
 * @param {Function} onInstallmentsChange - Cambia las cuotas.
 * @param {number} total - Total a pagar.
 */
function PaymentMethodSelector({ methods, selectedId, rejections, onSelect, installments, onInstallmentsChange, total }) {

  const selectedMethod = methods.find((method) => method.id === selectedId)

  return (
    <section id="payment-methods" className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md scroll-mt-24">

      {/* Encabezado */}
      <div className="flex items-center justify-between gap-space-sm">

        <div className="flex items-center gap-space-sm">

          <span className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary-container text-[22px]">payments</span>
          </span>

          <div>
            <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
              Transacción encriptada
            </span>

            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Elegí cómo pagar
            </h2>
          </div>
        </div>

        <span className="font-caption-sm text-caption-sm text-secondary hidden sm:flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          Checkout 100% protegido
        </span>
      </div>

      {/* Medios de pago guardados */}
      <div className="space-y-space-sm">
        {methods.map((method) => (
          <PaymentOption
            key={method.id}
            method={method}
            selected={method.id === selectedId}
            rejectionCode={rejections[method.id]}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Cuotas: sólo para tarjetas de crédito */}
      {selectedMethod?.type === "credito" && (

        <div className="rounded-lg bg-surface-container-low p-space-md space-y-space-xs">

          <label
            htmlFor="installments"
            className="font-body-md-medium text-body-md-medium text-on-surface flex items-center gap-space-xs"
          >
            <span className="material-symbols-outlined text-primary-container text-[20px]">tune</span>
            Seleccioná la cantidad de cuotas
          </label>

          <select
            id="installments"
            value={installments}
            onChange={(e) => onInstallmentsChange(Number(e.target.value))}
            className="w-full h-11 px-space-sm rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary-container"
          >
            {installmentOptions.map((option) => (
              <option key={option} value={option}>
                {option} {option === 1 ? "pago" : "cuotas"} de $ {(total / option).toLocaleString("es-AR", { maximumFractionDigits: 2 })} (Sin interés)
              </option>
            ))}
          </select>
        </div>
      )}
    </section>
  )
}

export default PaymentMethodSelector
