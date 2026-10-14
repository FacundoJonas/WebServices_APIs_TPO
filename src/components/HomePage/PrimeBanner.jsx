/**
 * Banner promocional de la suscripción DeliveryGo Prime.
 *
 * Props:
 * @param {Object} plan
 * Plan con la forma { price, description, ctaLabel }.
 */
function PrimeBanner({ plan }) {

    return (
        <section className="rounded-xl bg-gradient-to-r from-surface-container-highest via-surface-container to-surface-container-low p-space-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md">

            <div className="flex items-center gap-space-md">

                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm shrink-0">

                    <span className="material-symbols-outlined text-[28px]">
                        verified
                    </span>
                </div>

                <div>

                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        Sumate a DeliveryGo Prime por ${plan.price.toLocaleString("es-AR")}/mes
                    </h3>

                    <p className="font-body-md text-body-md text-on-surface-variant">
                        {plan.description}
                    </p>
                </div>
            </div>

            <button
                type="button"
                className="shrink-0 h-11 px-space-lg rounded-xl bg-primary-container hover:bg-primary text-on-primary font-body-md-medium text-body-md-medium transition-colors shadow-sm"
            >
                {plan.ctaLabel}
            </button>
        </section>
    )
}

export default PrimeBanner