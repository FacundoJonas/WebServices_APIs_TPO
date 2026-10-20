/**
 * CMP-13 ItemCarrito: producto, cantidad y precio.
 *
 * Props:
 * @param {Object} item - Producto del carrito.
 * @param {Function} onIncrease - Suma una unidad.
 * @param {Function} onDecrease - Resta una unidad.
 * @param {Function} onRemove - Elimina el producto.
 * @param {boolean} disabled - Bloquea los botones mientras hay una llamada en curso.
 */
function CartItem({ item, onIncrease, onDecrease, onRemove, disabled = false }) {

  return (
    <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex gap-space-md">

      {/* Imagen del producto */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-surface-container-high">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between gap-space-xs">

        {/* Nombre, descripción y eliminar */}
        <div className="flex items-start justify-between gap-space-xs">

          <div className="min-w-0">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold truncate">
              {item.name}
            </h3>

            <p className="font-body-md text-body-md text-on-surface-variant truncate">
              {item.description ?? `$ ${item.price.toLocaleString("es-AR")} c/u`}
            </p>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(item.id)}
            aria-label={`Eliminar ${item.name}`}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>

        {/* Precio y selector de cantidad */}
        <div className="flex items-center justify-between gap-space-xs">

          <span className="font-title-md text-title-md text-on-surface font-bold">
            $ {(item.price * item.quantity).toLocaleString("es-AR")}
          </span>

          <div className="flex items-center bg-surface-container-low rounded-lg p-1 shadow-sm">

            <button
              type="button"
              disabled={disabled}
              onClick={() => onDecrease(item.id)}
              aria-label={`Restar una unidad de ${item.name}`}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-surface-container-lowest text-on-surface-variant hover:text-primary font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>

            <span className="w-8 text-center font-body-md-medium text-body-md-medium text-on-surface">
              {item.quantity}
            </span>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onIncrease(item.id)}
              aria-label={`Sumar una unidad de ${item.name}`}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-primary text-on-primary font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default CartItem
