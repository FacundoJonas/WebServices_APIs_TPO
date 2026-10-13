import { Outlet } from "react-router"

import Header from "../components/Header"
import Footer from "../components/Footer"

/**
 * Layout de las páginas internas de DeliveryGo.
 *
 * Muestra el Header y el Footer, y en el medio
 * renderiza la página de la ruta activa mediante <Outlet />.
 */
function MainLayout() {

    return (
        <>
            <Header />

            {/* Acá se renderiza StorePage, OrderReviewPage, etc. */}
            <Outlet />

            <Footer />
        </>
    )
}

export default MainLayout