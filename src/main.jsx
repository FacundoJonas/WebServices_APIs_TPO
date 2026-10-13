import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import './index.css'
import MainLayout from './layouts/MainLayout'
import AuthPage from './pages/AuthPage'
import StorePage from './pages/StorePage'
import OrderReviewPage from './pages/OrderReviewPage'
import NotificationsPage from './pages/NotificationsPage'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />


                <Route path="/login" element={<AuthPage />} />

                <Route element={<MainLayout />}>
                    <Route path="/comercio" element={<StorePage />} />
                    <Route path="/pedido" element={<OrderReviewPage />} />
                    <Route path="/notificaciones" element={<NotificationsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>,
)