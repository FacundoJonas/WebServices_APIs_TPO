import { useEffect, useState } from "react"
import { Link } from "react-router"

import { obtenerTablero } from "../servicies/analiticaServicie.js"

import MetricCard from "../components/metricsPage/MetricCard.jsx"
import StatusBars from "../components/metricsPage/StatusBars.jsx"
import RankingTable from "../components/metricsPage/RankingTable.jsx"
import PaymentsDonut from "../components/metricsPage/PaymentsDonut.jsx"
import PeriodSelector from "../components/metricsPage/PeriodSelector.jsx"
import OrdersLineChart from "../components/metricsPage/OrdersLineChart.jsx"
import {
    aIso,
    formatearFechaCorta,
    formatearMillones,
    formatearNumero,
    formatearPorcentaje,
} from "../components/metricsPage/format.js"

/*
 * Atajos de período.
 */
const presets = [
    { id: "hoy", label: "Hoy" },
    { id: "7", label: "7 días" },
    { id: "30", label: "30 días" },
    { id: "mes", label: "Este mes" },
]

/**
 * Devuelve { desde, hasta } para un atajo de período.
 */
function rangoDePreset(id) {

    const hoy = new Date()
    const desde = new Date(hoy)

    if (id === "7") desde.setDate(hoy.getDate() - 6)
    if (id === "30") desde.setDate(hoy.getDate() - 29)
    if (id === "mes") desde.setDate(1)

    return { desde: aIso(desde), hasta: aIso(hoy) }
}

/*
 * Columnas de las tablas de ranking.
 */
const estrella = (row) => (
    <span className="inline-flex items-center gap-0.5 font-body-md-medium text-body-md-medium">
        <span className="text-primary">★</span> {row.rating}
    </span>
)

const columnasComercios = [
    { key: "nombre", label: "Comercio" },
    { key: "pedidos", label: "Pedidos", align: "right", render: (row) => formatearNumero(row.pedidos) },
    { key: "rating", label: "Rating", align: "center", render: estrella },
    { key: "tiempoMedio", label: "Tiempo medio", align: "right", render: (row) => `${row.tiempoMedio} min` },
]

const columnasRepartidores = [
    { key: "nombre", label: "Repartidor" },
    { key: "entregas", label: "Entregas", align: "right", render: (row) => formatearNumero(row.entregas) },
    { key: "rating", label: "Rating", align: "center", render: estrella },
]

/**
 * Descarga los pedidos por día del período como CSV.
 */
function exportarCsv(tablero) {

    const filas = [
        "fecha,pedidos",
        ...tablero.pedidos.porDia.map((d) => `${d.fecha},${d.cantidad}`),
    ]

    const blob = new Blob([filas.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `metricas_${tablero.periodo.desde}_${tablero.periodo.hasta}.csv`
    link.click()

    URL.revokeObjectURL(url)
}

/**
 * Página "Métricas del ecosistema" (CU-10 · Visualizar métricas administrativas).
 *
 * Solo accede el rol ADMIN (RN-10, ver AdminRoute). Cada tarjeta indica
 * su fuente y período (RN-09). Si una fuente falla, solo esa tarjeta
 * muestra el error y el resto del tablero sigue visible (RN-11).
 *
 * Consume: GET /api/v1/analytics/dashboard (Módulo Opiniones y Analítica).
 */
function MetricsPage() {

    const [preset, setPreset] = useState("30")
    const [rango, setRango] = useState(() => rangoDePreset("30"))

    const [tablero, setTablero] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    /*
     * Se incrementa para volver a pedir el tablero.
     */
    const [retryCount, setRetryCount] = useState(0)

    /*
     * Pide el tablero cada vez que cambia el período o se reintenta.
     * "ignore" evita guardar la respuesta de un período anterior.
     */
    useEffect(() => {

        let ignore = false

        obtenerTablero(rango.desde, rango.hasta)
            .then((respuesta) => {
                if (!ignore) setTablero(respuesta)
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
    }, [rango, retryCount])

    /**
     * Muestra el estado de carga antes de pedir otra vez el tablero.
     */
    function startLoading() {
        setError("")
        setLoading(true)
    }

    function handlePreset(id) {
        startLoading()
        setPreset(id)
        setRango(rangoDePreset(id))
    }

    function handleRange(desde, hasta) {
        startLoading()
        setPreset("")
        setRango({ desde, hasta })
    }

    function retry() {
        startLoading()
        setRetryCount((n) => n + 1)
    }

    const periodo = `${formatearFechaCorta(rango.desde)} – ${formatearFechaCorta(rango.hasta)}`

    const { pedidos, pagos, opiniones, topComercios, topRepartidores } = tablero ?? {}

    const entregados = pedidos?.porEstado.find((e) => e.estado === "ENTREGADO")?.cantidad ?? 0

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
                        Métricas
                    </span>

                    <span className="ml-space-xs inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-primary text-on-primary font-caption-bold text-caption-bold">
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        ADMIN
                    </span>
                </nav>

                {/* Título y período */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">

                    <div>
                        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                            Métricas del ecosistema
                        </h1>

                        <p className="font-body-md text-body-md text-on-surface-variant mt-space-2xs">
                            Pedidos, pagos y satisfacción de clientes en el período elegido.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm flex-wrap">

                        <PeriodSelector
                            presets={presets}
                            activePreset={preset}
                            desde={rango.desde}
                            hasta={rango.hasta}
                            onPreset={handlePreset}
                            onRange={handleRange}
                        />

                        <button
                            type="button"
                            disabled={!tablero || loading}
                            onClick={() => exportarCsv(tablero)}
                            className="px-space-md py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                        >
                            <span className="material-symbols-outlined text-[20px] text-primary">download</span>
                            Exportar CSV
                        </button>
                    </div>
                </div>

                {loading ? (

                    /* Carga: tarjetas esqueleto */
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="h-40 rounded-xl bg-surface-container-lowest shadow-sm animate-pulse p-space-lg flex flex-col gap-space-md">
                                <div className="w-32 h-4 rounded bg-surface-container-high" />
                                <div className="w-24 h-10 rounded bg-surface-container-high" />
                                <div className="w-40 h-3 rounded bg-surface-container-high" />
                            </div>
                        ))}
                    </div>

                ) : error ? (

                    /* Error general: no respondió el Módulo Analítica */
                    <div className="bg-surface-container-lowest rounded-xl p-space-2xl shadow-sm flex flex-col items-center text-center gap-space-md">

                        <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                            <span className="material-symbols-outlined text-[36px]">cloud_off</span>
                        </div>

                        <div>
                            <h2 className="font-title-md text-title-md text-on-surface">
                                No pudimos cargar las métricas
                            </h2>
                            <p className="font-body-md text-body-md text-on-surface-variant">
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={retry}
                            className="px-space-lg py-2.5 rounded-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-body-md-medium text-body-md-medium shadow-sm transition-all flex items-center gap-space-xs"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            Reintentar
                        </button>
                    </div>

                ) : (
                    <>
                        {/* KPIs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg">

                            <MetricCard title="Pedidos totales" icon="shopping_basket" fuente={pedidos.fuente} periodo={periodo} error={pedidos.error} onRetry={retry}>
                                {!pedidos.error && (
                                    <div className="flex items-baseline gap-space-xs">
                                        <span className="font-display-hero text-display-hero text-on-surface">
                                            {formatearNumero(pedidos.total)}
                                        </span>
                                        <span className="font-caption-bold text-caption-bold text-primary px-1.5 py-0.5 rounded-full bg-primary/10">
                                            ▲ {pedidos.variacion.toLocaleString("es-AR")}%
                                        </span>
                                    </div>
                                )}
                            </MetricCard>

                            <MetricCard title="Pedidos entregados" icon="task_alt" fuente={pedidos.fuente} periodo={periodo} error={pedidos.error} onRetry={retry}>
                                {!pedidos.error && (
                                    <div className="flex items-baseline gap-space-xs">
                                        <span className="font-display-hero text-display-hero text-on-surface">
                                            {formatearNumero(entregados)}
                                        </span>
                                        <span className="font-title-md text-title-md text-on-surface-variant">
                                            ({formatearPorcentaje(entregados, pedidos.total)})
                                        </span>
                                    </div>
                                )}
                            </MetricCard>

                            <MetricCard title="Facturación aprobada" icon="payments" fuente={pagos.fuente} periodo={periodo} error={pagos.error} onRetry={retry}>
                                {!pagos.error && (
                                    <div className="flex items-baseline gap-space-xs">
                                        <span className="font-display-hero text-display-hero text-on-surface">
                                            {formatearMillones(pagos.facturacion)}
                                        </span>
                                        <span className="font-caption-bold text-caption-bold text-primary px-1.5 py-0.5 rounded-full bg-primary/10">
                                            ▲ {pagos.variacion.toLocaleString("es-AR")}%
                                        </span>
                                    </div>
                                )}
                            </MetricCard>

                            <MetricCard title="Calificación promedio" icon="star" fuente={opiniones.fuente} periodo={periodo} error={opiniones.error} onRetry={retry}>
                                {!opiniones.error && (
                                    <div>
                                        <span className="font-display-hero text-display-hero text-on-surface">
                                            ★ {opiniones.promedio.toLocaleString("es-AR")}
                                        </span>
                                        <p className="font-caption-sm text-caption-sm text-on-surface-variant">
                                            Sobre {formatearNumero(opiniones.resenas)} reseñas
                                        </p>
                                    </div>
                                )}
                            </MetricCard>
                        </div>

                        {/* Gráficos */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">

                            <MetricCard
                                className="lg:col-span-8"
                                title="Pedidos por día"
                                subtitle="Evolución diaria en el período"
                                icon="show_chart"
                                fuente={pedidos.fuente}
                                periodo={periodo}
                                error={pedidos.error}
                                onRetry={retry}
                            >
                                {!pedidos.error && <OrdersLineChart porDia={pedidos.porDia} />}
                            </MetricCard>

                            <MetricCard
                                className="lg:col-span-4"
                                title="Pedidos por estado"
                                subtitle="Distribución de estados registrados"
                                icon="donut_small"
                                fuente={pedidos.fuente}
                                periodo={periodo}
                                error={pedidos.error}
                                onRetry={retry}
                            >
                                {!pedidos.error && <StatusBars porEstado={pedidos.porEstado} />}
                            </MetricCard>

                            <MetricCard
                                className="lg:col-span-5"
                                title="Aprobación vs. rechazo de pagos"
                                subtitle="Resultado de las operaciones de pago"
                                icon="credit_card"
                                fuente={pagos.fuente}
                                periodo={periodo}
                                error={pagos.error}
                                onRetry={retry}
                            >
                                {!pagos.error && <PaymentsDonut pagos={pagos} />}
                            </MetricCard>

                            <MetricCard
                                className="lg:col-span-7"
                                title="Top comercios"
                                subtitle="Más pedidos en el período"
                                icon="storefront"
                                fuente={topComercios.fuente}
                                periodo={periodo}
                                error={topComercios.error}
                                onRetry={retry}
                            >
                                {!topComercios.error && <RankingTable columns={columnasComercios} rows={topComercios.items} />}
                            </MetricCard>

                            <MetricCard
                                className="lg:col-span-12"
                                title="Top repartidores"
                                subtitle="Más entregas completadas y mejor calificación"
                                icon="two_wheeler"
                                fuente={topRepartidores.fuente}
                                periodo={periodo}
                                error={topRepartidores.error}
                                onRetry={retry}
                            >
                                {!topRepartidores.error && <RankingTable columns={columnasRepartidores} rows={topRepartidores.items} />}
                            </MetricCard>
                        </div>
                    </>
                )}
            </div>
        </main>
    )
}

export default MetricsPage
