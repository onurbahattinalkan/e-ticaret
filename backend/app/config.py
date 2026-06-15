"""Uygulama yapılandırma ayarları."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Ortam değişkenlerinden okunan uygulama ayarları."""

    APP_TITLE: str = "Alışveriş Dopamin Simülatörü API"
    APP_VERSION: str = "0.1.0"

    # PostgreSQL bağlantı bilgileri
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "dopamin_simulator"

    @property
    def database_url(self) -> str:
        """SQLAlchemy için veritabanı bağlantı URL'sini döndürür."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # 3D Secure simülasyon bekleme süresi (saniye)
    CHECKOUT_DELAY_SECONDS: float = 2.5

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery sipariş durum gecikmeler (saniye — yerel test değerleri)
    ORDER_DELAY_HAZIRLANIYOR: int = 10
    ORDER_DELAY_KURYE: int = 30
    ORDER_DELAY_TESLIM: int = 50

    # Sahte GPS parametreleri
    GPS_UPDATE_INTERVAL: float = 2.0  # saniye aralıkla konum güncellemesi
    GPS_TOTAL_STEPS: int = 10  # kaç adımda hedefe ulaşılır

    # Kurgusal rota: Kadıköy → Beşiktaş (İstanbul)
    GPS_START_LAT: float = 40.9907
    GPS_START_LNG: float = 29.0230
    GPS_END_LAT: float = 41.0422
    GPS_END_LNG: float = 29.0050

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
