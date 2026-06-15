"""Sepet yönetimi API uç noktaları."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CartItem, Product
from app.schemas import CartItemAdd, CartItemOut

router = APIRouter(prefix="/cart", tags=["Sepet"])


def _cart_item_to_out(item: CartItem) -> CartItemOut:
    """CartItem ORM nesnesini yanıt şemasına dönüştürür."""
    return CartItemOut(
        id=item.id,
        product_id=item.product_id,
        product_name=item.product.name,
        quantity=item.quantity,
        unit_price=float(item.product.price),
        line_total=float(item.product.price) * item.quantity,
    )


@router.get("/{user_id}", response_model=list[CartItemOut])
def get_cart(user_id: int, db: Session = Depends(get_db)) -> list[CartItemOut]:
    """Kullanıcının sepetini getirir."""
    items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    return [_cart_item_to_out(i) for i in items]


@router.post("/{user_id}", response_model=CartItemOut, status_code=201)
def add_to_cart(
    user_id: int,
    payload: CartItemAdd,
    db: Session = Depends(get_db),
) -> CartItemOut:
    """Sepete ürün ekler. Aynı ürün zaten varsa miktarını artırır."""
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı.")

    existing = (
        db.query(CartItem)
        .filter(CartItem.user_id == user_id, CartItem.product_id == payload.product_id)
        .first()
    )

    if existing:
        existing.quantity += payload.quantity
        db.commit()
        db.refresh(existing)
        return _cart_item_to_out(existing)

    cart_item = CartItem(
        user_id=user_id,
        product_id=payload.product_id,
        quantity=payload.quantity,
    )
    db.add(cart_item)
    db.commit()
    db.refresh(cart_item)
    return _cart_item_to_out(cart_item)


@router.delete("/{user_id}", status_code=204)
def clear_cart(user_id: int, db: Session = Depends(get_db)) -> None:
    """Kullanıcının sepetini tamamen boşaltır."""
    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.commit()
