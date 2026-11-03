import { useEffect, useState } from "react"
import { useAuth } from "../context/useAuth"
import { obtenerComercios } from "../servicies/catalogoServicie.js"
import FilterBar from "../components/homePage/FilterBar.jsx"
import StoreCard from "../components/homePage/StoreCard.jsx"
import PrimeBanner from "../components/homePage/PrimeBanner.jsx"
import WelcomeHeader from "../components/homePage/WelcomeHeader.jsx"
import CategoryChips from "../components/homePage/CategoryChips.jsx"
import ActiveOrderCard from "../components/homePage/ActiveOrderCard.jsx"

import courierImage from "../assets/matias.png"

/*
 * Imágenes temporales.
 *
 * Se utiliza el logo de DeliveryGo como reemplazo
 * hasta contar con las imágenes definitivas de cada comercio y del mapa.
 */
import placeholderImage from "../assets/deliverygo_logo.png"

/*
 * Cupón destacado en el encabezado.
 */
const welcomeCoupon = {
    label: "Cupón bienvenida",
    title: "25% OFF en tu pedido",
}

/*
 * Pedido actualmente en curso.
 *
 * steps[].status puede ser:
 * "done"    -> paso completado.
 * "current" -> paso actual (con animación).
 * "pending" -> paso todavía no alcanzado.
 */
const activeOrder = {
    id: "AR-8942",
    storeName: "La Birra Bar",
    etaLabel: "Llega entre 20:45 y 21:00 hs (~15 min)",
    progress: 72,
    steps: [
        {
            id: "confirmed",
            label: "Confirmado",
            time: "20:12 hs",
            icon: "check",
            status: "done",
        },
        {
            id: "preparing",
            label: "En preparación",
            time: "20:25 hs",
            icon: "check",
            status: "done",
        },
        {
            id: "on-the-way",
            label: "En camino",
            time: "En tránsito",
            icon: "two_wheeler",
            status: "current",
        },
        {
            id: "delivered",
            label: "Entregado",
            time: "Pendiente",
            icon: "home",
            status: "pending",
        },
    ],
    courier: {
        name: "Matías G.",
        rating: 4.9,
        image: courierImage,
        vehicle: "Moto Honda Wave (Casco negro) • Valija térmica #42",
    },
    mapImage: placeholderImage,
    distanceLabel: "A 8 cuadras de tu domicilio",
    trackingPath: "/pedido",
}

/*
 * Categorías gastronómicas.
 * El id coincide con el campo "category" de cada comercio.
 */
const categories = [
    { id: "all", label: "Todos", icon: "restaurant" },
    { id: "burgers", label: "Hamburguesas", icon: "lunch_dining" },
    { id: "pizza", label: "Pizza", icon: "local_pizza" },
    { id: "sushi", label: "Sushi", icon: "set_meal" },
    { id: "healthy", label: "Saludable & Bowls", icon: "eco" },
    { id: "desserts", label: "Postres & Helados", icon: "icecream" },
    { id: "coffee", label: "Cafetería", icon: "coffee" },
    { id: "empanadas", label: "Empanadas", icon: "bakery_dining" },
]

/*
 * Filtros rápidos. Se pueden combinar entre sí.
 */
const quickFilters = [
    {
        id: "fast",
        label: "Menos de 30 min",
        icon: "timer",
        iconClass: "text-primary-container",
    },
    {
        id: "top-rated",
        label: "Calificación 4.5+",
        icon: "star",
        iconClass: "text-amber-500",
        filled: true,
    },
    {
        id: "free-shipping",
        label: "Envío gratis",
        icon: "local_shipping",
        iconClass: "text-primary",
    },
]

/*
 * Opciones del selector "Ordenar por".
 */
const sortOptions = [
    { value: "popular", label: "Más populares" },
    { value: "rating", label: "Mejor puntuados" },
    { value: "delivery_time", label: "Menor tiempo de entrega" },
    { value: "price_delivery", label: "Costo de envío" },
]

/*
 * Funciones de comparación para cada tipo de orden.
 * "popular" respeta el orden original del arreglo.
 */
const compareStores = {
    popular: () => 0,
    rating: (a, b) => b.rating - a.rating,
    delivery_time: (a, b) => a.deliveryTime.min - b.deliveryTime.min,
    price_delivery: (a, b) => a.shippingCost - b.shippingCost,
}

/*
 * Información del plan Prime.
 */
const primePlan = {
    price: 1499,
    description: "Envíos gratis ilimitados en compras mayores a $6.000 y promociones exclusivas cada jueves.",
    ctaLabel: "Probar 30 días gratis",
}

/**
 * Página de posición global (inicio) de DeliveryGo.
 *
 * Permite:
 * - Ver y cambiar la dirección de entrega.
 * - Seguir el pedido en curso.
 * - Filtrar comercios por categoría y filtros rápidos.
 * - Ordenar los comercios.
 * - Marcar comercios como favoritos.
 */
function HomePage() {

    /*
    * Datos del usuario logueado (se guardan al iniciar sesión).
    */
    const { token, usuario } = useAuth()

    const direccionPrincipal = usuario?.direcciones?.[0]

    /*
     * Dirección de entrega actual.
     */
    const [address, setAddress] = useState(
        direccionPrincipal
            ? `${direccionPrincipal.calle}, ${direccionPrincipal.barrio}, ${direccionPrincipal.ciudad}`
            : ""
    )

    /*
     * Categoría seleccionada. "all" muestra todas.
     */
    const [activeCategory, setActiveCategory] = useState("all")

    /*
     * ids de los filtros rápidos activos.
     *
     * Ejemplo:
     * ["fast", "free-shipping"]
     */
    const [activeFilters, setActiveFilters] = useState([])

    /*
     * Criterio de orden seleccionado.
     */
    const [sortBy, setSortBy] = useState("popular")

    /*
     * ids de los comercios marcados como favoritos.
     */
    const [favorites, setFavorites] = useState([])

    /*
     * Comercios que devuelve el Módulo Catálogo (GET /api/v1/catalog).
     */
    const [stores, setStores] = useState([])
    const [loadingStores, setLoadingStores] = useState(true)
    const [storesError, setStoresError] = useState("")

    /*
     * Aumenta cada vez que el usuario toca "Reintentar".
     * Al cambiar, el useEffect vuelve a pedir los comercios.
     */
    const [retryCount, setRetryCount] = useState(0)

    /*
     * Pide los comercios al montar la página y en cada reintento.
     *
     * "ignore" evita actualizar el estado si la página se desmontó
     * antes de que llegue la respuesta.
     */
    useEffect(() => {

        let ignore = false

        obtenerComercios()
            .then((data) => {
                if (!ignore) setStores(data)
            })
            .catch((error) => {
                if (!ignore) setStoresError(error.message)
            })
            .finally(() => {
                if (!ignore) setLoadingStores(false)
            })

        return () => {
            ignore = true
        }
    }, [retryCount])

    /**
     * Vuelve a pedir los comercios después de un error.
     */
    function handleRetry() {
        setStoresError("")
        setLoadingStores(true)
        setRetryCount((current) => current + 1)
    }

    /**
     * Activa o desactiva un filtro rápido.
     */
    function toggleFilter(id) {

        setActiveFilters((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        )
    }

    /**
     * Agrega o quita un comercio de favoritos.
     */
    function toggleFavorite(id) {

        setFavorites((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        )
    }

    /**
     * Pide una nueva dirección y la guarda si no está vacía.
     *
     * TODO: reemplazar el prompt por un modal propio.
     */
    function handleChangeAddress() {

        const newAddress = window.prompt("Ingresá tu nueva dirección de entrega:", address)

        if (newAddress && newAddress.trim() !== "") {
            setAddress(newAddress.trim())
        }
    }

    /*
     * Comercios que cumplen con la categoría y los filtros activos,
     * ordenados según sortBy.
     *
     * filter devuelve un arreglo nuevo, por eso sort
     * no modifica el arreglo original "stores".
     */
    const visibleStores = stores
        .filter((store) => activeCategory === "all" || store.category === activeCategory)
        .filter((store) => !activeFilters.includes("fast") || store.deliveryTime.min < 30)
        .filter((store) => !activeFilters.includes("top-rated") || store.rating >= 4.5)
        .filter((store) => !activeFilters.includes("free-shipping") || store.shippingCost === 0)
        .sort(compareStores[sortBy])

    return (
        <main className="w-full pt-20 bg-background min-h-[calc(100vh-280px)]">

            {/* Contenedor principal de la página */}
            <div className="flex flex-col w-full max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-lg space-y-space-xl">

                {/* Saludo, dirección y cupón */}
                <WelcomeHeader
                    userName={usuario?.nombre}
                    address={address}
                    onChangeAddress={handleChangeAddress}
                    coupon={welcomeCoupon}
                />

                {/* Pedido en curso */}
                {token && ( <ActiveOrderCard order={activeOrder} /> )}

                {/* Categorías y filtros */}
                <section className="space-y-space-md">

                    <CategoryChips
                        categories={categories}
                        active={activeCategory}
                        onChange={setActiveCategory}
                    />

                    <FilterBar
                        filters={quickFilters}
                        activeFilters={activeFilters}
                        onToggleFilter={toggleFilter}
                        sortOptions={sortOptions}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                    />
                </section>

                {/* Grilla de comercios */}
                <section className="space-y-space-md">

                    <div className="flex items-baseline justify-between">

                        <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                            Comercios destacados cerca de vos
                        </h2>

                        {!loadingStores && !storesError && (
                            <span className="font-caption-bold text-caption-bold text-secondary">
                                {visibleStores.length} disponibles en {direccionPrincipal?.barrio ?? "tu zona"}
                            </span>
                        )}
                    </div>

                    {loadingStores ? (

                        /* Cargando: tarjetas vacías mientras llega la respuesta */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">

                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    key={item}
                                    className="h-72 rounded-xl bg-surface-container-low animate-pulse"
                                />
                            ))}
                        </div>

                    ) : storesError ? (

                        /* Error al consultar el Módulo Catálogo */
                        <div
                            role="alert"
                            className="flex flex-col items-center text-center py-space-2xl rounded-xl bg-surface-container-lowest shadow-sm"
                        >

                            <span className="material-symbols-outlined text-[40px] text-error mb-space-xs">
                                cloud_off
                            </span>

                            <p className="font-body-lg text-body-lg text-on-surface-variant mb-space-md">
                                {storesError}
                            </p>

                            <button
                                type="button"
                                onClick={handleRetry}
                                className="h-11 px-space-lg rounded-lg bg-primary-container hover:bg-surface-tint text-on-primary font-body-md-medium text-body-md-medium transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    refresh
                                </span>
                                Reintentar
                            </button>
                        </div>

                    ) : visibleStores.length > 0 ? (

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">

                            {visibleStores.map((store) => (
                                <StoreCard
                                    key={store.id}
                                    store={store}
                                    isFavorite={favorites.includes(store.id)}
                                    onToggleFavorite={() => toggleFavorite(store.id)}
                                />
                            ))}
                        </div>

                    ) : (

                        /* Sin resultados para los filtros elegidos */
                        <div className="flex flex-col items-center text-center py-space-2xl rounded-xl bg-surface-container-lowest shadow-sm">

                            <span className="material-symbols-outlined text-[40px] text-secondary mb-space-xs">
                                search_off
                            </span>

                            <p className="font-body-lg text-body-lg text-on-surface-variant">
                                No encontramos comercios con esos filtros.
                            </p>
                        </div>
                    )}
                </section>

                {/* Banner Prime */}
                <PrimeBanner plan={primePlan} />
            </div>
        </main>
    )
}

export default HomePage