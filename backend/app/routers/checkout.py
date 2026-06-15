"""Misafir ödeme (Guest Checkout) simülasyonu.

Bu modül gerçek bir ödeme İŞLEMEZ.
Hiçbir kredi kartı verisi kabul edilmez veya saklanmaz.
asyncio.sleep ile sahte 3D Secure onay bekleme süresi simüle edilerek
kullanıcının "beklenti dopamini" tetiklenir.
"""

import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import CartItem, Order, OrderItem, User
from app.schemas import CheckoutRequest, CheckoutResponse

router = APIRouter(prefix="/checkout", tags=["Ödeme Simülasyonu"])


@router.post("/", response_model=CheckoutResponse)
async def guest_checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
) -> CheckoutResponse:
    """Misafir ödeme döngüsünü simüle eder.

    Adımlar:
        1. Kullanıcının sepetinde ürün olup olmadığını kontrol et.
        2. asyncio.sleep ile sahte 3D Secure bekleme süresi uygula.
        3. Siparişi "Alındı" statüsüyle veritabanına kaydet.
        4. Sepeti temizle.
        5. Kullanıcının sanal bakiyesine tasarruf tutarını ekle.
    """
    # Kullanıcı kontrolü
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    # Sepet kontrolü
    cart_items = (
        db.query(CartItem).filter(CartItem.user_id == payload.user_id).all()
    )
    if not cart_items:
        raise HTTPException(
            status_code=400,
            detail="Sepetiniz boş. Ödeme simülasyonu başlatılamıyor.",
        )

    # ── 3D Secure simülasyonu ────────────────────────────────────────
    # Gerçek ödeme YAPILMAZ. Bekleme süresi dopamin beklentisini tetikler.
    await asyncio.sleep(settings.CHECKOUT_DELAY_SECONDS)

    # Toplam tutarı hesapla
    total = sum(
        float(item.product.price) * item.quantity for item in cart_items
    )

    # Sipariş oluştur
    order = Order(
        user_id=payload.user_id,
        total_amount=total,
        status="Alındı",
    )
    db.add(order)
    db.flush()  # order.id atanması için

    # Sipariş kalemlerini ekle
    for cart_item in cart_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            unit_price=float(cart_item.product.price),
        )
        db.add(order_item)

    # Sanal bakiyeyi güncelle (kullanıcı bu kadar "tasarruf" etti)
    user.total_saved_balance = float(user.total_saved_balance) + total

    # Sepeti temizle
    db.query(CartItem).filter(CartItem.user_id == payload.user_id).delete()

    db.commit()
    db.refresh(order)

    # Celery arka plan görevini tetikle — sipariş durum pipeline'ı başlar.
    # Sipariş zaten DB'ye kaydedildi; Redis erişim hatası pipeline'ı engellese
    # de siparişin kendisi kaybolmaz — sadece loglayıp devam ediyoruz.
    try:
        from app.tasks import process_order_pipeline
        process_order_pipeline.delay(order.id)
    except Exception as exc:  # noqa: BLE001
        import logging
        logging.getLogger(__name__).error(
            "Celery task gönderilemedi (order_id=%s): %s", order.id, exc
        )

    return CheckoutResponse(
        order_id=order.id,
        status=order.status,
        total_amount=total,
        message=(
            f"Siparişiniz başarıyla alındı! "
            f"Toplam {total:.2f} TL tasarruf ettiniz. "
            f"(3D Secure onayı simüle edildi)"
        ),
        simulated_3d_secure=True,
    )
