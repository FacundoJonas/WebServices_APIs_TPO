import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"

import { useAuth } from "../context/useAuth"
import { listarPedidos } from "../servicies/pedidosServicie.js"

import FilterTabs from "../components/notificationsPage/FilterTabs.jsx"
import OrderCard from "../components/ordersPage/OrderCard.jsx"
import OrderDetailPanel from "../components/ordersPage/OrderDetailPanel.jsx"
import ActiveOrderBanner from "../components/ordersPage/ActiveOrderBanner.jsx"
import { estadosEnCurso } from "../components/ordersPage/orderStatus.js"

/*
 * Filtros por estado. Cada uno indica qué estados pide al Módulo Pedidos.
 */
const filters = [
    { id: "todos", label: "Todos", estados: [] },
    { id: "en-curso", label: "En curso", estados: estadosEnCurso },
    { id: "entregados", label: "Entregados", estados: ["ENTREGADO"] },
    { id: "cancelados", label: "Cancelados", estados: ["CANCELADO"] },
]

const PAGE_SIZE = 4

/**
 * Página "Mis pedidos" (CU-07 · Consultar historial de pedidos).
 *
 * Lista los pedidos del usuario logueado con filtros por estado y
 * paginación, y muestra el detalle del pedido elegido en un panel lateral.
 * Respeta RN-06: solo se piden los pedidos del usuario de la sesión.
 *
 * Consume: GET /pedidos?usuarioId= (Módulo Pedidos).
 */
function OrdersPage() {

    const { usuario } = useAuth()
    const navigate = useNavigate()

    const [filter, setFilter] = useState("todos")
    const [page, setPage] = useState(0)

    /*
     * Respuesta paginada del Módulo Pedidos.
     */
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    /*
     * Se incrementa para volver a pedir los datos después de un error.
     */
    const [retryCount, setRetryCount] = useState(0)

    /*
     * Pedido que se muestra en el panel de detalle.
     */
    const [selected, setSelected] = useState(null)

    /*
     * Pide los pedidos cada vez que cambia el filtro, la página o se reintenta.
     * "ignore" evita guardar una respuesta vieja si el usuario cambió de filtro
     * antes de que llegara.
     */
    useEffect(() => {

        let ignore = false

        const estados = filters.find((f) => f.id === filter).estados

        listarPedidos(usuario?.id, { estados, page, size: PAGE_SIZE })
            .then((respuesta) => {
                if (!ignore) setData(respuesta)
            })
            .catch((e) => {
                if (!ignore) setError(e.message)
            })
            .finally(() => {
                if (!ignore) setLoading(false)
            })

        return () => {
            ignore = true
        }
    }, [usuario?.id, filter, page, retryCount])

    /**
     * Muestra el estado de carga antes de pedir otra vez los datos.
     */
    function startLoading() {
        setError("")
        setLoading(true)
    }

    function handleFilterChange(id) {
        if (id === filter) return
        startLoading()
        setFilter(id)
        setPage(0)
        setSelected(null)
    }

    function handlePageChange(nueva) {
        startLoading()
        setPage(nueva)
        setSelected(null)
    }

    function handleRetry() {
        startLoading()
        setRetryCount((n) => n + 1)
    }

    const pedidos = data?.content ?? []

    /*
     * El banner muestra el primer pedido en curso de la página actual.
     */
    const activo = pedidos.find((p) => estadosEnCurso.includes(p.estado))

    return (
        <main className="w-full pt-20 bg-background min-h-[calc(100vh-280px)]">

            <div className="flex flex-col w-full max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-xl gap-space-lg">

                {/* Breadcrumb */}
                <nav
                    aria-label="Breadcrumb"
                    className="flex items-center gap-space-xs text-secondary font-caption-sm text-caption-sm"
                >
                    <Link to="/inicio" className="hover:text-primary transition-colors">
                        Inicio
                    </Link>

                    <span className="material-symbols-outlined text-[14px] text-outline">
                        chevron_right
                    </span>

                    <span className="font-body-md-medium text-on-surface">
                        Mis pedidos
                    </span>
                </nav>

                {/* Título */}
                <div>
                    <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                        Mis pedidos
                    </h1>

                    <p className="font-body-md text-body-md text-on-surface-variant mt-space-2xs">
                        Revisá tus compras anteriores y su estado.
                    </p>
                </div>

                {activo && (
                    <ActiveOrderBanner
                        pedido={activo}
                        onTrack={() => setSelected(activo)}
                    />
                )}

                <FilterTabs
                    filters={filters}
                    active={filter}
                    onChange={handleFilterChange}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">

                    <section className={`flex flex-col gap-space-md ${selected ? "lg:col-span-7" : "lg:col-span-12"}`}>

                        {loading ? (

                            /* Carga: tarjetas esqueleto */
                            [1, 2, 3].map((n) => (
                                <div key={n} className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm animate-pulse flex flex-col gap-space-md">
                                    <div className="flex items-center gap-space-sm">
                                        <div className="w-12 h-12 rounded-xl bg-surface-container-high" />
                                        <div className="flex flex-col gap-space-xs">
                                            <div className="w-36 h-4 rounded bg-surface-container-high" />
                                            <div className="w-24 h-3 rounded bg-surface-container-high" />
                                        </div>
                                    </div>
                                    <div className="h-14 rounded-lg bg-surface-container-low" />
                                </div>
                            ))

                        ) : error ? (

                            /* Error: mensaje claro con reintento (RN-11) */
                            <div className="bg-surface-container-lowest rounded-xl p-space-2xl shadow-sm flex flex-col items-center text-center gap-space-md">

                                <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[36px]">wifi_off</span>
                                </div>

                                <div>
                                    <h2 className="font-title-md text-title-md text-on-surface">
                                        No pudimos cargar tus pedidos
                                    </h2>
                                    <p className="font-body-md text-body-md text-on-surface-variant">
                                        {error}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleRetry}
                                    className="px-space-lg py-2.5 rounded-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-body-md-medium text-body-md-medium shadow-sm transition-all flex items-center gap-space-xs"
                                >
                                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                                    Reintentar
                                </button>
                            </div>

                        ) : pedidos.length === 0 ? (

                            /* Vacío */
                            <div className="bg-surface-container-lowest rounded-xl p-space-2xl shadow-sm flex flex-col items-center text-center gap-space-md">

                                <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-[44px]">receipt_long</span>
                                </div>

                                <div>
                                    <h2 className="font-title-md text-title-md text-on-surface">
                                        {filter === "todos" ? "Todavía no hiciste ningún pedido" : "No hay pedidos con este estado"}
                                    </h2>
                                    <p className="font-body-md text-body-md text-on-surface-variant">
                                        Cuando compres algo, vas a poder seguirlo desde acá.
                                    </p>
                                </div>

                                <Link
                                    to="/inicio"
                                    className="px-space-xl py-2.5 rounded-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-body-md-medium text-body-md-medium shadow-sm transition-all flex items-center gap-space-xs"
                                >
                                    <span className="material-symbols-outlined text-[20px]">storefront</span>
                                    Explorar comercios
                                </Link>
                            </div>

                        ) : (
                            <>
                                {pedidos.map((pedido) => (
                                    <OrderCard
                                        key={pedido.id}
                                        pedido={pedido}
                                        selected={selected?.id === pedido.id}
                                        onSelect={() => setSelected(pedido)}
                                        onRate={() => navigate("/pedido", { state: { pedidoId: pedido.id } })}
                                        onReorder={() => navigate("/comercio")}
                                    />
                                ))}

                                {/* Paginación */}
                                {data.totalPages > 1 && (
                                    <nav aria-label="Páginas" className="flex items-center justify-center gap-space-xs py-space-sm">

                                        <button
                                            type="button"
                                            disabled={page === 0}
                                            onClick={() => handlePageChange(page - 1)}
                                            className="px-space-md py-space-xs rounded-full bg-surface-container-lowest hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium shadow-sm transition-colors flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                            Anterior
                                        </button>

                                        {Array.from({ length: data.totalPages }, (_, n) => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => handlePageChange(n)}
                                                aria-current={n === page ? "page" : undefined}
                                                className={`w-10 h-10 rounded-full font-body-md-medium text-body-md-medium transition-colors
                                                    ${n === page ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest hover:bg-surface-container text-on-surface"}`}
                                            >
                                                {n + 1}
                                            </button>
                                        ))}

                                        <button
                                            type="button"
                                            disabled={page >= data.totalPages - 1}
                                            onClick={() => handlePageChange(page + 1)}
                                            className="px-space-md py-space-xs rounded-full bg-surface-container-lowest hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium shadow-sm transition-colors flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
                                        >
                                            Siguiente
                                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                        </button>
                                    </nav>
                                )}
                            </>
                        )}
                    </section>

                    {selected && (
                        <div className="lg:col-span-5">
                            <OrderDetailPanel
                                pedido={selected}
                                onClose={() => setSelected(null)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}

export default OrdersPage
