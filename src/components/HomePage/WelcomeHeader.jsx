/**
 * Encabezado de bienvenida de la posición global.
 *
 * Props:
 * @param {string} userName
 * Nombre del usuario.
 *
 * @param {string} address
 * Dirección de entrega actual.
 *
 * @param {Function} onChangeAddress
 * Se ejecuta al hacer clic en "Cambiar dirección".
 *
 * @param {Object} coupon
 * Cupón destacado con la forma { label, title }.
 */
function WelcomeHeader({ userName, address, onChangeAddress, coupon }) {

    return (
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">

            <div className="space-y-space-2xs">

                {/* Indicador de zona activa */}
                <div className="inline-flex items-center gap-space-2xs px-space-xs py-1 rounded-full bg-surface-container-high text-primary font-caption-bold text-caption-bold">

                    <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />

                    Entregas activas en tu zona
                </div>

                {/* Saludo */}
                <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight">

                    ¡Hola {userName}!{" "}

                    <span className="text-on-surface-variant font-headline-lg font-normal">
                        ¿Qué vas a pedir hoy?
                    </span>
                </h1>

                {/* Dirección de entrega */}
                <div className="flex flex-wrap items-center gap-space-xs text-on-surface-variant pt-space-2xs">

                    <span className="material-symbols-outlined text-primary-container text-[20px]">
                        near_me
                    </span>

                    <span className="font-body-md-medium text-body-md-medium text-on-surface">
                        {address}
                    </span>

                    <span className="text-secondary opacity-40">
                        •
                    </span>

                    <button
                        type="button"
                        onClick={onChangeAddress}
                        className="text-primary font-body-md-medium text-body-md-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >

                        Cambiar dirección

                        <span className="material-symbols-outlined text-[16px]">
                            expand_more
                        </span>
                    </button>
                </div>
            </div>

            {/* Cupón destacado. Solo visible en pantallas grandes */}
            <div className="hidden xl:flex items-center gap-space-md p-space-sm rounded-xl bg-surface-container-low shadow-sm">

                <div className="w-10 h-10 rounded-lg bg-primary-container/15 flex items-center justify-center text-primary">

                    <span className="material-symbols-outlined text-[24px]">
                        local_offer
                    </span>
                </div>

                <div>

                    <span className="font-caption-bold text-caption-bold text-primary block leading-tight uppercase">
                        {coupon.label}
                    </span>

                    <span className="font-title-md text-title-md text-on-surface font-bold">
                        {coupon.title}
                    </span>
                </div>
            </div>
        </section>
    )
}

export default WelcomeHeader