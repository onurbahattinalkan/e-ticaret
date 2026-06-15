/**
 * Leaflet tabanlı kurye takip haritası.
 *
 * - Emoji divIcon kullanılır (Leaflet'in PNG marker path sorununu önler).
 * - MapFollower bileşeni, her GPS güncellemesinde haritayı akıcıca kurye
 *   konumuna kaydırır.
 * - Teslimat tamamlandığında kurye ikonu kaybolur, ev ikonu öne çıkar.
 */
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Emoji tabanlı ikonlar — PNG yolu sorunu yaşatmaz
const courierIcon = L.divIcon({
  html: '<div style="font-size:2.2rem;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));transition:all 0.5s">🚚</div>',
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
})

const homeIcon = L.divIcon({
  html: '<div style="font-size:2rem;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">🏠</div>',
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
})

const deliveredIcon = L.divIcon({
  html: '<div style="font-size:2.2rem;line-height:1">✅</div>',
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

/** Haritayı kurye konumuna akıcı şekilde kaydıran yardımcı bileşen */
function MapFollower({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true, duration: 1.2 })
  }, [lat, lng, map])
  return null
}

export default function CourierMap({ lat, lng, endLat, endLng, delivered }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      style={{ height: '380px', width: '100%', borderRadius: '0.75rem' }}
      scrollWheelZoom={false}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapFollower lat={delivered ? endLat : lat} lng={delivered ? endLng : lng} />

      {/* Kurye marker — teslimat tamamlandığında gizlenir */}
      {!delivered && (
        <Marker position={[lat, lng]} icon={courierIcon}>
          <Popup>📍 Kuryeniz yolda!</Popup>
        </Marker>
      )}

      {/* Teslimat noktası */}
      <Marker
        position={[endLat, endLng]}
        icon={delivered ? deliveredIcon : homeIcon}
      >
        <Popup>{delivered ? '🎉 Teslim edildi!' : '🏠 Teslimat adresi'}</Popup>
      </Marker>
    </MapContainer>
  )
}
