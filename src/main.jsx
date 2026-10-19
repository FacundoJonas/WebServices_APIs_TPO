import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import './index.css'
import MainLayout from './layouts/MainLayout'
import AuthPage from './pages/AuthPage'
import StorePage from './pages/StorePage'
import OrderReviewPage from './pages/OrderReviewPage'
import NotificationsPage from './pages/NotificationsPage'
import HomePage from './pages/HomePage'
import LoginLayout from "./layouts/LoginLayout.jsx";
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import { CartProvider } from './context/CartProvider'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicRoute from './routes/PublicRoute'

createRoot(document.getElementById('root')).render(
    <StrictMode>
      <CartProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Rutas públicas: solo accesibles sin sesión */}
                <Route element={<PublicRoute />}>
                    <Route element={<LoginLayout/>}>
                        <Route path="/login" element={<AuthPage />} />
                    </Route>
                </Route>

                {/* Rutas internas: requieren sesión iniciada */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                        <Route path="/inicio" element={<HomePage />} />
                        <Route path="/comercio" element={<StorePage />} />
                        <Route path="/pedido" element={<OrderReviewPage />} />
                        <Route path="/notificaciones" element={<NotificationsPage />} />
                        <Route path="/carrito" element={<CartPage />} />
                        <Route path="/pagar" element={<CheckoutPage />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
      </CartProvider>
    </StrictMode>,
)