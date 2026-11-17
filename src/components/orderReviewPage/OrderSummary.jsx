/**
 * Resumen del pedido entregado (Módulo Pedidos).
 *
 * Muestra los productos comprados y el total abonado.
 *
 * Props:
 * @param {Object} pedido
 * Pedido mapeado por pedidosServicie: { fecha, items: [{ productoId, nombre, cantidad, precioUnitario }], total }.
 */
function OrderSummary({ pedido }) {

  const items = pedido?.items ?? []

  const hora = pedido?.fecha
    ? `${new Date(pedido.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })} hs`
    : ""

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">

      {/* Encabezado */}
      <div className="flex items-center justify-between pb-space-xs">

        <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
          Resumen del pedido
        </span>

        {hora && (
          <span className="font-caption-sm text-caption-sm text-on-surface-variant">
            {hora}
          </span>
        )}
      </div>

      {/* Productos incluidos en el pedido */}
      <div className="space-y-space-sm">
        {items.map((item) => (
          <OrderItem
            key={item.productoId}
            quantity={item.cantidad}
            name={item.nombre}
            price={`$ ${(Number(item.precioUnitario) * item.cantidad).toLocaleString("es-AR")}`}
          />
        ))}
      </div>

      {/* Total abonado */}
      <div className="pt-space-xs flex items-center justify-between bg-surface-container-low p-space-sm rounded-lg">

        <span className="font-body-md-medium text-body-md-medium text-on-surface">
          Total abonado
        </span>

        <span className="font-title-md text-title-md text-primary font-bold">
          $ {Number(pedido?.total ?? 0).toLocaleString("es-AR")} {pedido?.moneda ?? "ARS"}
        </span>
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
