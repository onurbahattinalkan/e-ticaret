"""SQLAlchemy veritabanı motoru ve oturum (session) yönetimi."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

engine = create_engine(
    settings.database_url,
    echo=False,
    # Bağlantı havuzundan alınan her connection'ı kullanmadan önce canlılığını
    # kontrol et. Uzun bekleme veya PostgreSQL yeniden başlatma sonrasında
    # Celery worker'ın stale bağlantı üzerinde OperationalError fırlatmasını önler.
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Tüm SQLAlchemy modellerinin türetileceği temel sınıf."""


def get_db() -> Generator[Session, None, None]:
    """Her istek için bağımsız bir veritabanı oturumu sağlar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
