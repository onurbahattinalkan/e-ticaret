import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { formatPrice } from '../utils/format'

export default function CartDrawer() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const closeCart = useCartStore((s) => s.closeCart)
  const fetchCart = useCartStore((s) => s.fetchCart)
  const startCheckout = useCartStore((s) => s.startCheckout)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.line_total, 0)

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Arka plan karartması */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={closeCart}
      />

      {/* Drawer paneli */}
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-fade-in-up">
        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
          <h2 className="text-lg font-bold text-gray-900">
            Sepetim
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({totalItems} ürün)
            </span>
          </h2>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Sepeti kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Ürün listesi */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-3">🛒</p>
              <p className="font-semibold text-gray-500">Sepetiniz boş</p>
              <p className="text-sm mt-1">Beğendiğiniz ürünleri sepete ekleyin.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
              >
                {/* Ürün ikonu */}
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">
                  📦
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.quantity} adet × {formatPrice(item.unit_price)}
                  </p>
                </div>
                <p className="font-bold text-gray-900 text-sm whitespace-nowrap">
                  {formatPrice(item.line_total)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Alt özet ve ödeme */}
        {items.length > 0 && (
          <div className="border-t px-5 py-5 bg-white">
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Ara Toplam</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>🚚 Kargo</span>
                <span>Ücretsiz</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                <span>Toplam</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <button
              onClick={() => startCheckout(navigate)}
              className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl text-base transition-all flex items-center justify-center gap-2"
            >
              <span>🔒</span>
              <span>Güvenli Satın Al</span>
            </button>
            <p className="text-center text-[11px] text-gray-400 mt-2">
              Gerçek ödeme alınmaz — bu bir simülasyondur.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
