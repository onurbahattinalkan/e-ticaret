# Adım 1: Backend ve Veritabanı İnşası

## Hedef
FastAPI ve PostgreSQL kullanarak temel e-ticaret döngüsünü yönetecek RESTful API'lerin yerel ortamda ayağa kaldırılması.

## Görevler

1.  **Proje İskeleti ve Bağımlılıklar:**
    * Python sanal ortamı (`venv`) oluştur.
    * `fastapi`, `uvicorn`, `sqlalchemy`, `psycopg2-binary`, `pydantic` kütüphanelerini kur ve `requirements.txt` dosyasına ekle.
2.  **Veritabanı Modelleri (SQLAlchemy):**
    * `User`: (id, username, total_saved_balance)
    * `Product`: (id, name, description, price, image_url)
    * `Order`: (id, user_id, total_amount, status)
3.  **Çekirdek API Uç Noktaları:**
    * `GET /products`: Sahte ürün kataloğunu listele.
    * [cite_start]`POST /checkout`: Misafir ödeme (Guest Checkout) döngüsünü başlat[cite: 156]. [cite_start]Bu uç nokta, ödeme alınmış gibi davranarak sahte bir 3D Secure onay süreci simüle etmeli (sistemi `sleep` veya `asyncio.sleep` ile 2-3 saniye bekleterek beynin beklenti dopaminini tetiklemeli)[cite: 121, 122]. [cite_start]Hiçbir gerçek kredi kartı verisi işlenmemelidir[cite: 123].
    * [cite_start]İşlem başarılı olduğunda siparişi veritabanına "Alındı" statüsü ile kaydet[cite: 126].