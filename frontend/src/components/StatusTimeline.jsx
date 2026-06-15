/**
 * Sipariş durum zaman çizelgesi.
 * Aktif adıma kadar olan adımlar turuncu renkle vurgulanır.
 */
const STATUSES = ['Alındı', 'Hazırlanıyor', 'Kurye Yola Çıktı', 'Teslim Edildi']

const ICONS = {
  'Alındı': '📋',
  'Hazırlanıyor': '📦',
  'Kurye Yola Çıktı': '🚚',
  'Teslim Edildi': '🏠',
}

export default function StatusTimeline({ currentStatus }) {
  const currentIndex = STATUSES.indexOf(currentStatus)

  return (
    <div className="flex items-start">
      {STATUSES.map((status, index) => (
        <div key={status} className="flex items-center flex-1 last:flex-none">
          {/* Adım dairesi + etiket */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 shadow-sm ${
                index <= currentIndex
                  ? 'bg-orange-500 ring-4 ring-orange-100'
                  : 'bg-gray-100 text-gray-300'
              }`}
            >
              {index < currentIndex ? (
                <span className="text-white font-bold text-base">✓</span>
              ) : (
                ICONS[status]
              )}
            </div>
            <span
              className={`text-[11px] mt-2 text-center w-[68px] leading-tight font-medium transition-colors duration-500 ${
                index <= currentIndex ? 'text-orange-600' : 'text-gray-400'
              }`}
            >
              {status}
            </span>
          </div>

          {/* Bağlantı çizgisi */}
          {index < STATUSES.length - 1 && (
            <div className="flex-1 h-0.5 mx-1 mb-6 rounded-full overflow-hidden bg-gray-200">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  index < currentIndex ? 'bg-orange-500 w-full' : 'w-0'
                }`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
