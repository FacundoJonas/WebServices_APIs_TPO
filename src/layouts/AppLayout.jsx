import { Outlet, useLocation } from "react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AppLayout() {
    const { pathname } = useLocation();
    const showHeader = pathname !== "/login";

    return (
        <>
            {showHeader && <Header />}

            <Outlet />

            <Footer />
        </>
    );
}