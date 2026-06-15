/**
 * Sahte 3D Secure Banka Onay Ekranı
 *
 * checkout POST isteği süresi boyunca (≈2.5 sn) gösterilir.
 * Progress bar backend asyncio.sleep süresiyle eşzamanlı canlandırılır.
 * Başarı/hata durumunda geri bildirim verilir.
 */
import { useEffect, useState } from 'react'
import { useCartStore } from '../store/cartStore'

export default function ThreeDSecureOverlay() {
  const checkoutStatus = useCartStore((s) => s.checkoutStatus)
  const [progress, setProgress] = useState(0)

  const isSuccess = checkoutStatus === 'success'
  const isError = checkoutStatus === 'error'

  // 2.4 sn içinde %0 → %90 — sonra yanıt gelince %100'e tamamlanır
  useEffect(() => {
    if (isSuccess || isError) return

    const DURATION_MS = 2400
    const TICK_MS = 50
    const step = (90 / DURATION_MS) * TICK_MS

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step
        if (next >= 90) {
          clearInterval(timer)
          return 90
        }
        return next
      })
    }, TICK_MS)

    return () => clearInterval(timer)
  }, [isSuccess, isError])

  useEffect(() => {
    if (isSuccess) setProgress(100)
  }, [isSuccess])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        {/* Banka üst çubuğu */}
        <div className="bg-blue-800 text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
              🏦
            </div>
            <div>
              <p className="font-bold text-sm">Güvenli Ödeme Sistemi</p>
              <p className="text-blue-200 text-xs">3D Secure v2 Doğrulaması</p>
            </div>
            <span className="ml-auto text-2xl">🔒</span>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Maskeli kart gösterimi */}
          <div className="bg-gray-100 rounded-xl p-3 mb-5 flex items-center gap-3">
            <div className="w-10 h-7 bg-orange-500 rounded-md flex items-center justify-center text-white text-xs font-extrabold tracking-wider">
              VISA
            </div>
            <span className="text-gray-600 font-mono text-sm tracking-[0.2em]">
              •••• •••• •••• 4242
            </span>
            <span className="ml-auto text-xs text-gray-400">12/28</span>
          </div>

          {/* Durum içeriği */}
          {isSuccess ? (
            <div className="text-center py-3">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-green-600 font-extrabold text-lg">Ödeme Onaylandı!</p>
              <p className="text-gray-400 text-sm mt-1">
                Sipariş takip sayfasına yönlendiriliyorsunuz...
              </p>
            </div>
          ) : isError ? (
            <div className="text-center py-3">
              <div className="text-5xl mb-3">❌</div>
              <p className="text-red-600 font-extrabold text-lg">Bağlantı Hatası</p>
              <p className="text-gray-400 text-sm mt-1">
                Lütfen tekrar deneyin.
              </p>
            </div>
          ) : (
            <div>
              {/* Spinner + metin */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-9 h-9 border-[3px] border-blue-700 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <div>
                  <p className="text-gray-800 font-bold text-sm">
                    Banka onayı bekleniyor...
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Lütfen bu sayfayı kapatmayın
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-700 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-right mt-1">
                {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>

        {/* Alt uyarı */}
        <div className="bg-gray-50 border-t px-6 py-3">
          <p className="text-center text-[11px] text-gray-400">
            🛡️ Bu bir simülasyondur — gerçek para işlenmez
          </p>
        </div>
      </div>
    </div>
  )
}
