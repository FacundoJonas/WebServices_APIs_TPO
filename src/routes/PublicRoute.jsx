import { Navigate, Outlet } from "react-router"

import { obtenerToken } from "../servicies/authServicie.js"

/**
 * Rutas públicas (login / registro).
 *
 * Si el usuario ya inició sesión, no tiene sentido
 * mostrarle el login: se lo redirige a /inicio.
 */
function PublicRoute() {

    const token = obtenerToken()

    if (token) {
        return <Navigate to="/inicio" replace />
    }

    return <Outlet />
}

export default PublicRoute