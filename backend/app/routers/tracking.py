"""Gerçek zamanlı sipariş takibi — WebSocket + Redis Pub/Sub.

Frontend bu endpoint'e bağlanarak sipariş durum güncellemelerini
ve sahte kurye GPS koordinatlarını anlık olarak alır.

Bağlantı:
    ws://localhost:8000/ws/tracking/{order_id}
"""

import asyncio
import json

import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings

router = APIRouter()


@router.websocket("/ws/tracking/{order_id}")
async def tracking_ws(websocket: WebSocket, order_id: int) -> None:
    """Sipariş takibi WebSocket endpoint'i.

    Redis Pub/Sub kanalına (order:{order_id}) abone olur.
    Celery worker'ın yayınladığı status ve GPS mesajlarını
    gerçek zamanlı olarak istemciye iletir.
    'delivered' mesajı geldiğinde bağlantıyı düzgünce kapatır.
    """
    await websocket.accept()

    r = aioredis.from_url(settings.REDIS_URL)
    pubsub = r.pubsub()
    channel = f"order:{order_id}"

    try:
        await pubsub.subscribe(channel)

        # Bağlantı onay mesajı
        await websocket.send_json({
            "type": "connected",
            "message": f"Sipariş #{order_id} takibi başladı.",
            "channel": channel,
        })

        # Pub/Sub mesajlarını dinle ve istemciye ilet
        while True:
            message = await pubsub.get_message(
                ignore_subscribe_messages=True, timeout=1.0
            )

            if message and message["type"] == "message":
                data = json.loads(message["data"])

                try:
                    await websocket.send_json(data)
                except (WebSocketDisconnect, RuntimeError):
                    # İstemci send_json sırasında bağlantıyı kopardıysa temizliğe geç
                    break

                # Teslimat tamamlandıysa bağlantıyı kapat
                if data.get("type") == "delivered":
                    await websocket.close()
                    break

            # CPU'yu boşa yormamak için kısa bekleme
            await asyncio.sleep(0.1)

    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
        await r.close()
