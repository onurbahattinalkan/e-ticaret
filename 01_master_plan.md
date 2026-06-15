# Alışveriş Dopamin Simülatörü - Master Plan

## Proje Özeti
[cite_start]Kullanıcıların e-ticaret sitelerindeki satın alma süreçlerini (arama, beklenti, sepeti doldurma) simüle ederek alışveriş bağımlılığını finansal zarar görmeden tatmin etmeyi amaçlayan dijital sağlık platformudur[cite: 6, 11].

## Sistem Mimarisi ve Teknoloji Yığını (Local Environment)

| Katman | Teknoloji | Görev Tanımı |
| :--- | :--- | :--- |
| **Backend** | Python (FastAPI) | [cite_start]Asenkron API uç noktalarının (endpoints) yönetimi[cite: 118]. |
| **Frontend** | React.js (veya Vue.js) | [cite_start]E-ticaret arayüzü ve gerçek zamanlı kurye takibi render işlemleri[cite: 117]. |
| **Veritabanı** | PostgreSQL | [cite_start]Kullanıcı profilleri, sanal bakiyeler ve sahte sipariş dökümlerinin saklanması[cite: 118]. |
| **Önbellek (Cache)** | Redis | [cite_start]Sık aranan ürünler ve WebSocket bağlantılarının yönetimi[cite: 118]. |
| **Görev Kuyruğu**| Celery + Redis | [cite_start]Sipariş statülerinin ("Hazırlanıyor", "Yola Çıktı") asenkron arka plan görevleriyle güncellenmesi[cite: 118, 128]. |

*Terminoloji Notu:* * **Asenkron Görev (Asynchronous Task):** Ana program akışını durdurmadan arka planda bağımsız olarak çalışan işlemler bütünü.
* **Pub/Sub (Publish/Subscribe):** Mesajların göndericiden (yayıncı) doğrudan belirli alıcılara değil, aracılar üzerinden abone olan tüm dinleyicilere iletildiği mesajlaşma modeli.

## Claude Code İçin Temel Kurallar
1.  **Modülerlik:** Klasör yapısı `backend/` ve `frontend/` olarak ayrılmalıdır.
2.  **Dil:** Backend için varsayılan dil Python'dır. Kodlar PEP 8 standartlarına uygun, temiz ve yorum satırlarıyla açıklanmış olmalıdır.
3.  **Ortam:** Tüm işlemler şu an için `localhost` (Ubuntu/Linux) üzerinde çalışacak şekilde yapılandırılmalıdır. Docker Compose veya sanal ortam (venv) kullanılmalıdır.