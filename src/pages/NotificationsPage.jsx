import { useState } from "react"

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
 */
const groups = [
    {
        id: "today",
        title: "Hoy",
        subtitle: "2 notificaciones recientes",
        highlight: true,
    },
    {
        id: "this-week",
        title: "Esta semana",
        subtitle: "• 2 registros",
    },
    {
        id: "older",
        title: "Anteriores",
        subtitle: "• Historial de cuenta",
    },
]

/*
 * Notificaciones iniciales.
 *
 * Cada notificación contiene:
 * - id: identificador único.
 * - group: grupo temporal al que pertenece.
 * - type: tipo usado por los filtros.
 * - read: indica si ya fue leída.
 * - icon / iconClass: ícono y sus colores.
 * - badge / badgeClass: etiqueta y sus colores.
 * - time, title, description: contenido visible.
 * - action: acción de la derecha { kind, label, icon? }.
 */
const initialNotifications = [
    {
        id: 1,
        group: "today",
        type: "order",
        read: false,
        icon: "two_wheeler",
        iconClass: "bg-primary-fixed/30 text-primary-container",
        badge: "En tránsito",
        badgeClass: "bg-primary-fixed text-on-primary-container",
        time: "Hace 6 minutos",
        title: "Tu pedido #AR-8942 está en camino",
        description:
            "El repartidor Matías G. está a 8 cuadras de tu domicilio en Av. Corrientes 1450. Tocá acá para ver el seguimiento en vivo en el mapa.",
        action: {
            kind: "link",
            label: "Ver mapa",
        },
    },
    {
        id: 2,
        group: "today",
        type: "promo",
        read: false,
        icon: "local_offer",
        iconClass: "bg-surface-container text-tertiary",
        badge: "Promoción Especial",
        badgeClass: "bg-surface-container-high text-on-surface",
        time: "Hace 2 horas",
        title: "25% de descuento en Pizzería Güerrín",
        /*
         * Como el archivo es .jsx, la descripción puede
         * incluir JSX para resaltar el cupón.
         */
        description: (
            <>
                Aprovechá hoy en tu cena el cupón{" "}
                <strong className="font-body-md-medium text-on-surface bg-surface-container-low px-1 rounded">
                    GUERRIN25
                </strong>{" "}
                en todas las pizzas grandes al molde.
            </>
        ),
        action: {
            kind: "button",
            label: "Pedir con descuento",
        },
    },
    {
        id: 3,
        group: "this-week",
        type: "order",
        read: true,
        icon: "task_alt",
        iconClass: "bg-surface-container text-primary-container",
        badge: "Entregado",
        badgeClass: "bg-surface-container-low text-secondary",
        time: "Ayer a las 21:40 hs",
        title: "Pedido #AR-8810 entregado con éxito",
        description:
            "Tu pedido de Sushiclub Recoleta fue entregado. ¡Dejanos tu reseña para ayudar a la comunidad!",
        action: {
            kind: "button",
            label: "Calificar pedido",
            icon: "star",
        },
    },
    {
        id: 4,
        group: "this-week",
        type: "system",
        read: true,
        icon: "shield",
        iconClass: "bg-surface-container text-secondary",
        badge: "Seguridad",
        badgeClass: "bg-surface-container-low text-secondary",
        time: "Martes 14:15 hs",
        title: "Nueva tarjeta de crédito vinculada",
        description:
            "Se agregó con éxito la tarjeta terminada en •••• 9012 a tu billetera DeliveryGo.",
        action: {
            kind: "verified",
            label: "Verificado",
        },
    },
    {
        id: 5,
        group: "older",
        type: "system",
        read: true,
        icon: "workspace_premium",
        iconClass: "bg-primary-fixed/20 text-primary",
        badge: "Membresía Activa",
        badgeClass: "bg-primary-fixed-dim/30 text-on-primary-fixed-variant",
        time: "Hace 2 semanas",
        title: "¡Bienvenido a DeliveryGo Prime!",
        description:
            "Tenés 30 días de envíos sin cargo en comercios seleccionados y beneficios exclusivos.",
        action: {
            kind: "text",
            label: "Ver beneficios Prime",
        },
    },
]

/**
 * Página del Centro de Notificaciones.
 *
 * Permite:
 * - Ver el pedido actualmente en tránsito.
 * - Filtrar notificaciones por tipo.
 * - Marcar una o todas las notificaciones como leídas.
 * - Alternar la vista de "estado vacío".
 */
function NotificationsPage() {

    /*
     * Lista de notificaciones.
     * Se guarda en estado porque el campo "read" puede cambiar.
     */
    const [notifications, setNotifications] = useState(initialNotifications)

    /*
     * Filtro seleccionado.
     * Valores posibles: "all", "order", "promo" o "system".
     */
    const [activeFilter, setActiveFilter] = useState("all")

    /*
     * Determina si se muestra la vista vacía
     * en lugar de la lista de notificaciones.
     */
    const [showEmpty, setShowEmpty] = useState(false)

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

    /**
     * Marca una notificación puntual como leída.
     */
    function markAsRead(id) {

        setNotifications((current) =>
            current.map((notification) =>
                notification.id === id
                    ? {
                        ...notification,
                        read: true,
                    }
                    : notification
            )
        )
    }

    /**
     * Marca todas las notificaciones como leídas.
     */
    function markAllAsRead() {

        setNotifications((current) =>
            current.map((notification) => ({
                ...notification,
                read: true,
            }))
        )
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

                            {/* Alternar estado vacío */}
                            <button
                                type="button"
                                onClick={() => setShowEmpty((current) => !current)}
                                className="inline-flex items-center gap-space-2xs px-space-sm py-space-xs bg-surface-container-lowest hover:bg-surface-container text-secondary font-caption-bold text-caption-bold rounded-lg transition-colors"
                            >

                <span className="material-symbols-outlined text-[18px]">
                  visibility
                </span>

                                <span>
                  {showEmpty ? "Ver lista de notificaciones" : "Ver estado vacío"}
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

                {/* Lista de notificaciones o estado vacío */}
                {showEmpty ? (

                    <EmptyState
                        onRestore={() => setShowEmpty(false)}
                    />

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
                                    subtitle={group.subtitle}
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