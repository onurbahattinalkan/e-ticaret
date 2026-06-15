# Adım 2: Asenkron Görevler ve Gerçek Zamanlı Harita

## Hedef
[cite_start]Redis ve Celery kullanarak sipariş durumlarını zamanla değiştirmek ve WebSocket üzerinden arayüze sahte kurye GPS koordinatları basmak[cite: 125, 129, 158].

## Görevler

1.  **Redis ve Celery Konfigürasyonu:**
    * Yerel ortamda Redis sunucusunu bağla.
    * FastAPI uygulamasına Celery entegrasyonunu yap (`celery_worker.py`).
2.  **Sipariş Durum Yönetimi (Background Tasks):**
    * [cite_start]`POST /checkout` işlemi tamamlandığında bir Celery görevi tetikle[cite: 125].
    * [cite_start]*Mantık:* Siparişten 2 dakika (yerel test için 10 saniye) sonra veritabanındaki sipariş statüsünü "Hazırlanıyor" yap[cite: 127]. [cite_start]10 dakika (yerel test için 30 saniye) sonra statüyü "Kurye Yola Çıktı" olarak güncelle[cite: 128].
3.  **WebSocket ve Sahte GPS Üretimi:**
    * FastAPI üzerinde `ws://localhost:8000/ws/tracking/{order_id}` uç noktasını oluştur.
    * [cite_start]Sipariş "Kurye Yola Çıktı" statüsüne geçtiğinde, basit bir matematiksel algoritma ile kurgusal bir başlangıç noktasından (X1, Y1) kullanıcının hedefine (X2, Y2) doğru değişen sahte GPS koordinatları üret[cite: 128].
    * [cite_start]Bu koordinatları WebSocket üzerinden sürekli olarak istemciye (frontend) yayınla[cite: 129].