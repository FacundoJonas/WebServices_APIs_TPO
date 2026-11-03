import { Link, Outlet } from "react-router"

import { useAuth } from "../context/useAuth"


/**
 * Solo deja pasar al rol ADMIN (RN-10).
 *
 * Va dentro de ProtectedRoute, así que acá ya hay sesión.
 * Si el usuario no es ADMIN, muestra un aviso de acceso denegado
 * en lugar de la ruta hija.
 */
function AdminRoute() {

    const { usuario } = useAuth()

    if (usuario?.rol !== "ADMIN") {
        return (
            <main className="w-full pt-20 bg-background min-h-[calc(100vh-280px)] flex items-center justify-center px-gutter-mobile">

                <div className="max-w-md bg-surface-container-lowest rounded-xl p-space-2xl shadow-sm flex flex-col items-center text-center gap-space-md my-space-2xl">

                    <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-[36px]">lock</span>
                    </div>

                    <div>
                        <h1 className="font-headline-sm text-headline-sm text-on-surface">
                            No tenés acceso a esta sección
                        </h1>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-space-2xs">
                            Las métricas administrativas solo están disponibles para administradores.
                        </p>
                    </div>

                    <Link
                        to="/inicio"
                        className="px-space-lg py-2.5 rounded-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-body-md-medium text-body-md-medium shadow-sm transition-all"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </main>
        )
    }

    return <Outlet />
}

export default AdminRoute
