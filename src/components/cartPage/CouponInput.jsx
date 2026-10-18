import { useState } from "react"

/**
 * CMP-07 CuponDescuento: input + estado aplicado / rechazado.
 *
 * Props:
 * @param {Object|null} coupon - Cupón aplicado ({ code, discount }).
 * @param {boolean} loading - Indica si se está validando.
 * @param {boolean} disabled - Bloquea el formulario mientras hay otra llamada en curso.
 * @param {string} error - Mensaje de error del cupón.
 * @param {Function} onApply - Recibe el código ingresado.
 * @param {Function} onRemove - Quita el cupón aplicado.
 */
function CouponInput({ coupon, loading, disabled = false, error, onApply, onRemove }) {

  const [code, setCode] = useState("")

  function handleSubmit(e) {
    e.preventDefault()

    if (!code.trim() || disabled) return

    onApply(code.trim())
  }

  return (
    <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">

      <h2 className="font-body-lg-medium text-body-lg-medium text-on-surface flex items-center gap-space-xs">
        <span className="material-symbols-outlined text-primary-container text-[22px]">sell</span>
        Cupón de descuento
      </h2>

      {coupon ? (

        /* Estado: cupón aplicado */
        <div className="flex items-center justify-between gap-space-sm p-space-sm rounded-lg bg-primary-fixed/40">

          <div className="flex items-center gap-space-sm min-w-0">

            <span className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">check</span>
            </span>

            <div className="min-w-0">
              <p className="font-body-md-medium text-body-md-medium text-primary flex items-center gap-space-xs">
                {coupon.code}
                <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-caption-bold text-caption-bold">
                  Aplicado
                </span>
              </p>

              <p className="font-caption-sm text-caption-sm text-on-surface-variant">
                Ahorrás -$ {coupon.discount.toLocaleString("es-AR")} ARS en este pedido
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="font-body-md text-body-md text-on-surface-variant hover:text-error"
          >
            Quitar
          </button>
        </div>

      ) : (

        /* Estado: ingresar código */
        <form onSubmit={handleSubmit} className="space-y-space-xs">

          <div className="flex gap-space-xs">

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej: DELIVERYGO20"
              disabled={disabled}
              aria-label="Código de cupón"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "coupon-error" : undefined}
              className="flex-1 min-w-0 h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md uppercase placeholder:normal-case outline-none focus:ring-2 focus:ring-primary-container"
            />

            <button
              type="submit"
              disabled={disabled || !code.trim()}
              className="h-11 px-space-md rounded-lg bg-primary-container hover:bg-primary text-on-primary font-body-md-medium text-body-md-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Aplicando..." : "Aplicar"}
            </button>
          </div>

          {error && (
            <p id="coupon-error" className="font-caption-sm text-caption-sm text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  )
}

export default CouponInput
