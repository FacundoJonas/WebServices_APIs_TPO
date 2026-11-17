import { Link } from "react-router"

import { obtenerUltimoPedido } from "../../servicies/pedidosServicie"

/**
 * Banner superior con el último pedido confirmado en la sesión.
 * El estado en vivo se sigue en la tarjeta del Home (CU-05,
 * GET /api/v1/orders/{id}). Si no hay pedido, no se muestra.
 */
function ActiveOrderBanner() {

    const pedido = obtenerUltimoPedido()

    if (!pedido?.id) return null

    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-container/15 via-surface-container to-surface-container-low p-space-md lg:p-space-lg shadow-sm">

            {/* Elemento decorativo de fondo */}
            <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-primary-fixed/20 blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md relative z-10">

                <div className="flex items-center gap-space-md">

                    {/* Ícono con indicador animado */}
                    <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-primary-container text-on-primary shadow-sm shrink-0">

            <span className="material-symbols-outlined text-[26px]">
              two_wheeler
            </span>

                        <span className="absolute top-0 right-0 w-3 h-3 bg-primary-fixed rounded-full animate-ping" />

                        <span className="absolute top-0 right-0 w-3 h-3 bg-primary-fixed rounded-full" />
                    </div>

                    {/* Información del pedido */}
                    <div className="flex flex-col">

                        <div className="flex items-center gap-space-xs flex-wrap">

              <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-primary">
                Pedido en curso
              </span>
                        </div>

                        <h2 className="font-title-md text-title-md text-on-surface">
                            Pedido #{pedido.id}{pedido.storeName ? ` de ${pedido.storeName}` : ""}
                        </h2>

                        <p className="font-body-md text-body-md text-on-surface-variant">
                            Seguí el estado actualizado en el inicio.
                        </p>
                    </div>
                </div>

                {/* Acceso al seguimiento */}
                <Link
                    to="/inicio"
                    className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-primary-container text-on-primary font-body-md-medium text-body-md-medium rounded-lg shadow-sm hover:opacity-95 transition-all"
                >

          <span>
            Seguir pedido
          </span>

                    <span className="material-symbols-outlined text-[18px]">
            near_me
          </span>
                </Link>
            </div>
        </div>
    )
}

export default ActiveOrderBanner