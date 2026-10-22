import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'

import './index.css'

import { CartProvider } from './context/CartProvider.jsx'
import { AuthProvider } from "./context/AuthProvider.jsx"

import AppLayout from './layouts/AppLayout.jsx'

import AuthPage from './pages/AuthPage.jsx'
import CartPage from './pages/CartPage.jsx'
import HomePage from './pages/HomePage.jsx'
import StorePage from './pages/StorePage.jsx'
import PublicRoute from './routes/PublicRoute.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import OrderReviewPage from './pages/OrderReviewPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <CartProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Navigate to="/inicio" replace />} />

                        <Route element={<AppLayout />}>
                            <Route element={<PublicRoute />}>
                                <Route path="/login" element={<AuthPage />} />
                            </Route>

                            <Route element={<ProtectedRoute />}>
                                <Route path="/inicio" element={<HomePage />} />
                                <Route path="/comercio" element={<StorePage />} />
                                <Route path="/carrito" element={<CartPage />} />
                                <Route path="/pagar" element={<CheckoutPage />} />
                                <Route path="/pedido" element={<OrderReviewPage />} />
                                <Route path="/notificaciones" element={<NotificationsPage />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </CartProvider>
        </AuthProvider>
    </StrictMode>
)