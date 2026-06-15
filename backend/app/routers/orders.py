"""Sipariş geçmişi API uç noktaları."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order
from app.schemas import OrderOut

router = APIRouter(prefix="/orders", tags=["Siparişler"])


@router.get("/{user_id}", response_model=list[OrderOut])
def list_orders(user_id: int, db: Session = Depends(get_db)) -> list[Order]:
    """Kullanıcının tüm sipariş geçmişini döndürür."""
    return (
        db.query(Order)
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/detail/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)) -> Order:
    """Tek bir siparişin detayını döndürür."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı.")
    return order
