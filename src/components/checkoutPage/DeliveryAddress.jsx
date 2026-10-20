/**
 * Dirección de entrega del pedido.
 *
 * Props:
 * @param {Object} address - { street, detail, instructions }
 * @param {string} deliveryTime - Tiempo estimado de entrega.
 */
function DeliveryAddress({ address, deliveryTime }) {

  return (
    <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">

      {/* Encabezado */}
      <div className="flex items-center gap-space-sm">

        <span className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary-container text-[22px]">location_on</span>
        </span>

        <div>
          <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
            Punto de entrega
          </span>

          <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Dirección de entrega
          </h2>
        </div>
      </div>

      {/* Datos de la dirección */}
      <div className="rounded-lg bg-surface-container-low p-space-md space-y-1">

        <div className="flex flex-wrap items-start justify-between gap-space-xs">

          <p className="font-body-lg-medium text-body-lg-medium text-on-surface">
            {address.street}
          </p>

          <span className="font-caption-bold text-caption-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            {deliveryTime}
          </span>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant">
          {address.detail}
        </p>

        <p className="font-caption-sm text-caption-sm text-on-surface-variant flex items-center gap-1 pt-1">
          <span className="material-symbols-outlined text-[16px] text-primary-container">notifications</span>
          {address.instructions}
        </p>
      </div>
    </section>
  )
}

export default DeliveryAddress
