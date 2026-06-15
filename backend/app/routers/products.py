"""Ürün kataloğu API uç noktaları."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product
from app.schemas import ProductOut

router = APIRouter(prefix="/products", tags=["Ürünler"])


@router.get("/", response_model=list[ProductOut])
def list_products(
    category: str | None = None,
    db: Session = Depends(get_db),
) -> list[Product]:
    """Sahte ürün kataloğunu listeler.

    İsteğe bağlı olarak kategoriye göre filtreleme yapılabilir.
    """
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    return query.all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)) -> Product:
    """Tek bir ürünün detayını döndürür."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı.")
    return product
