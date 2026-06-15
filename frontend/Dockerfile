# ==============================================================================
# Frontend Dockerfile — Vite geliştirme sunucusu.
#
# Hot-reload için docker-compose.yml'de ./frontend:/app bind mount kullanılır.
# node_modules anonymous volume ile ezilmeden korunur.
# ==============================================================================

FROM node:20-alpine

WORKDIR /app

# Bağımlılıkları önce kopyala — değişmeyen katmanlar cache'de kalır.
COPY package*.json ./
RUN npm install

# Kaynak dosyaları kopyala
# (docker-compose geliştirme modunda ./frontend:/app bind mount ile ezilir)
COPY . .

EXPOSE 3000

# --host 0.0.0.0: container dışından (host makine) erişim için zorunlu.
# VITE_USE_POLLING ortam değişkeni docker-compose'dan enjekte edilir.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
