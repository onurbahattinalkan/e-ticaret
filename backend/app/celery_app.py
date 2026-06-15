"""Celery uygulama konfigürasyonu.

Broker ve backend olarak yerel Redis kullanılır.

Worker başlatma:
    celery -A app.celery_app worker --loglevel=info
"""

from celery import Celery

from app.config import settings

celery = Celery(
    "dopamin_simulator",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Istanbul",
    enable_utc=True,
)

# tasks modülünü otomatik keşfet
celery.autodiscover_tasks(["app"])
