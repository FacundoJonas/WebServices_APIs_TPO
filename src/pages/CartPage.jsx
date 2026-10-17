import { useState } from "react"
import { Link, useNavigate } from "react-router"

import CartItem from "../components/cartPage/CartItem"
import CouponInput from "../components/cartPage/CouponInput"
import PurchaseSummary from "../components/cartPage/PurchaseSummary"
import EmptyCart from "../components/cartPage/EmptyCart"

import { useCart } from "../context/useCart"
import { crearPedido, aplicarCupon } from "../servicies/pedidosServicie"
import { obtenerUsuario } from "../servicies/authServicie"

/**
 * PNT-04 Carrito (CU-03).
 *
 * Permite modificar cantidades, agregar notas, aplicar un cupón
 * y confirmar la compra creando el pedido (API-04).
 */
function CartPage() {

  const navigate = useNavigate()

  const {
    store,
    address,
    cart,
    notes,
    setNotes,
    coupon,
    setCoupon,
    order,
    setOrder,
    changeQuantity,
    removeFromCart,
    itemCount,
    amounts,
    getCartVersion,
  } = useCart()

  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  /*
   * Mientras hay una llamada en curso se bloquean el carrito
   * y los botones, para no crear pedidos duplicados.
   */
  const busy = loading || couponLoading

  /**
   * Devuelve el pedido actual o lo crea en el Módulo Pedidos.
   * Arma el DTO-04 CrearPedidoRequest.
   */
  async function getOrCreateOrder() {

    if (order) return order

    const usuario = obtenerUsuario()

    const newOrder = await crearPedido({
      usuarioId: usuario?.username,
      comercioId: store.id,
      items: cart.map((item) => ({
        productoId: item.id,
        cantidad: item.quantity,
        precioUnitario: item.price,
      })),
      notas: notes,
      direccionEntregaId: address.id,
    })

    return newOrder
  }

  /**
   * Aplica un cupón (API-09). Si es inválido se muestra el error (RN-02).
   */
  async function handleApplyCoupon(code) {

    setCouponError("")
    setCouponLoading(true)

    const version = getCartVersion()

    try {
      const currentOrder = await getOrCreateOrder()

      // Si el carrito cambió mientras tanto, el pedido ya no corresponde.
      if (getCartVersion() !== version) {
        setCouponError("Tu carrito cambió. Volvé a aplicar el cupón.")
        return
      }

      setOrder(currentOrder)

      const updatedOrder = await aplicarCupon(currentOrder.id, code)

      if (getCartVersion() !== version) {
        setCouponError("Tu carrito cambió. Volvé a aplicar el cupón.")
        return
      }

      setOrder(updatedOrder)
      setCoupon({ code: code.toUpperCase(), discount: updatedOrder.descuento })
    } catch (err) {
      setCouponError(err.message)
    } finally {
      setCouponLoading(false)
    }
  }

  /**
   * Quitar el cupón obliga a recrear el pedido sin descuento.
   */
  function handleRemoveCoupon() {
    setCoupon(null)
    setOrder(null)
  }

  /**
   * Confirma la compra y navega a Pagar (NAV-04).
   */
  async function handleContinue() {

    setError("")
    setLoading(true)

    const version = getCartVersion()

    try {
      const currentOrder = await getOrCreateOrder()

      if (getCartVersion() !== version) {
        setError("Tu carrito cambió. Revisalo y confirmá de nuevo.")
        return
      }

      setOrder(currentOrder)
      navigate("/pagar")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="w-full pt-20 bg-background min-h-[calc(100vh-280px)]">

      <div className="max-w-[1280px] mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-xl">

        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-lg">

          <div className="flex items-center gap-space-sm">

            <Link
              to="/comercio"
              className="flex items-center gap-1 font-body-md-medium text-body-md-medium text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Volver
            </Link>

            <h1 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Tu Carrito
            </h1>

            <span className="font-caption-bold text-caption-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant">
              {itemCount} ítems
            </span>
          </div>
        </div>

        {cart.length === 0 ? (

          <EmptyCart />

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">

            {/* Columna izquierda: comercio, productos, notas y cupón */}
            <section className="lg:col-span-8 space-y-space-md">

              {/* Comercio */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between gap-space-md">

                <div className="flex items-center gap-space-sm min-w-0">

                  <img
                    src={store.image}
                    alt={store.name}
                    className="w-14 h-14 rounded-lg object-cover bg-surface-container-high shrink-0"
                  />

                  <div className="min-w-0">
                    <h2 className="font-title-md text-title-md text-on-surface font-semibold">
                      {store.name}
                    </h2>

                    <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
                      {store.area}
                      <span>•</span>
                      <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                      {store.deliveryTime}
                    </p>
                  </div>
                </div>

                <Link
                  to="/comercio"
                  className="h-10 px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-body-md-medium text-body-md-medium flex items-center gap-1 shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Agregar más
                </Link>
              </div>

              {/* Productos */}
              <div className="space-y-space-sm">

                <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
                  Tus productos
                </span>

                {cart.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onIncrease={(id) => changeQuantity(id, 1)}
                    onDecrease={(id) => changeQuantity(id, -1)}
                    onRemove={removeFromCart}
                    disabled={busy}
                  />
                ))}
              </div>

              {/* Notas para el comercio o el repartidor */}
              <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">

                <label
                  htmlFor="cart-notes"
                  className="font-body-lg-medium text-body-lg-medium text-on-surface flex items-center gap-space-xs"
                >
                  <span className="material-symbols-outlined text-primary-container text-[22px]">edit_note</span>
                  Aclaraciones para la cocina o repartidor (opcional)
                </label>

                <textarea
                  id="cart-notes"
                  rows={3}
                  maxLength={200}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Timbre 4B no anda, mandar WhatsApp al llegar"
                  className="w-full p-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md resize-none outline-none focus:ring-2 focus:ring-primary-container"
                />
              </section>

              {/* Cupón */}
              <CouponInput
                coupon={coupon}
                loading={couponLoading}
                disabled={busy}
                error={couponError}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
              />
            </section>

            {/* Columna derecha: resumen y confirmación */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-space-md">

              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-md space-y-space-md">

                <PurchaseSummary
                  amounts={amounts}
                  itemCount={itemCount}
                  couponCode={coupon?.code}
                />

                {error && (
                  <p className="font-caption-sm text-caption-sm text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {error}
                  </p>
                )}

                {/* RN-01: deshabilitado si el carrito está vacío */}
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={cart.length === 0 || busy}
                  className="w-full h-12 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-body-lg-medium text-body-lg-medium flex items-center justify-between px-space-md shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                    {loading ? "Creando pedido..." : "Continuar al pago"}
                  </span>

                  <span className="font-bold">
                    $ {amounts.total.toLocaleString("es-AR")}
                  </span>
                </button>

                <p className="font-caption-sm text-caption-sm text-secondary flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
                  Pago 100% protegido con cifrado SSL
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

export default CartPage
