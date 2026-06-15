/**
 * Sipariş Takip Sayfası
 *
 * WebSocket kanalına (ws://localhost:8000/ws/tracking/{orderId}) bağlanarak:
 *   - Sipariş durum güncellemelerini (type: "status") alır
 *   - GPS koordinatlarını (type: "gps") Leaflet haritasında gösterir
 *   - "Teslim Edildi" (type: "delivered") gelince bağlantıyı kapatır
 *
 * Kurgusal rota: Kadıköy (başlangıç) → Beşiktaş (hedef)
 * config.py GPS sabitleriyle eşleştirilmiştir.
 */
import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import StatusTimeline from '../components/StatusTimeline'
import CourierMap from '../components/CourierMap'
import { WS_BASE } from '../services/api'

const ROUTE_START = { lat: 40.9907, lng: 29.023 }  // Kadıköy
const ROUTE_END = { lat: 41.0422, lng: 29.005 }    // Beşiktaş

export default function TrackingPage() {
  const { orderId } = useParams()
  const wsRef = useRef(null)

  const [status, setStatus] = useState('Alındı')
  const [courierPos, setCourierPos] = useState(ROUTE_START)
  const [latestGps, setLatestGps] = useState(null)
  const [delivered, setDelivered] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    if (!orderId) return

    const ws = new WebSocket(`${WS_BASE}/${orderId}`)
    wsRef.current = ws

    ws.onopen = () => setWsConnected(true)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'status':
          setStatus(data.status)
          break
        case 'gps':
          setCourierPos({ lat: data.lat, lng: data.lng })
          setLatestGps(data)
          break
        case 'delivered':
          setStatus('Teslim Edildi')
          setDelivered(true)
          setCourierPos(ROUTE_END)
          ws.close()
          break
        default:
          break
      }
    }

    ws.onerror = () => setWsConnected(false)
    ws.onclose = () => setWsConnected(false)

    return () => ws.close()
  }, [orderId])

  const isEnRoute = status === 'Kurye Yola Çıktı' && !delivered

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Üst nav */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link
          to="/"
          className="text-orange-500 hover:text-orange-600 font-bold text-base flex items-center gap-1"
        >
          ← DopaminShop
        </Link>
        <span className="text-gray-200 text-xl">|</span>
        <h1 className="text-gray-700 font-semibold text-sm">
          Sipariş #{orderId} Takibi
        </h1>
        <span
          className={`ml-auto text-[11px] px-2.5 py-1 rounded-full font-semibold ${
            wsConnected
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {wsConnected ? '● Canlı' : '○ Bağlanıyor'}
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Durum hero kartı */}
        <div
          className={`rounded-2xl p-6 text-white text-center shadow-lg transition-all duration-700 ${
            delivered
              ? 'bg-gradient-to-br from-green-500 to-emerald-600'
              : 'bg-gradient-to-br from-orange-500 to-amber-500'
          }`}
        >
          <p className="text-5xl mb-3">
            {delivered ? '🎉' : isEnRoute ? '🚚' : '📦'}
          </p>
          <h2 className="text-xl font-extrabold">
            {delivered ? 'Siparişiniz Teslim Edildi!' : status}
          </h2>
          {!delivered && (
            <p className="text-white/75 text-sm mt-1">
              Siparişiniz güncelleniyor, takip etmeye devam edin...
            </p>
          )}
        </div>

        {/* Durum zaman çizelgesi */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">
            Sipariş Durumu
          </h3>
          <StatusTimeline currentStatus={status} />
        </div>

        {/* Harita */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Kurye Konumu
            </h3>
            {isEnRoute && (
              <span className="text-[11px] bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-bold animate-pulse">
                🔴 Canlı
              </span>
            )}
          </div>

          <CourierMap
            lat={courierPos.lat}
            lng={courierPos.lng}
            endLat={ROUTE_END.lat}
            endLng={ROUTE_END.lng}
            delivered={delivered}
          />

          {/* GPS bilgi satırı */}
          {latestGps && (
            <div className="mt-3 bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Son GPS Güncellemesi</p>
                <p className="text-xs font-mono text-gray-600 mt-0.5">
                  📍 {courierPos.lat.toFixed(5)}, {courierPos.lng.toFixed(5)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-400 font-medium">İlerleme</p>
                <p className="text-sm font-bold text-orange-500">
                  %{latestGps.progress}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Teslim sonrası özet */}
        {delivered && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <p className="text-4xl mb-3">✨</p>
            <h3 className="font-extrabold text-green-800 text-lg mb-1">
              Dopamin döngüsü tamamlandı!
            </h3>
            <p className="text-green-600 text-sm mb-5">
              Gerçek bir satın alma yapmadan alışveriş heyecanının tamamını yaşadınız.
              Cüzdanınız sizi teşekkür ediyor. 💚
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              🛍️ Alışverişe Devam Et
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
