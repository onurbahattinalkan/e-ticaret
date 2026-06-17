"""Alışveriş Dopamin Simülatörü — FastAPI uygulama giriş noktası.

Çalıştırma:
    uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import Base, engine
from app.auth import router as auth_router
from app.routers import cart, checkout, orders, products, tracking


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncGenerator[None, None]:
    """Uygulama başlatılırken tabloları oluşturur ve eksik sütunları ekler."""
    Base.metadata.create_all(bind=engine)

    # create_all() mevcut tablolara yeni sütun eklemez; burada idempotent olarak ekliyoruz.
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE",
        ]:
            conn.execute(text(stmt))
        conn.commit()

    yield


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# React frontend'in API'ye erişebilmesi için CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları kaydet
app.include_router(auth_router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(checkout.router)
app.include_router(orders.router)
app.include_router(tracking.router)


@app.get("/", tags=["Sağlık Kontrolü"])
def health_check() -> dict:
    """API'nin çalıştığını doğrulayan basit sağlık kontrolü."""
    return {
        "status": "ok",
        "app": settings.APP_TITLE,
        "version": settings.APP_VERSION,
    }
