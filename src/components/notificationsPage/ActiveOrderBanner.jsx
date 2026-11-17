import { useEffect, useState } from "react"
import { Link } from "react-router"

import { useAuth } from "../../context/useAuth"
import { buscarPedidoEnCurso, obtenerPedido } from "../../servicies/pedidosServicie"
import { ESTADOS_FINALES } from "../homePage/seguimientoPedido.js"

/*
 * Texto de cada estado del contrato de Pedidos.
 */
const ESTADO = {
    BORRADOR: "Esperando el pago",
    CONFIRMADO: "Confirmado",
    EN_PREPARACION: "En preparación",
    EN_CAMINO: "En camino",
}

/**
 * Banner superior con el pedido en curso (CU-05).
 *
 * Es el mismo pedido que sigue el Home: buscarPedidoEnCurso se lo pregunta a
 * Pedidos y después se trae con GET /api/v1/orders/{id}. Si no hay pedido en
 * curso, o ya se entregó o canceló, no se muestra.
 */
function ActiveOrderBanner() {

    const { usuario } = useAuth()

    const [pedido, setPedido] = useState(null)
    const [storeName, setStoreName] = useState("")

    useEffect(() => {

        let ignore = false

        buscarPedidoEnCurso(usuario?.id)
            .then(async (enCurso) => {
                if (ignore || !enCurso) return
                const respuesta = await obtenerPedido(enCurso.id, usuario?.id)
                if (ignore) return
                setStoreName(enCurso.storeName)
                setPedido(respuesta)
            })
            .catch(() => {
                // Sin pedido para mostrar: el banner simplemente no aparece.
                if (!ignore) setPedido(null)
            })

        return () => {
            ignore = true
        }
    }, [usuario?.id])

    if (!pedido || ESTADOS_FINALES.includes(pedido.estado)) {
        return null
    }

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

                        <span className="font-caption-bold text-caption-bold uppercase tracking-wider text-primary">
                            {ESTADO[pedido.estado] ?? pedido.estado}
                        </span>

                        <h2 className="font-title-md text-title-md text-on-surface">
                            Pedido #{String(pedido.id).slice(0, 8)}
                            {storeName && ` de ${storeName}`}
                        </h2>

                        <p className="font-body-md text-body-md text-on-surface-variant">
                            Total $ {Number(pedido.total ?? 0).toLocaleString("es-AR")}
                        </p>
                    </div>
                </div>

                {/* El seguimiento del pedido está en el Home */}
                <Link
                    to="/inicio"
                    className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-primary-container text-on-primary font-body-md-medium text-body-md-medium rounded-lg shadow-sm hover:opacity-95 transition-all"
                >
                    <span>
                        Ver seguimiento
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
