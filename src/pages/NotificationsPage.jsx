import { useState, useEffect } from "react"

import { useAuth } from "../context/useAuth"
import {
    listarNotificacionesDeUsuario,
    marcarNotificacionLeida,
} from "../servicies/notificacionesServicie.js"

import InfoTile from "../components/notificationsPage/InfoTile.jsx"
import FilterTabs from "../components/notificationsPage/FilterTabs.jsx"
import EmptyState from "../components/notificationsPage/EmptyState.jsx"
import NotificationGroup from "../components/notificationsPage/NotificationGroup.jsx"
import ActiveOrderBanner from "../components/notificationsPage/ActiveOrderBanner.jsx"

/*
 * Filtros disponibles.
 *
 * El id coincide con el campo "type" de cada notificación.
 * "all" muestra todas.
 */
const filters = [
    {
        id: "all",
        label: "Todas",
    },
    {
        id: "order",
        label: "Pedidos",
    },
    {
        id: "promo",
        label: "Promociones",
    },
    {
        id: "system",
        label: "Sistema",
    },
]

/*
 * Grupos temporales en los que se dividen las notificaciones.
 * El servicio asigna "group" según la fecha de cada notificación.
 */
const groups = [
    {
        id: "today",
        title: "Hoy",
        highlight: true,
    },
    {
        id: "this-week",
        title: "Esta semana",
    },
    {
        id: "older",
        title: "Anteriores",
    },
]

/**
 * Página del Centro de Notificaciones.
 *
 * Permite:
 * - Ver el pedido actualmente en tránsito.
 * - Filtrar notificaciones por tipo.
 * - Marcar una o todas las notificaciones como leídas.
 *
 * Los datos vienen del Módulo Notificaciones (006) a través de
 * notificacionesServicie.js, que ya los entrega con la forma de la tarjeta.
 */
function NotificationsPage() {

    const { usuario } = useAuth()

    /*
     * Lista de notificaciones (ya traducidas por el servicio).
     * Se guarda en estado porque el campo "read" puede cambiar.
     */
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    /*
     * Se incrementa para volver a pedir las notificaciones.
     */
    const [retryCount, setRetryCount] = useState(0)

    /*
     * Pide el historial del usuario al montar la página y en cada reintento.
     * "ignore" evita guardar la respuesta si la página se desmontó antes.
     */
    useEffect(() => {

        let ignore = false

        listarNotificacionesDeUsuario(usuario?.id)
            .then((lista) => {
                if (!ignore) setNotifications(lista)
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
    }, [usuario?.id, retryCount])

    function handleRetry() {
        setError("")
        setLoading(true)
        setRetryCount((n) => n + 1)
    }

    /*
     * Filtro seleccionado.
     * Valores posibles: "all", "order", "promo" o "system".
     */
    const [activeFilter, setActiveFilter] = useState("all")

    /*
     * Cantidad de notificaciones sin leer.
     * Se calcula a partir del estado, no se guarda aparte.
     */
    const unreadCount = notifications.filter(
        (notification) => !notification.read
    ).length

    /*
     * Notificaciones que cumplen con el filtro activo.
     */
    const filteredNotifications = notifications.filter(
        (notification) =>
            activeFilter === "all" || notification.type === activeFilter
    )

    /*
     * Cambia "read" en la lista local (sin volver a pedir todo).
     */
    function setRead(ids, read) {
        setNotifications((current) =>
            current.map((notification) =>
                ids.includes(notification.id) ? { ...notification, read } : notification
            )
        )
    }

    /**
     * Marca una notificación como leída (CU-10 del 006).
     *
     * Actualización optimista: se marca en pantalla enseguida y se avisa
     * al 006. Si el 006 falla, se vuelve atrás.
     */
    function markAsRead(id) {

        const notification = notifications.find((n) => n.id === id)

        if (!notification || notification.read) return

        setRead([id], true)

        marcarNotificacionLeida(id).catch((e) => {
            console.error(e)
            setRead([id], false)
        })
    }

    /**
     * Marca todas las no leídas. Se envían todas a la vez y se vuelven
     * atrás solo las que fallaron.
     */
    async function markAllAsRead() {

        const ids = notifications.filter((n) => !n.read).map((n) => n.id)

        setRead(ids, true)

        const resultados = await Promise.allSettled(ids.map((id) => marcarNotificacionLeida(id)))

        const fallidas = ids.filter((_, i) => resultados[i].status === "rejected")

        if (fallidas.length > 0) setRead(fallidas, false)
    }

    return (
        <main className="w-full pt-20 bg-background min-h-[calc(100vh-280px)]">

            {/* Contenedor principal de la página */}
            <div className="flex flex-col w-full max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-xl space-y-space-xl">

                {/* Pedido activo */}
                <ActiveOrderBanner />

                {/* Encabezado, acciones y filtros */}
                <div className="flex flex-col gap-space-lg">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">

                        {/* Título y contador de no leídas */}
                        <div className="flex items-center gap-space-sm flex-wrap">

                            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                                Centro de Notificaciones
                            </h1>

                            <span
                                className={`inline-flex items-center px-space-sm py-1 font-caption-bold text-caption-bold rounded-full shadow-sm
                  ${unreadCount > 0 ? "bg-primary-fixed text-on-primary-container" : "bg-surface-container text-secondary"}`}
                            >
                {unreadCount} nuevas
              </span>
                        </div>

                        {/* Acciones generales */}
                        <div className="flex items-center gap-space-xs flex-wrap">

                            {/* Marcar todas como leídas */}
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                disabled={unreadCount === 0}
                                className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md-medium text-body-md-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-default"
                            >

                <span className="material-symbols-outlined text-primary-container text-[20px]">
                  {unreadCount === 0 ? "check" : "done_all"}
                </span>

                                <span>
                  {unreadCount === 0 ? "Todas leídas" : "Marcar todas como leídas"}
                </span>
                            </button>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">

                        <FilterTabs
                            filters={filters}
                            active={activeFilter}
                            onChange={setActiveFilter}
                        />

                        <div className="flex items-center gap-space-xs text-secondary font-caption-sm text-caption-sm self-end sm:self-center">

              <span className="material-symbols-outlined text-[16px] text-primary">
                tune
              </span>

                            <span>
                Mostrando actividad reciente
              </span>
                        </div>
                    </div>
                </div>

                {/* Carga, error, vacío o lista */}
                {loading ? (

                    <div className="flex flex-col gap-space-md">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-24 rounded-xl bg-surface-container-lowest shadow-sm animate-pulse" />
                        ))}
                    </div>

                ) : error ? (

                    <div role="alert" className="flex flex-col items-center text-center gap-space-md py-space-2xl rounded-xl bg-surface-container-lowest shadow-sm">

                        <span className="material-symbols-outlined text-[40px] text-error">
                            cloud_off
                        </span>

                        <p className="font-body-lg text-body-lg text-on-surface-variant">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={handleRetry}
                            className="px-space-lg py-space-xs rounded-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-body-md-medium text-body-md-medium transition-all flex items-center gap-space-xs"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            Reintentar
                        </button>
                    </div>

                ) : notifications.length === 0 ? (

                    <EmptyState onRestore={handleRetry} />

                ) : (

                    <div className="flex flex-col gap-space-2xl">

                        {/*
             * Un grupo por período.
             * Si no tiene notificaciones con el filtro actual, no se muestra.
             */}
                        {groups.map((group) => {

                            const groupNotifications = filteredNotifications.filter(
                                (notification) => notification.group === group.id
                            )

                            if (groupNotifications.length === 0) {
                                return null
                            }

                            return (
                                <NotificationGroup
                                    key={group.id}
                                    title={group.title}
                                    subtitle={`${groupNotifications.length} ${groupNotifications.length === 1 ? "notificación" : "notificaciones"}`}
                                    highlight={group.highlight}
                                    notifications={groupNotifications}
                                    onRead={markAsRead}
                                />
                            )
                        })}

                        {/* Resumen de configuración */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">

                            <InfoTile
                                icon="notifications_active"
                                iconColor="text-primary-container"
                                title="Notificaciones push"
                                subtitle="Activadas en este navegador"
                            />

                            <InfoTile
                                icon="mail"
                                iconColor="text-tertiary"
                                title="Resumen semanal"
                                subtitle="Enviado a l.martinez@gmail.com"
                            />

                            <InfoTile
                                icon="tune"
                                iconColor="text-primary"
                                title="Preferencias de aviso"
                                subtitle="Personalizar alertas"
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}

export default NotificationsPage