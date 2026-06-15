/** Backend API temel URL'si */
const BASE_URL = 'http://dopamin-shop-alb-1760463302.eu-central-1.elb.amazonaws.com'

/** Seed betiğinin oluşturduğu demo kullanıcı ID'si */
export const DEMO_USER_ID = 1

/** WebSocket takip endpoint'i tabanı */
export const WS_BASE = 'ws://dopamin-shop-alb-1760463302.eu-central-1.elb.amazonaws.com/ws/tracking'
/**
 * Merkezi fetch yardımcısı — hataları normalize eder.
 */
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `HTTP ${res.status}`)
  }

  // 204 No Content — body yoktur
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  /** Ürün kataloğunu getirir. Opsiyonel kategori filtresi destekler. */
  getProducts: (category = null) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : ''
    return request(`/products/${qs}`)
  },

  /** Demo kullanıcının sepetini getirir. */
  getCart: () => request(`/cart/${DEMO_USER_ID}`),

  /** Sepete ürün ekler. Aynı ürün varsa miktarı artırır. */
  addToCart: (productId, quantity = 1) =>
    request(`/cart/${DEMO_USER_ID}`, {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    }),

  /** Sepeti tamamen temizler. */
  clearCart: () =>
    request(`/cart/${DEMO_USER_ID}`, { method: 'DELETE' }),

  /**
   * Misafir ödeme akışını başlatır.
   * Backend 2.5 sn asyncio.sleep ile 3D Secure simüle eder.
   */
  checkout: () =>
    request('/checkout/', {
      method: 'POST',
      body: JSON.stringify({ user_id: DEMO_USER_ID }),
    }),
}
