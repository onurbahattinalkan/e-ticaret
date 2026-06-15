import { useCartStore } from '../store/cartStore'
import {
  formatPrice,
  fakeDiscountRate,
  fakeOriginalPrice,
  fakeReviewCount,
  fakeRating,
} from '../utils/format'

export default function ProductCard({ product }) {
  const requestAdd = useCartStore((s) => s.requestAdd)

  const discount = fakeDiscountRate(product.id)
  const originalPrice = fakeOriginalPrice(product.price, product.id)
  const reviews = fakeReviewCount(product.id)
  const rating = parseFloat(fakeRating(product.id))

  // Unicode yıldız satırı
  const stars = Array.from({ length: 5 }, (_, i) =>
    i < Math.floor(rating) ? '★' : i < rating ? '★' : '☆',
  ).join('')

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col group">
      {/* Görsel alanı */}
      <div className="relative overflow-hidden">
        <img
          src={
            product.image_url ||
            `https://placehold.co/400x300/f97316/ffffff?text=${encodeURIComponent(
              product.name.slice(0, 12),
            )}`
          }
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* İndirim rozeti */}
        <span className="absolute top-2 left-2 bg-red-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded">
          %-{discount} İNDİRİM
        </span>
        {/* Ücretsiz kargo rozeti */}
        <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
          ÜCRETSİZ KARGO
        </span>
      </div>

      {/* İçerik */}
      <div className="p-4 flex flex-col flex-1">
        {/* Kategori */}
        <span className="text-[11px] text-orange-500 font-semibold uppercase tracking-wide">
          {product.category}
        </span>

        {/* Ürün adı */}
        <h3 className="mt-1 text-sm font-semibold text-gray-800 line-clamp-2 min-h-[2.5rem] leading-tight">
          {product.name}
        </h3>

        {/* Yıldız değerlendirmesi */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-yellow-400 text-sm leading-none">{stars}</span>
          <span className="text-xs text-gray-400">
            {rating} ({reviews.toLocaleString('tr-TR')})
          </span>
        </div>

        {/* Fiyat */}
        <div className="mt-2 flex-1">
          <span className="text-xs text-gray-400 line-through">
            {formatPrice(originalPrice)}
          </span>
          <p className="text-xl font-bold text-gray-900 leading-tight">
            {formatPrice(product.price)}
          </p>
        </div>

        {/* Sepete Ekle */}
        <button
          onClick={() => requestAdd(product)}
          className="mt-3 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-2.5 rounded-lg transition-colors duration-150 text-sm tracking-wide"
        >
          Sepete Ekle
        </button>
      </div>
    </div>
  )
}
