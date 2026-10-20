/**
 * Fila de concepto + importe del resumen.
 */
function PriceRow({ label, value, highlight = false }) {

  return (
    <div className={`flex items-center justify-between font-body-md text-body-md ${highlight ? "text-primary" : "text-on-surface-variant"}`}>

      <span>{label}</span>

      <span className={highlight ? "font-medium" : "text-on-surface font-medium"}>
        {value < 0 ? "-" : ""}$ {Math.abs(value).toLocaleString("es-AR")}
      </span>
    </div>
  )
}

/**
 * CMP-14 ResumenCompra: subtotal, envío, tarifa, descuento y total.
 *
 * Se reutiliza en CartPage y en CheckoutPage.
 *
 * Props:
 * @param {Object} amounts - { subtotal, shipping, serviceFee, discount, total }
 * @param {number} itemCount - Cantidad de unidades.
 * @param {string} couponCode - Código del cupón aplicado (opcional).
 */
function PurchaseSummary({ amounts, itemCount, couponCode }) {

  return (
    <div className="space-y-space-sm">

      <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
        Resumen del pedido
      </span>

      <div className="space-y-1.5">

        <PriceRow label={`Subtotal productos (${itemCount} u.)`} value={amounts.subtotal} />

        <PriceRow label="Costo de envío" value={amounts.shipping} />

        <PriceRow label="Tarifa de servicio" value={amounts.serviceFee} />

        {amounts.discount > 0 && (
          <PriceRow
            label={`Descuento cupón (${couponCode})`}
            value={-amounts.discount}
            highlight
          />
        )}
      </div>

      {/* Total */}
      <div className="pt-space-sm mt-space-xs border-t border-surface-container-high flex items-end justify-between">

        <div>
          <p className="font-title-md text-title-md text-on-surface font-bold">Total a pagar</p>
          <p className="font-caption-sm text-caption-sm text-secondary">Incluye IVA e impuestos locales</p>
        </div>

        <span className="font-headline-md text-headline-md text-primary font-bold tracking-tight">
          $ {amounts.total.toLocaleString("es-AR")}
        </span>
      </div>
    </div>
  )
}

export default PurchaseSummary
