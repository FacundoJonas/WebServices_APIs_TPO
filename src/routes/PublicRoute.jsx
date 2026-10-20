import { Navigate, Outlet, useLocation } from "react-router"

import { useAuth } from "../context/useAuth"

/**
 * Rutas públicas (login / registro).
 *
 * Si el usuario ya inició sesión, no tiene sentido
 * mostrarle el login: se lo redirige a la página que
 * quería visitar (si venía de una ruta protegida) o a /inicio.
 */
function PublicRoute() {

    const location = useLocation()

    const { token } = useAuth()

    if (token) {
        const destino = location.state?.from?.pathname || "/inicio"

        return <Navigate to={destino} replace />
    }

    return <Outlet />
}

export default PublicRoute