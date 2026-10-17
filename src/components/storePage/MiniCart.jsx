import { Link } from "react-router"

/**
 * Fila reutilizable para mostrar un concepto
 * y su importe dentro del resumen del carrito.
 *
 * Props:
 * @param {string} label
 * Nombre del concepto.
 *
 * @param {number} value
 * Importe que se mostrará formateado en pesos.
 */
function PriceRow({ label, value }) {

  return (
    <div className="flex items-center justify-between font-body-md text-body-md text-on-surface-variant">

      <span>
        {label}
      </span>

      <span className="text-on-surface font-medium">
        $ {value.toLocaleString("es-AR")}
      </span>
    </div>
  )
}

/**
 * Carrito lateral del comercio.
 *
 * Props:
 * @param {Array} cart
 * Productos presentes actualmente en el carrito.
 *
 * @param {Function} onIncrease
 * Función para aumentar la cantidad de un producto.
 *
 * @param {Function} onDecrease
 * Función para disminuir la cantidad de un producto.
 */
function MiniCart({ cart, onIncrease, onDecrease }) {

  /*
   * Cantidad total de unidades presentes en el carrito.
   */
  const itemCount = cart.reduce(
    (total, item) => total + item.quantity, 0 )

  /*
   * Suma de precio × cantidad para todos los productos.
   */
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity, 0 )

  /*
   * Se cobra envío únicamente si existe
   * al menos un producto.
   */
  const shipping = cart.length > 0 ? 850 : 0

  /*
   * Total parcial del pedido.
   */
  const total = subtotal + shipping

  return (
    <aside className="col-span-1 lg:col-span-3 sticky top-24 space-y-space-md">

      {/* Contenedor principal del carrito */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-md">

        {/* Encabezado */}
        <div className="flex items-center justify-between pb-space-sm mb-space-sm">

          <div className="flex items-center gap-2">

            <span className="material-symbols-outlined text-primary-container text-[22px]">
              shopping_cart
            </span>

            <h3 className="font-title-md text-title-md text-on-surface font-semibold">
              Tu pedido
            </h3>
          </div>

          {/* Número total de unidades */}
          <span className="font-caption-sm text-caption-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
            {itemCount} items
          </span>
        </div>

        {/* Comercio asociado al carrito */}
        <p className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary mb-space-xs">
          La Birra Bar - Almagro
        </p>

        {/*
         * Renderizado condicional:
         * si el carrito está vacío se muestra un mensaje.
         */}
        {cart.length === 0 ? (

          <p className="font-body-md text-body-md text-on-surface-variant py-space-md">
            Todavía no agregaste productos.
          </p>

        ) : (

          /* Lista de productos */
          <div className="space-y-space-sm">

            {cart.map((item) => (

              <div
                key={item.id}
                className="flex items-start justify-between gap-space-xs bg-surface-container-low/50 p-space-xs rounded-lg"
              >

                {/* Nombre y precio acumulado del producto */}
                <div className="flex flex-col flex-1 min-w-0">

                  <span className="font-body-md-medium text-body-md-medium text-on-surface truncate">
                    {item.name}
                  </span>

                  <span className="font-body-md text-body-md text-on-surface font-semibold mt-1">
                    $ {(item.price * item.quantity).toLocaleString("es-AR")}
                  </span>
                </div>

                {/* Selector de cantidad */}
                <div className="flex items-center bg-surface-container-lowest rounded-md px-1 py-0.5 shadow-sm shrink-0">

                  <button
                    type="button"
                    onClick={() => onDecrease(item.id)}
                    className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-primary"
                  >
                    -
                  </button>

                  <span className="w-5 text-center font-caption-bold text-caption-bold text-on-surface">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => onIncrease(item.id)}
                    className="w-6 h-6 flex items-center justify-center text-primary-container font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resumen económico */}
        <div className="pt-space-md mt-space-md space-y-1.5">

          <PriceRow
            label="Subtotal"
            value={subtotal}
          />

          <PriceRow
            label="Costo de envío"
            value={shipping}
          />

          {/* Total parcial */}
          <div className="flex items-center justify-between font-title-md text-title-md text-on-surface font-bold pt-space-xs">

            <span>
              Total parcial
            </span>

            <span className="text-primary-container tracking-tight">
              $ {total.toLocaleString("es-AR")}
            </span>
          </div>
        </div>

        {/* Checkout (NAV-03) */}
        <Link
          to="/carrito"
          className="w-full mt-space-md h-12 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-body-lg-medium text-body-lg-medium flex items-center justify-between px-space-md shadow-md transition-all active:scale-[0.98]"
        >

          <span>
            Ver carrito y pagar
          </span>

          <span className="font-bold">
            $ {total.toLocaleString("es-AR")}
          </span>
        </Link>

        {/* Información de seguridad */}
        <div className="mt-space-sm text-center">

          <p className="font-caption-sm text-caption-sm text-secondary flex items-center justify-center gap-1">

            <span className="material-symbols-outlined text-[14px] text-primary">
              lock
            </span>

            Pagos procesados de forma 100% segura
          </p>
        </div>
      </div>

      {/* Mensaje promocional de envío gratuito */}
      <div className="p-space-md rounded-xl bg-gradient-to-br from-surface-container to-surface-container-high flex items-center gap-space-sm">

        <div className="p-space-xs rounded-lg bg-primary-fixed text-on-primary-fixed shrink-0">

          <span className="material-symbols-outlined text-[24px]">
            redeem
          </span>
        </div>

        <div>

          <p className="font-caption-bold text-caption-bold text-on-surface">
            Agregá $3.450 más
          </p>

          <p className="font-caption-sm text-caption-sm text-on-surface-variant">
            ¡Y desbloqueás Envío Gratis en este pedido!
          </p>
        </div>
      </div>
    </aside>
  )
}

export default MiniCart