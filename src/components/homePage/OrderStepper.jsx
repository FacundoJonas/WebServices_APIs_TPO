/**
 * Barra de progreso del pedido dividida en pasos.
 *
 * Props:
 * @param {Array} steps
 * Lista de pasos con la forma { id, label, time, icon, status }.
 * status puede ser "done", "current" o "pending".
 *
 * @param {number} progress
 * Porcentaje de avance de la barra (0 a 100).
 */
function OrderStepper({ steps, progress }) {

    return (
        <div className="relative pt-space-xs">

            <div className="grid grid-cols-4 relative z-10">

                {steps.map((step, index) => {

                    /*
                     * El primer paso se alinea a la izquierda,
                     * el último a la derecha y el resto al centro.
                     */
                    const isFirst = index === 0
                    const isLast = index === steps.length - 1

                    const alignment = isFirst
                        ? "items-start"
                        : isLast
                            ? "items-end text-right"
                            : "items-center text-center"

                    return (
                        <div
                            key={step.id}
                            className={`flex flex-col gap-1 ${alignment}`}
                        >

                            <StepIcon step={step} />

                            <span className={`font-caption-bold text-caption-bold
                                ${step.status === "current" ? "text-primary" : step.status === "done" ? "text-on-surface" : "text-secondary"}`}
                            >
                                {step.label}
                            </span>

                            <span className={`font-caption-sm text-caption-sm
                                ${step.status === "current" ? "text-primary-container font-semibold" : "text-secondary"}`}
                            >
                                {step.time}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Barra de fondo y barra de progreso */}
            <div className="absolute top-[18px] left-3 right-3 h-1 bg-surface-container-highest">

                <div
                    className="h-full bg-primary-container rounded-full"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    )
}

/**
 * Ícono circular de cada paso según su estado.
 */
function StepIcon({ step }) {

    if (step.status === "done") {

        return (
            <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm">

                <span className="material-symbols-outlined text-[16px]">
                    check
                </span>
            </div>
        )
    }

    if (step.status === "current") {

        return (
            <div className="relative flex items-center justify-center">

                {/* Pulso animado del paso actual */}
                <span className="absolute w-9 h-9 rounded-full bg-primary-container/30 animate-ping" />

                <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md">

                    <span className="material-symbols-outlined text-[16px]">
                        {step.icon}
                    </span>
                </div>
            </div>
        )
    }

    // step.status === "pending"
    return (
        <div className="w-7 h-7 rounded-full bg-surface-container-high text-outline flex items-center justify-center">

            <span className="material-symbols-outlined text-[16px]">
                {step.icon}
            </span>
        </div>
    )
}

export default OrderStepper