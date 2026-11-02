import { Link } from "react-router"

import OrderStepper from "./OrderStepper"
import CourierInfo from "./CourierInfo"

/**
 * Tarjeta destacada con el pedido actualmente en curso.
 *
 * Props:
 * @param {Object} order
 * Pedido con la forma:
 * { id, storeName, etaLabel, steps, progress, courier,
 *   mapImage, distanceLabel, trackingPath }
 */
function ActiveOrderCard({ order }) {

    return (
        <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-md p-space-lg">

            {/* Línea de color superior */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-container via-primary to-tertiary-container" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">

                {/* Lado izquierdo: datos, progreso y repartidor */}
                <div className="flex-1 space-y-space-md">

                    <div className="flex flex-wrap items-center justify-between gap-space-xs pb-space-xs">

                        {/* Identificación del pedido */}
                        <div className="flex items-center gap-space-xs">

                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-container/15 text-primary">

                                <span className="material-symbols-outlined text-[18px]">
                                    moped
                                </span>
                            </span>

                            <div>

                                <span className="font-caption-bold text-caption-bold text-secondary uppercase tracking-wide">
                                    Pedido en curso
                                </span>

                                <h2 className="font-title-md text-title-md text-on-surface font-bold">
                                    #{order.id} • {order.storeName}
                                </h2>
                            </div>
                        </div>

                        {/* Horario estimado de llegada */}
                        <div className="flex items-center gap-space-2xs px-space-sm py-1 rounded-full bg-primary-fixed text-on-primary-container font-caption-bold text-caption-bold">

                            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />

                            {order.etaLabel}
                        </div>
                    </div>

                    <OrderStepper
                        steps={order.steps}
                        progress={order.progress}
                    />

                    <CourierInfo courier={order.courier} />
                </div>

                {/* Lado derecho: mapa y acceso al seguimiento */}
                <div className="lg:w-72 flex flex-col justify-between gap-space-sm shrink-0">

                    <div
                        className="w-full h-32 rounded-xl bg-cover bg-center shadow-sm relative overflow-hidden flex items-end p-space-xs"
                        style={{ backgroundImage: `url(${order.mapImage})` }}
                    >

                        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/70 via-transparent to-transparent" />

                        <div className="relative z-10 flex items-center justify-between w-full text-on-primary">

                            <span className="font-caption-bold text-caption-bold flex items-center gap-1">

                                <span className="material-symbols-outlined text-[16px] text-primary-fixed">
                                    navigation
                                </span>

                                {order.distanceLabel}
                            </span>

                            <span className="font-caption-sm text-caption-sm bg-inverse-surface/80 px-2 py-0.5 rounded backdrop-blur-sm">
                                En vivo
                            </span>
                        </div>
                    </div>

                    <Link
                        to={order.trackingPath}
                        className="w-full h-11 px-space-md rounded-xl bg-surface-container-lowest hover:bg-primary/5 text-primary font-body-md-medium text-body-md-medium flex items-center justify-center gap-space-xs shadow-sm transition-all hover:shadow"
                    >

                        <span className="material-symbols-outlined text-[18px] text-primary-container">
                            explore
                        </span>

                        Ver seguimiento en vivo
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default ActiveOrderCard