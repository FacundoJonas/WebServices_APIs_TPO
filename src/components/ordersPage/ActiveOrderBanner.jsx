import { estadosPedido } from "./orderStatus"

/**
 * Banner destacado para el pedido que está en curso.
 *
 * Props:
 * @param {Object} pedido
 * Pedido en curso (PedidoResponse).
 *
 * @param {Function} onTrack
 * Se ejecuta al tocar "Seguir pedido".
 */
function ActiveOrderBanner({ pedido, onTrack }) {

    const estado = estadosPedido[pedido.estado]?.label ?? pedido.estado

    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-container p-space-lg text-on-primary shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md">

            {/* Círculo decorativo */}
            <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-primary-fixed/15 blur-2xl pointer-events-none" />

            <div className="flex items-center gap-space-md">

                <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px] animate-pulse">
                        two_wheeler
                    </span>
                </div>

                <div className="flex flex-col">

                    <div className="flex items-center gap-space-xs">
                        <span className="px-space-xs py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-caption-bold text-caption-bold">
                            {estado}
                        </span>

                        <span className="font-caption-sm text-caption-sm text-on-primary/90">
                            Pedido #{pedido.id}
                        </span>
                    </div>

                    <p className="font-title-md text-title-md mt-0.5">
                        Tu pedido de {pedido.comercio.nombre} está {estado.toLowerCase()}
                        {pedido.minutosEstimados && ` · llega en ${pedido.minutosEstimados} min`}
                    </p>

                    {pedido.repartidor && (
                        <p className="font-caption-sm text-caption-sm text-on-primary/80">
                            Repartidor: {pedido.repartidor}
                        </p>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={onTrack}
                className="relative shrink-0 px-space-lg py-2.5 rounded-full bg-surface-container-lowest text-primary hover:bg-surface-container-low font-body-md-medium text-body-md-medium shadow-md transition-all flex items-center justify-center gap-space-xs"
            >
                Seguir pedido

                <span className="material-symbols-outlined text-[18px]">
                    near_me
                </span>
            </button>
        </div>
    )
}

export default ActiveOrderBanner
