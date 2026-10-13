import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Header from './components/Header'
import Footer from './components/Footer'
//import AuthPage from './pages/AuthPage'
import OrderReviewPage from './pages/OrderReviewPage'
//import StorePage from './pages/StorePage'

createRoot(document.getElementById('root')).render(
  
  <StrictMode>
    <Header />
    {/* <AuthPage /> */}
    <OrderReviewPage />
    {/* <StorePage /> */}
    <Footer />
  </StrictMode>,
)
