
import { NavLink } from "react-router-dom";
import { Link, useNavigate } from "react-router";

import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";

import deliveryGoLogo from "../assets/deliverygo_logo.png";
import profileImage from "../assets/patricio.png";

/**
 * Encabezado principal de DeliveryGo.
 *
 * Permite navegar por la aplicación y acceder a las principales
 * funcionalidades: búsqueda, dirección de entrega, carrito,
 * notificaciones y perfil del usuario.
 *
 * Adapta las opciones disponibles según el estado de autenticación.
 */
function Header() {

    // Obtiene la cantidad de productos y los importes del carrito.
    const { itemCount, amounts } = useCart();

    // Permite realizar navegaciones programáticas.
    const navigate = useNavigate();

    // Obtiene el estado de autenticación y la función para cerrar sesión.
    const { token, usuario, logout } = useAuth();


    /**
     * Cierra la sesión del usuario y lo redirige a la página de inicio.
     *
     * Utiliza replace para reemplazar la entrada actual del historial,
     * evitando que el botón "Atrás" regrese directamente a la ruta anterior.
     */
    function handleLogout() {
        logout();
        navigate("/inicio", { replace: true });
    }


    /**
     * Renderiza las opciones del encabezado para un usuario autenticado.
     *
     * Muestra la imagen de perfil, el nombre del usuario y el botón
     * que permite cerrar sesión.
     */
    const renderUsuarioRegistrado = () => {
        return (
            <>
                <div className="flex items-center gap-space-xs pl-space-xs py-space-xs">
                    <img
                        src={profileImage}
                        alt="Imagen de perfil"
                        className="w-8 h-8 rounded-full object-cover"
                    />

                    <span className="font-body-md-medium text-body-md-medium text-on-surface hidden lg:inline-block pr-space-xs">
                        {usuario?.nombre ?? "Mi perfil"}
                    </span>
                </div>

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
            </>
        );
    };


    /**
     * Determina las clases CSS de un enlace del menú de navegación.
     *
     * React Router proporciona isActive para indicar si la ruta
     * del enlace coincide con la ubicación actual.
     */
    const getNavLinkClass = ({ isActive }) => {
        const base = "px-space-sm py-space-xs rounded-lg transition-colors";
        const active = "bg-surface-container-high text-on-surface font-body-md-medium";
        const inactive = "font-body-md text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low";

        return `${base} ${isActive ? active : inactive}`;
    };


    return (
        <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">

            {/* Contenedor que centra y limita el ancho del header */}
            <div className="h-20 max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-md">

                {/* Logo y dirección de entrega */}
                <div className="flex items-center gap-space-lg shrink-0">

                    {/* Logo */}
                    <Link to="/inicio" className="flex items-center gap-space-xs">
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
                    </Link>

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

                        <NavLink to="/inicio" className={getNavLinkClass}>
                            Comercios
                        </NavLink>

                        {token && (
                            <NavLink to="/pedido" className={getNavLinkClass}>
                                Mis Pedidos
                            </NavLink>
                        )}

                    </nav>

                    {/* Notificaciones */}
                    {token && (
                        <Link
                            to="/notificaciones"
                            aria-label="Ver notificaciones"
                            className="relative p-space-xs rounded-full hover:bg-surface-container-low"
                        >
                            <span className="material-symbols-outlined text-[24px]">
                                notifications
                            </span>
                        </Link>
                    )}

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

                        <span className="hidden sm:inline-block font-body-md-medium text-body-md text-on-surface">
                            $ {amounts.total.toLocaleString("es-AR")}
                        </span>
                    </Link>

                    {/* Muestra el perfil o el acceso al login según la autenticación. */}
                    {token ? (
                        renderUsuarioRegistrado()
                    ) : (
                        <Link
                            to="/login"
                            className="px-space-md py-space-xs rounded-lg bg-primary-container text-on-primary font-body-md-medium hover:opacity-90 transition-opacity"
                        >
                            Iniciar sesión
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
