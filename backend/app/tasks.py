"""Celery arka plan görevleri.

Sipariş durum pipeline'ı:
    Alındı → Hazırlanıyor → Kurye Yola Çıktı → Teslim Edildi

'Kurye Yola Çıktı' aşamasında sahte GPS koordinatları Redis Pub/Sub
kanalına yayınlanır; WebSocket handler bu kanala abone olarak
frontend'e gerçek zamanlı konum akışı sağlar.
"""

import json
import time

import redis

from app.celery_app import celery
from app.config import settings
from app.database import SessionLocal
from app.models import Order

# socket_connect_timeout: bağlantı kurma zaman aşımı (sn)
# socket_timeout: okuma/yazma zaman aşımı (sn)
# Bu değerler olmadan Redis erişilemez olduğunda Celery worker sonsuza kadar bloklanır.
_redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    socket_connect_timeout=5,
    socket_timeout=5,
)


def _update_order_status(order_id: int, new_status: str) -> None:
    """Sipariş statüsünü veritabanında günceller ve Pub/Sub ile yayınlar."""
    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return
        order.status = new_status
        db.commit()
    finally:
        db.close()

    # Durum değişikliğini Redis Pub/Sub kanalına yayınla
    _redis_client.publish(
        f"order:{order_id}",
        json.dumps({"type": "status", "status": new_status}),
    )


def _publish_gps_track(order_id: int) -> None:
    """Kurgusal rota üzerinde sahte GPS koordinatları üretir ve yayınlar.

    Başlangıç noktasından (Kadıköy) hedef noktaya (Beşiktaş) doğru
    lineer interpolasyon ile ilerleyen koordinatlar Redis Pub/Sub
    kanalı üzerinden stream edilir.
    """
    channel = f"order:{order_id}"
    total_steps = settings.GPS_TOTAL_STEPS

    for step in range(1, total_steps + 1):
        progress = step / total_steps

        lat = settings.GPS_START_LAT + (
            (settings.GPS_END_LAT - settings.GPS_START_LAT) * progress
        )
        lng = settings.GPS_START_LNG + (
            (settings.GPS_END_LNG - settings.GPS_START_LNG) * progress
        )

        _redis_client.publish(
            channel,
            json.dumps({
                "type": "gps",
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "progress": round(progress * 100, 1),
                "step": step,
                "total_steps": total_steps,
            }),
        )
        time.sleep(settings.GPS_UPDATE_INTERVAL)


@celery.task(name="app.tasks.process_order_pipeline")
def process_order_pipeline(order_id: int) -> dict:
    """Checkout sonrası tetiklenen sipariş durum pipeline'ı.

    Zaman çizelgesi (yerel test değerleri):
        +10s  → Hazırlanıyor
        +30s  → Kurye Yola Çıktı  (GPS yayını başlar)
        +50s  → Teslim Edildi
    """
    # ── Aşama 1: Hazırlanıyor ────────────────────────────────────────
    time.sleep(settings.ORDER_DELAY_HAZIRLANIYOR)
    _update_order_status(order_id, "Hazırlanıyor")

    # ── Aşama 2: Kurye Yola Çıktı ───────────────────────────────────
    remaining = settings.ORDER_DELAY_KURYE - settings.ORDER_DELAY_HAZIRLANIYOR
    time.sleep(max(remaining, 0))
    _update_order_status(order_id, "Kurye Yola Çıktı")

    # GPS koordinatlarını yayınla
    _publish_gps_track(order_id)

    # ── Aşama 3: Teslim Edildi ───────────────────────────────────────
    remaining = settings.ORDER_DELAY_TESLIM - settings.ORDER_DELAY_KURYE
    gps_duration = settings.GPS_TOTAL_STEPS * settings.GPS_UPDATE_INTERVAL
    extra_wait = max(remaining - gps_duration, 0)
    time.sleep(extra_wait)

    _update_order_status(order_id, "Teslim Edildi")

    # Teslim sinyali — WebSocket bu mesajı alınca bağlantıyı kapatır
    _redis_client.publish(
        f"order:{order_id}",
        json.dumps({"type": "delivered", "status": "Teslim Edildi"}),
    )

    return {"order_id": order_id, "final_status": "Teslim Edildi"}
