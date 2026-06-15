"""Veritabanına sahte ürün ve demo kullanıcı ekleyen seed betiği.

Kullanım:
    python -m app.seed
"""

from app.database import SessionLocal, engine, Base
from app.models import Product, User


DEMO_PRODUCTS = [
    {
        "name": "Kablosuz Kulaklık (Sahte)",
        "description": "Üstün ses kalitesi sunan premium kablosuz kulaklık simülasyonu.",
        "price": 1299.99,
        "image_url": "https://placehold.co/400x400?text=Kulaklık",
        "category": "Elektronik",
    },
    {
        "name": "Akıllı Saat (Sahte)",
        "description": "Fitness takibi ve bildirim özellikli akıllı saat simülasyonu.",
        "price": 2499.00,
        "image_url": "https://placehold.co/400x400?text=Saat",
        "category": "Elektronik",
    },
    {
        "name": "Koşu Ayakkabısı (Sahte)",
        "description": "Ultra hafif, nefes alan koşu ayakkabısı simülasyonu.",
        "price": 899.50,
        "image_url": "https://placehold.co/400x400?text=Ayakkabı",
        "category": "Giyim",
    },
    {
        "name": "Mekanik Klavye (Sahte)",
        "description": "RGB aydınlatmalı mekanik klavye simülasyonu.",
        "price": 1750.00,
        "image_url": "https://placehold.co/400x400?text=Klavye",
        "category": "Elektronik",
    },
    {
        "name": "Yoga Matı (Sahte)",
        "description": "Kaymaz yüzeyli premium yoga matı simülasyonu.",
        "price": 349.90,
        "image_url": "https://placehold.co/400x400?text=Yoga+Matı",
        "category": "Spor",
    },
    {
        "name": "Deri Sırt Çantası (Sahte)",
        "description": "El yapımı gerçek deri sırt çantası simülasyonu.",
        "price": 1899.00,
        "image_url": "https://placehold.co/400x400?text=Çanta",
        "category": "Aksesuar",
    },
    {
        "name": "Espresso Makinesi (Sahte)",
        "description": "Profesyonel espresso makinesi simülasyonu.",
        "price": 4500.00,
        "image_url": "https://placehold.co/400x400?text=Espresso",
        "category": "Ev & Yaşam",
    },
    {
        "name": "Roman Seti (Sahte)",
        "description": "Dünya klasikleri 10'lu roman seti simülasyonu.",
        "price": 259.90,
        "image_url": "https://placehold.co/400x400?text=Kitap",
        "category": "Kitap",
    },
]


def seed() -> None:
    """Tabloları oluşturur ve örnek verileri ekler."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Zaten veri varsa tekrar ekleme
        if db.query(Product).first():
            print("Veritabanında zaten ürün mevcut — seed atlanıyor.")
            return

        # Demo kullanıcı
        demo_user = User(username="misafir", total_saved_balance=0)
        db.add(demo_user)

        # Ürünleri ekle
        for product_data in DEMO_PRODUCTS:
            db.add(Product(**product_data))

        db.commit()
        print(f"{len(DEMO_PRODUCTS)} ürün ve 1 demo kullanıcı eklendi.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
