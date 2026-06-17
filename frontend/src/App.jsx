/**
 * Uygulama kok bileseni.
 *
 * Global katmanlar (tum rotalarin uzerinde render edilir):
 *   - CognitiveFrictionModal : "Sepete Ekle" tiklandiginda
 *   - ThreeDSecureOverlay    : Checkout sureci boyunca
 *   - CartDrawer             : Sepet acik oldugunda
 *
 * Rotalar:
 *   /                      -> Urun katalogu
 *   /login                 -> Giris sayfasi
 *   /register              -> Kayit sayfasi
 *   /tracking/:orderId     -> Siparis + kurye takibi
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import CatalogPage from './pages/CatalogPage'
import TrackingPage from './pages/TrackingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CartDrawer from './components/CartDrawer'
import CognitiveFrictionModal from './components/CognitiveFrictionModal'
import ThreeDSecureOverlay from './components/ThreeDSecureOverlay'
import { useCartStore } from './store/cartStore'

export default function App() {
  const pendingProduct = useCartStore((s) => s.pendingProduct)
  const checkoutStatus = useCartStore((s) => s.checkoutStatus)
  const isCartOpen = useCartStore((s) => s.isCartOpen)

  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global katmanlar */}
        {pendingProduct && <CognitiveFrictionModal />}
        {checkoutStatus !== 'idle' && <ThreeDSecureOverlay />}
        {isCartOpen && <CartDrawer />}

        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/tracking/:orderId" element={<TrackingPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
