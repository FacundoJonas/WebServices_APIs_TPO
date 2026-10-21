import { Navigate, Outlet, useLocation } from "react-router"

import { useAuth } from "../context/useAuth"


/**
 * Si el usuario no inició sesión, lo redirige a /login
 * y guarda la URL a la que quería entrar, para poder
 * volver ahí después del login.
 *
 * Si hay sesión, renderiza la ruta hija mediante <Outlet />.
 */
function ProtectedRoute() {

    const location = useLocation()

    const { token } = useAuth()

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location }} />
    }

    return <Outlet />
}

export default ProtectedRoute