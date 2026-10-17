import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router"

import CheckoutSteps from "../components/checkoutPage/CheckoutSteps"
import DeliveryAddress from "../components/checkoutPage/DeliveryAddress"
import PaymentMethodSelector from "../components/checkoutPage/PaymentMethodSelector"
import PaymentRejectedBanner from "../components/checkoutPage/PaymentRejectedBanner"
import PurchaseSummary from "../components/cartPage/PurchaseSummary"

import { useCart } from "../context/useCart"
import { procesarPago, reintentarPago } from "../servicies/pagosServicie"

/*
 * Medios de pago guardados del usuario.
 * TODO: obtenerlos del Módulo Pagos (CU-08 de Pagos).
 *
 * Para probar RN-05, la Visa Débito siempre es rechazada por el mock.
 */
const paymentMethods = [
  {
    id: "visa-4821",
    name: "Visa Débito •••• 4821",
    detail: "Vence 08/27 • Banco Galicia",
    type: "debito",
    icon: "credit_card",
  },
  {
    id: "master-9012",
    name: "Mastercard Crédito •••• 9012",
    detail: "Vence 11/26 • Santander Río",
    type: "credito",
    icon: "credit_card",
    badge: "Recomendado",
    hint: "Apta cuotas",
  },
  {
    id: "saldo",
    name: "Dinero en cuenta DeliveryGo Pagos",
    detail: "Saldo disponible: $ 18.200,00",
    type: "saldo",
    icon: "account_balance_wallet",
    hint: "Aprobación inmediata",
  },
]

/**
 * PNT-05 Pagar (CU-04).
 *
 * Muestra la dirección, los medios de pago y el resumen del pedido.
 * Maneja el pago aprobado (NAV-06) y el rechazado (RN-05, NAV-05).
 */
function CheckoutPage() {

  const navigate = useNavigate()

  const { store, address, cart, coupon, order, itemCount, amounts, clearCart } = useCart()

  const [selectedMethodId, setSelectedMethodId] = useState(null)
  const [installments, setInstallments] = useState(1)

  const [loading, setLoading] = useState(false)

  /*
   * Último rechazo: { code, message } o null.
   */
  const [rejection, setRejection] = useState(null)

  /*
   * Medios rechazados en esta sesión de pago: { [metodoPagoId]: codigo }.
   */
  const [rejections, setRejections] = useState({})

  /*
   * Error técnico (red o servidor). No es un rechazo del medio de pago.
   */
  const [paymentError, setPaymentError] = useState("")

  /*
   * Evita volver al carrito mientras se navega al Home tras pagar.
   */
  const [paid, setPaid] = useState(false)

  /*
   * Sin pedido creado no se puede pagar: se vuelve al carrito.
   */
  if (!order) {
    return paid ? null : <Navigate to="/carrito" replace />
  }

  function handleSelectMethod(id) {
    setSelectedMethodId(id)
    setInstallments(1)
  }

  /**
   * Envía el DTO-06 PagoRequest.
   * El primer intento usa API-05; los siguientes, API-10.
   */
  async function handlePay() {

    setLoading(true)
    setRejection(null)
    setPaymentError("")

    const pagoRequest = {
      pedidoId: order.id,
      metodoPagoId: selectedMethodId,
      cuotas: installments,
    }

    try {
      if (Object.keys(rejections).length > 0) {
        await reintentarPago(pagoRequest)
      } else {
        await procesarPago(pagoRequest)
      }

      // NAV-06: PNT-08 Seguimiento todavía no existe, se vuelve al Home.
      setPaid(true)
      navigate("/inicio")
      clearCart()
    } catch (err) {

      if (err.codigo) {
        // RN-05: el medio de pago fue rechazado.
        setRejection({ code: err.codigo, message: err.message })
        setRejections((current) => ({ ...current, [selectedMethodId]: err.codigo }))
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        // Falla de red o del servidor: se puede reintentar con el mismo medio.
        setPaymentError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * NAV-05: elegir otro medio sin perder el pedido ni el carrito.
   */
  function handleRetry() {
    setRejection(null)
    setSelectedMethodId(null)
    document.getElementById("payment-methods")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <main className="w-full pt-20 bg-background min-h-[calc(100vh-280px)]">

      {/* CMP-09: banner de pago rechazado */}
      {rejection && (
        <div className="max-w-[1280px] mx-auto w-full px-gutter-mobile lg:px-gutter-desktop pt-space-md">
          <PaymentRejectedBanner
            code={rejection.code}
            message={rejection.message}
            onRetry={handleRetry}
          />
        </div>
      )}

      <div className="max-w-[1280px] mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-xl">

        {/* Navegación y pasos */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-lg">

          <Link
            to="/carrito"
            className="flex items-center gap-1 font-body-md-medium text-body-md-medium text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Volver al carrito
          </Link>

          <CheckoutSteps current={2} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">

          {/* Columna izquierda: dirección y medios de pago */}
          <section className="lg:col-span-7 space-y-space-md">

            <DeliveryAddress
              address={address}
              deliveryTime={store.deliveryTime}
            />

            <PaymentMethodSelector
              methods={paymentMethods}
              selectedId={selectedMethodId}
              rejections={rejections}
              onSelect={handleSelectMethod}
              installments={installments}
              onInstallmentsChange={setInstallments}
              total={amounts.total}
            />
          </section>

          {/* Columna derecha: resumen y confirmación */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24">

            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md space-y-space-md">

              {/* Comercio */}
              <div className="flex items-center gap-space-sm">

                <img
                  src={store.image}
                  alt={store.name}
                  className="w-12 h-12 rounded-lg object-cover bg-surface-container-high"
                />

                <div>
                  <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
                    Comercio
                  </span>

                  <p className="font-title-md text-title-md text-on-surface font-semibold">
                    {store.name}
                  </p>
                </div>
              </div>

              {/* Productos del pedido */}
              <ul className="space-y-space-sm">
                {cart.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-space-sm">

                    <span className="flex items-center gap-space-xs min-w-0">
                      <span className="font-body-md-medium text-body-md-medium px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface shrink-0">
                        {item.quantity}x
                      </span>

                      <span className="font-body-md text-body-md text-on-surface truncate">
                        {item.name}
                      </span>
                    </span>

                    <span className="font-body-md-medium text-body-md-medium text-on-surface shrink-0">
                      $ {(item.price * item.quantity).toLocaleString("es-AR")}
                    </span>
                  </li>
                ))}
              </ul>

              <PurchaseSummary
                amounts={amounts}
                itemCount={itemCount}
                couponCode={coupon?.code}
              />

              {/* RN-01: deshabilitado sin medio de pago */}
              <button
                type="button"
                onClick={handlePay}
                disabled={!selectedMethodId || loading}
                className="w-full h-14 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-title-md text-title-md flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[22px]">lock</span>
                {loading
                  ? "Procesando pago..."
                  : `Confirmar y pagar $ ${amounts.total.toLocaleString("es-AR")}`}
              </button>

              {paymentError && (
                <p role="alert" className="font-body-md text-body-md text-error bg-error-container rounded-lg p-space-sm flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-[20px]">wifi_off</span>
                  {paymentError}
                </p>
              )}

              {!selectedMethodId && (
                <p className="font-caption-sm text-caption-sm text-secondary text-center">
                  Elegí un medio de pago para continuar.
                </p>
              )}

              <p className="font-caption-sm text-caption-sm text-secondary text-center">
                Al tocar en "Confirmar y pagar" aceptás los Términos de Servicio de DeliveryGo
                y autorizás el débito en el medio seleccionado.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default CheckoutPage
