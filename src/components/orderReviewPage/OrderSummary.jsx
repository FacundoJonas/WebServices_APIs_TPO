
/**
 * Resumen del pedido entregado.
 *
 * Muestra:
 * - Productos comprados.
 * - Total abonado.
 * - Selector de propina para el repartidor.
 *
 * Props:
 * @param {Array} items - ItemResponse[] del pedido (GET /api/v1/orders/{id}).
 * @param {number} total - total calculado por Pedidos.
 * @param {string} moneda
 *
 * @param {number|string} selectedTip
 * Propina actualmente seleccionada.
 *
 * Puede contener un monto numérico o el valor "other".
 *
 * @param {Function} onTipChange
 * Función utilizada para cambiar la propina seleccionada.
 */
function OrderSummary({ items = [], total, moneda = "ARS", selectedTip, onTipChange }) {

  /*
   * Montos predefinidos disponibles como propina.
   */
  const tips = [200, 400, 600]

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">

      {/* Encabezado */}
      <div className="flex items-center justify-between pb-space-xs">

        <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
          Resumen del pedido
        </span>

      </div>

      {/* Productos incluidos en el pedido */}
      <div className="space-y-space-sm">

        {items.length === 0 && (
          <p className="font-body-md text-body-md text-on-surface-variant">
            No pudimos cargar los productos del pedido.
          </p>
        )}

        {items.map((item) => (
          <OrderItem
            key={item.id ?? item.productoId}
            quantity={item.cantidad}
            name={item.nombreProducto ?? `Producto ${item.productoId}`}
            price={`$${(item.subtotal ?? 0).toLocaleString("es-AR")}`}
          />
        ))}
      </div>

      {/* Total abonado */}
      <div className="pt-space-xs flex items-center justify-between bg-surface-container-low p-space-sm rounded-lg">

        <span className="font-body-md-medium text-body-md-medium text-on-surface">
          Total abonado
        </span>

        <span className="font-title-md text-title-md text-primary font-bold">
          {total != null ? `$${total.toLocaleString("es-AR")} ${moneda}` : "—"}
        </span>
      </div>

      {/* Selector de propina */}
      <div className="pt-space-2xs space-y-space-2xs">

        <span className="font-caption-bold text-caption-bold text-on-surface flex items-center gap-space-2xs">

          <span className="material-symbols-outlined text-[16px] text-primary-container">
            volunteer_activism
          </span>

          Propina al repartidor
        </span>

        <div className="grid grid-cols-4 gap-space-2xs text-center font-caption-bold text-caption-bold">

          {/* Los botones se crean dinámicamente */}
          {tips.map((tip) => (

            <button
              key={tip}
              type="button"
              onClick={() => onTipChange(tip)}
              className={` py-1.5 rounded-lg transition-colors
                ${ selectedTip === tip ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface hover:bg-surface-container text-on-surface" }`}
            >
              ${tip}
            </button>

          ))}

          {/* Opción para ingresar otro monto */}
          <button
            type="button"
            onClick={() => onTipChange("other")}
            className={` py-1.5 rounded-lg transition-colors
              ${ selectedTip === "other" ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface hover:bg-surface-container text-on-surface" }`}
          >
            Otro
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Representa una línea individual del resumen del pedido.
 *
 * Props:
 * @param {number} quantity - Cantidad del producto.
 * @param {string} name - Nombre del producto.
 * @param {string} price - Precio mostrado.
 */
function OrderItem({ quantity, name, price }) {

  return (
    <div className="flex items-center justify-between gap-space-sm">

      <div className="flex items-center gap-space-xs min-w-0">

        {/* Cantidad del producto */}
        <span className="font-body-md-medium text-body-md-medium px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface shrink-0">
          {quantity}x
        </span>

        {/* Nombre del producto */}
        <span className="font-body-md text-body-md text-on-surface truncate">
          {name}
        </span>
      </div>

      {/* Precio */}
      <span className="font-body-md-medium text-body-md-medium text-on-surface shrink-0">
        {price}
      </span>
    </div>
  )
}

export default OrderSummary