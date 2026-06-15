# Adım 3: İstemci Arayüzü (Frontend)

## Hedef
[cite_start]Kullanıcının alışkın olduğu büyük pazar yerlerinin tasarım dilini taklit eden, sepet ve ödeme adımlarını barındıran React (veya Vue) uygulamasının geliştirilmesi[cite: 64].

## Görevler

1.  **Frontend İskeleti:**
    * `Vite` kullanarak yeni bir proje oluştur. Tailwind CSS entegrasyonunu yap.
2.  **Sayfalar ve Bileşenler:**
    * **Katalog Sayfası:** Backend'den (`GET /products`) dönen ürünleri büyük görseller ve fiyatlarla listele.
    * **Sepet ve Ödeme (Checkout):** Kullanıcı ürünleri sepete eklesin. [cite_start]"Satın Al" butonuna basıldığında ekrana sahte bir "3D Secure Banka Onayı" yüklenme (spinner) animasyonu getir[cite: 121, 122]. [cite_start]Gerçek para tahsilatı sıfır olmalıdır[cite: 42].
    * **Kargo Zaman Tüneli (Harita):** Ödeme onaylandıktan sonra kullanıcıyı takip sayfasına yönlendir. [cite_start]Backend'deki WebSocket uç noktasına bağlanarak gelen sahte GPS koordinatlarını ekrandaki basit bir harita bileşeni (örn. Leaflet.js) üzerinde hareket eden bir kurye ikonu olarak render et[cite: 84].
3.  **Fayda Değerlendirmesi (Bilişsel Sürtünme):**
    * [cite_start]Sepete ürün eklendiğinde basit bir pop-up çıkartarak kullanıcıya "Buna gerçekten ihtiyacım var mı?" veya "Bunun daha ucuz alternatifi var mı?" sorularını yönelt[cite: 64].