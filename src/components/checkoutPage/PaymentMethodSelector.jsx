/*
 * Tipos de medio de pago que acepta el backend (ConfirmarPedidoRequest.medioPago).
 */
const paymentMethodTypes = [
    {
        id: "TARJETA_CREDITO",
        name: "Tarjeta de crédito",
        icon: "credit_card",
        hint: "Hasta 12 cuotas con tu banco",
    },
    {
        id: "TARJETA_DEBITO",
        name: "Tarjeta de débito",
        icon: "credit_card",
        hint: "Aprobación inmediata",
    },
    {
        id: "BILLETERA_VIRTUAL",
        name: "Billetera virtual",
        icon: "account_balance_wallet",
        hint: "Mercado Pago, Ualá, etc.",
    },
    {
        id: "TRANSFERENCIA",
        name: "Transferencia bancaria",
        icon: "account_balance",
        hint: "Acreditación en el día",
    },
]

/*
 * Texto visible según el código de rechazo.
 */
function rejectionReason(code) {
    return code === "PAYMENT_REJECTED" ? "Rechazado por Pagos" : "No se pudo procesar"
}

/**
 * Opción individual de medio de pago.
 */
function PaymentOption({ method, selected, rejectionCode, onSelect }) {

    const rejected = Boolean(rejectionCode)

    return (
        <label
            className={`flex items-center gap-space-md p-space-md rounded-lg transition-colors
        ${rejected ? "bg-surface-container-low opacity-60 cursor-not-allowed" : selected ? "bg-primary-fixed/30 ring-2 ring-primary-container cursor-pointer" : "bg-surface-container-low hover:bg-surface-container cursor-pointer"}`}
        >

            {/* Un medio rechazado no se puede volver a elegir (RN-05) */}
            <input
                type="radio"
                name="payment-method"
                checked={selected}
                disabled={rejected}
                onChange={() => onSelect(method.id)}
                className="w-5 h-5 accent-primary shrink-0"
            />

            <span className="w-12 h-8 rounded-md bg-surface-container-lowest flex items-center justify-center shadow-sm shrink-0">
        <span className="material-symbols-outlined text-primary text-[20px]">{method.icon}</span>
      </span>

            <div className="flex-1 min-w-0">

                <p className="font-body-md-medium text-body-md-medium text-on-surface flex flex-wrap items-center gap-space-xs">
                    {method.name}

                    {rejected && (
                        <span className="px-2 py-0.5 rounded bg-error text-on-error font-caption-bold text-caption-bold">
              Rechazado
            </span>
                    )}
                </p>
            </div>

            <span className={`font-caption-bold text-caption-bold hidden sm:inline shrink-0 ${rejected ? "text-error" : "text-primary"}`}>
        {rejected ? rejectionReason(rejectionCode) : method.hint}
      </span>
        </label>
    )
}

/**
 * CMP-08 SelectorMetodoPago.
 *
 * Props:
 * @param {string|null} selectedId - Tipo de medio seleccionado (TARJETA_CREDITO, etc.).
 * @param {Object} rejections - Tipos rechazados en esta sesión: { [tipo]: codigo }.
 * @param {Function} onSelect - Cambia el tipo seleccionado.
 */
function PaymentMethodSelector({ selectedId, rejections, onSelect }) {

    return (
        <section id="payment-methods" className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md scroll-mt-24">

            {/* Encabezado */}
            <div className="flex items-center justify-between gap-space-sm">

                <div className="flex items-center gap-space-sm">

          <span className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary-container text-[22px]">payments</span>
          </span>

                    <div>
            <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-secondary">
              Transacción encriptada
            </span>

                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                            Elegí cómo pagar
                        </h2>
                    </div>
                </div>

                <span className="font-caption-sm text-caption-sm text-secondary hidden sm:flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          Checkout 100% protegido
        </span>
            </div>

            {/* Tipos de medio de pago */}
            <div className="space-y-space-sm">
                {paymentMethodTypes.map((method) => (
                    <PaymentOption
                        key={method.id}
                        method={method}
                        selected={method.id === selectedId}
                        rejectionCode={rejections[method.id]}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </section>
    )
}

export default PaymentMethodSelector