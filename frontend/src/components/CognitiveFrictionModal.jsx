/**
 * Bilişsel Sürtünme Modal'ı
 *
 * Kullanıcı "Sepete Ekle" butonuna tıkladığında açılır.
 * Satın alma kararını sorgulatacak 4 soru gösterir.
 * "Evet, Ekle" → ürün sepete eklenir
 * "Vazgeç"     → ürün eklenmez
 */
import { useCartStore } from '../store/cartStore'
import { formatPrice } from '../utils/format'

const FRICTION_QUESTIONS = [
  'Buna gerçekten ihtiyacım var mı?',
  'Bunun daha ucuz bir alternatifi var mı?',
  'Bu harcama şu an bütçeme uygun mu?',
  '48 saat sonra da almak ister miyim?',
]

export default function CognitiveFrictionModal() {
  const pendingProduct = useCartStore((s) => s.pendingProduct)
  const cancelAdd = useCartStore((s) => s.cancelAdd)
  const confirmAdd = useCartStore((s) => s.confirmAdd)

  if (!pendingProduct) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Karartma */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={cancelAdd}
      />

      {/* Modal kutusu */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up">
        {/* Başlık */}
        <div className="text-center mb-5">
          <span className="text-5xl">🤔</span>
          <h2 className="mt-2 text-xl font-extrabold text-gray-900">Bir Dakika!</h2>
          <p className="text-sm text-gray-500 mt-1">
            Devam etmeden önce kendinize şunu sorun:
          </p>
        </div>

        {/* Ürün özeti */}
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5 flex items-center gap-3">
          <img
            src={
              pendingProduct.image_url ||
              'https://placehold.co/56x56/f97316/ffffff?text=📦'
            }
            alt={pendingProduct.name}
            className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug">
              {pendingProduct.name}
            </p>
            <p className="text-orange-600 font-extrabold mt-0.5 text-base">
              {formatPrice(pendingProduct.price)}
            </p>
          </div>
        </div>

        {/* Sorular listesi */}
        <ul className="space-y-2.5 mb-6">
          {FRICTION_QUESTIONS.map((q, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="text-orange-400 mt-0.5 flex-shrink-0 text-base">⚠️</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>

        {/* Aksiyon butonları */}
        <div className="flex gap-3">
          <button
            onClick={cancelAdd}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm"
          >
            Vazgeç
          </button>
          <button
            onClick={confirmAdd}
            className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors text-sm"
          >
            Evet, Ekle
          </button>
        </div>

        {/* Dipnot */}
        <p className="text-center text-[11px] text-gray-400 mt-4">
          Bu alışveriş simülasyondur — gerçek para harcanmaz.
        </p>
      </div>
    </div>
  )
}
