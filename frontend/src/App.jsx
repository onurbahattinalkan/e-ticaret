/**
 * Uygulama kök bileşeni.
 *
 * Global katmanlar (tüm rotaların üzerinde render edilir):
 *   - CognitiveFrictionModal : "Sepete Ekle" tıklandığında
 *   - ThreeDSecureOverlay    : Checkout süreci boyunca
 *   - CartDrawer             : Sepet açık olduğunda
 *
 * Rotalar:
 *   /                      → Ürün kataloğu
 *   /tracking/:orderId     → Sipariş + kurye takibi
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import CatalogPage from './pages/CatalogPage'
import TrackingPage from './pages/TrackingPage'
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
      {/* Global katmanlar */}
      {pendingProduct && <CognitiveFrictionModal />}
      {checkoutStatus !== 'idle' && <ThreeDSecureOverlay />}
      {isCartOpen && <CartDrawer />}

      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/tracking/:orderId" element={<TrackingPage />} />
      </Routes>
    </BrowserRouter>
  )
}
