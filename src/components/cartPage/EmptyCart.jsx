import { Link } from "react-router"

/**
 * Estado vacío del carrito (RN-01).
 */
function EmptyCart() {

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm flex flex-col items-center text-center gap-space-md">

      <span className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-primary-container text-[32px]">remove_shopping_cart</span>
      </span>

      <div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
          Tu carrito está vacío
        </h2>

        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Agregá productos de un comercio para armar tu pedido.
        </p>
      </div>

      <Link
        to="/inicio"
        className="h-11 px-space-lg rounded-xl bg-primary-container hover:bg-primary text-on-primary font-body-md-medium text-body-md-medium flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[20px]">storefront</span>
        Explorar comercios
      </Link>
    </div>
  )
}

export default EmptyCart
