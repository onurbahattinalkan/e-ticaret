/**
 * Türk lirası formatında fiyat döndürür.
 * Örnek: 1299.99 → "₺1.299,99"
 */
export const formatPrice = (price) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(price)

/**
 * Ürün ID'sine göre deterministik sahte indirim oranı (%10–%40).
 * Aynı ID her zaman aynı değeri döndürür (random yok).
 */
export const fakeDiscountRate = (id) => 10 + (id * 7) % 31

/**
 * İndirimli fiyattan geriye hesaplanan "eski" fiyat.
 */
export const fakeOriginalPrice = (price, id) =>
  price / (1 - fakeDiscountRate(id) / 100)

/**
 * Deterministik sahte yorum sayısı (120–3119 arası).
 */
export const fakeReviewCount = (id) => 120 + (id * 137) % 3000

/**
 * Deterministik sahte puan (4.0–4.9 arası, bir ondalık).
 */
export const fakeRating = (id) => (4 + ((id * 3) % 10) / 10).toFixed(1)
