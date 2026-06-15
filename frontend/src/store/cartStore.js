/**
 * Zustand sepet store'u.
 *
 * Yönetilen durum:
 *   items          — backend sepet öğeleri
 *   isCartOpen     — sepet drawer görünürlüğü
 *   pendingProduct — bilişsel sürtünme için bekleyen ürün
 *   checkoutStatus — 'idle' | 'pending' | 'success' | 'error'
 *   orderId        — checkout sonrası oluşan sipariş ID'si
 */
import { create } from 'zustand'
import { api } from '../services/api'

export const useCartStore = create((set, get) => ({
  items: [],
  isCartOpen: false,
  pendingProduct: null,
  checkoutStatus: 'idle',
  orderId: null,

  // ── Sepet ────────────────────────────────────────────────────────

  fetchCart: async () => {
    try {
      const items = await api.getCart()
      set({ items })
    } catch (e) {
      console.error('Sepet yüklenemedi:', e.message)
    }
  },

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),

  // ── Bilişsel sürtünme ────────────────────────────────────────────

  /** Ürünü bekletir; pop-up gösterilecek */
  requestAdd: (product) => set({ pendingProduct: product }),

  /** Pop-up'ı iptal et — ürün sepete eklenmez */
  cancelAdd: () => set({ pendingProduct: null }),

  /** Pop-up onaylandı — ürünü sepete ekle */
  confirmAdd: async () => {
    const { pendingProduct, fetchCart } = get()
    if (!pendingProduct) return
    set({ pendingProduct: null })
    try {
      await api.addToCart(pendingProduct.id)
      await fetchCart()
    } catch (e) {
      console.error('Sepete eklenemedi:', e.message)
    }
  },

  // ── Ödeme ────────────────────────────────────────────────────────

  /**
   * Checkout akışını başlatır.
   * @param {function} navigate - react-router navigate fonksiyonu
   */
  startCheckout: async (navigate) => {
    set({ checkoutStatus: 'pending', isCartOpen: false })
    try {
      const result = await api.checkout()
      set({ checkoutStatus: 'success', orderId: result.order_id, items: [] })
      // Başarı ekranını kısa süre göster, sonra yönlendir
      setTimeout(() => {
        set({ checkoutStatus: 'idle' })
        navigate(`/tracking/${result.order_id}`)
      }, 1200)
    } catch (e) {
      console.error('Ödeme hatası:', e.message)
      set({ checkoutStatus: 'error' })
      setTimeout(() => set({ checkoutStatus: 'idle' }), 2500)
    }
  },
}))
