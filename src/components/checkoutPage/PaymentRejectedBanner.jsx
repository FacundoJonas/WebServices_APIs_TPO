/**
 * CMP-09 BannerPagoRechazado (RN-05).
 *
 * Props:
 * @param {string} code - Código de rechazo (ej. ERR_INSUFFICIENT_FUNDS_704).
 * @param {string} message - Detalle del rechazo.
 * @param {Function} onRetry - Acción "Probar con otro medio de pago" (NAV-05).
 */
function PaymentRejectedBanner({ code, message, onRetry }) {

  return (
    <div
      role="alert"
      className="bg-error-container text-on-error-container rounded-xl p-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-md"
    >

      <div className="flex items-start gap-space-sm">

        <span className="material-symbols-outlined text-error text-[28px] shrink-0">error</span>

        <div className="space-y-1">

          <p className="flex flex-wrap items-center gap-space-xs">
            <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-error font-caption-bold text-caption-bold uppercase">
              Pago rechazado
            </span>

            <span className="font-caption-sm text-caption-sm">
              Código de respuesta: {code}
            </span>
          </p>

          <p className="font-body-md text-body-md">
            {message} Seleccioná otro método de pago para completar tu pedido sin perder la reserva.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="h-11 px-space-md rounded-lg bg-error text-on-error font-body-md-medium text-body-md-medium flex items-center justify-center gap-2 shrink-0"
      >
        <span className="material-symbols-outlined text-[20px]">credit_card</span>
        Probar con otro medio de pago
      </button>
    </div>
  )
}

export default PaymentRejectedBanner
