import { Link, useNavigate } from "react-router"

import { useCart } from "../context/useCart"
import { useAuth } from "../context/useAuth"

import deliveryGoLogo from "../assets/deliverygo_logo.png"
import profileImage from "../assets/patricio.png"

/**
 * Encabezado principal de DeliveryGo.
 *
 * Contiene:
 * - Logo de la aplicación.
 * - Dirección de entrega.
 * - Buscador.
 * - Navegación principal.
 * - Notificaciones.
 * - Acceso al carrito.
 * - Perfil del usuario.
 *
 * Actualmente los enlaces son principalmente visuales.
 * TODO: Integrar React Router.
 */
function Header() {
    const { itemCount, amounts } = useCart()

    const navigate = useNavigate()
    // Usuario logueado y logout del AuthContext
    const { usuario, logout } = useAuth()

    /**
     * Cierra la sesión y vuelve al login.
     */
    function handleLogout() {
        logout()
        navigate("/login", { replace: true })
    }


    return (
        <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">

            {/* Contenedor que centra y limita el ancho del header */}
            <div className="h-20 max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-md">

                {/* Logo y dirección de entrega */}
                <div className="flex items-center gap-space-lg shrink-0">

                    {/* Logo */}
                    <a
                        href="#"
                        className="flex items-center gap-space-xs"
                    >

                        <img
                            src={deliveryGoLogo}
                            alt="DeliveryGo Logo"
                            className="h-8 w-auto object-contain"
                        />

                        <span className="font-title-md text-title-md text-on-surface hidden sm:inline-block tracking-tight">
                  Delivery
                  <span className="text-primary-container">
                    {" "}Go
                  </span>
                </span>
                    </a>

                    {/* Dirección actual seleccionada para la entrega */}
                    <button
                        type="button"
                        className="flex items-center gap-space-xs py-space-xs px-space-sm rounded-full bg-surface-container-low hover:bg-surface-container hover:text-on-surface text-on-surface-variant transition-colors"
                    >

                <span className="material-symbols-outlined text-primary-container text-[20px]">
                  location_on
                </span>

                        <div className="flex flex-col text-left">

                  <span className="font-caption-sm text-caption-sm text-secondary leading-none">
                    Entregar en
                  </span>

                            <span className="font-body-md-medium text-body-md-medium text-on-surface truncate max-w-[150px] md:max-w-[200px] leading-tight">
                    {usuario?.direcciones?.[0]?.calle ?? "Agregá una dirección"}
                  </span>
                        </div>

                        <span className="material-symbols-outlined text-secondary text-[18px]">
                  expand_more
                </span>
                    </button>
                </div>

                {/* Buscador principal. Se oculta en pantallas pequeñas. */}
                <div className="flex-1 max-w-xl hidden md:block">

                    <div className="relative w-full">

                <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  search
                </span>

                        <input
                            type="text"
                            placeholder="Buscar restaurantes, platos o bebidas..."
                            className="w-full h-11 pl-11 pr-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface placeholder:text-outline font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all"
                        />
                    </div>
                </div>

                {/* Acciones y navegación del usuario */}
                <div className="flex items-center gap-space-sm shrink-0">

                    {/* Navegación principal. Visible únicamente en pantallas grandes. */}
                    <nav className="hidden xl:flex items-center gap-space-xs mr-space-xs">

                        <a
                            href="#"
                            aria-current="page"
                            className="px-space-sm py-space-xs rounded-lg transition-colors bg-surface-container-high text-on-surface font-body-md-medium"
                        >
                            Comercios
                        </a>

                        <a
                            href="#"
                            className="px-space-sm py-space-xs rounded-lg font-body-md text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
                        >
                            Promociones
                        </a>

                        <a
                            href="#"
                            className="px-space-sm py-space-xs rounded-lg font-body-md text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
                        >
                            Mis Pedidos
                        </a>
                    </nav>

                    {/* Notificaciones */}
                    <a
                        href="#"
                        className="relative p-space-xs rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
                    >

                <span className="material-symbols-outlined text-[24px]">
                  notifications
                </span>

                        {/* Cantidad de notificaciones pendientes */}
                        <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-error text-on-error rounded-full font-caption-bold text-[10px] leading-none">
                  3
                </span>
                    </a>

                    {/* Resumen del carrito (NAV-03) */}
                    <Link
                        to="/carrito"
                        aria-label={`Ver carrito: ${itemCount} productos`}
                        className="flex items-center gap-space-xs py-space-xs px-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors"
                    >

                        <div className="relative flex items-center">

                  <span className="material-symbols-outlined text-primary-container text-[22px]">
                    shopping_bag
                  </span>

                            {/* Cantidad de productos en el carrito */}
                            <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[16px] h-[16px] px-1 bg-primary-container text-on-primary rounded-full font-caption-bold text-[10px] leading-none">
                    {itemCount}
                  </span>
                        </div>

                        <span className="hidden sm:inline-block font-body-md-medium text-body-md-medium text-on-surface">
                  $ {amounts.total.toLocaleString("es-AR")}
                </span>
                    </Link>

                    {/* Perfil del usuario */}
                    <a
                        href="#"
                        className="flex items-center gap-space-xs pl-space-xs py-space-xs rounded-full hover:bg-surface-container-low transition-colors"
                    >

                        <img
                            src={profileImage}
                            alt="Imagen de Perfil"
                            className="w-8 h-8 rounded-full object-cover"
                        />

                        <span className="font-body-md-medium text-body-md-medium text-on-surface hidden lg:inline-block pr-space-xs">
                    {usuario?.nombre}
                </span>
                    </a>
                    {/* Cerrar sesión */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        aria-label="Cerrar sesión"
                        className="p-space-xs rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                <span className="material-symbols-outlined text-[24px]">
                  logout
                </span>
                    </button>
                </div>
            </div>
        </header>
    )
}

export default Header