import { Navigate, Outlet } from "react-router"

import { useAuth } from "../context/useAuth"

/**
 * Rutas públicas (login / registro).
 *
 * Si el usuario ya inició sesión, no tiene sentido
 * mostrarle el login: se lo redirige a /inicio.
 */
function PublicRoute() {

    const { token } = useAuth()

    if (token) {
        return <Navigate to="/inicio" replace />
    }

    return <Outlet />
}

export default PublicRoute