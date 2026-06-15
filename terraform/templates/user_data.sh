#!/bin/bash
# ==============================================================================
# EC2 User Data — Dopamin Shop Backend Otomatik Başlatma Betiği
#
# ASG tarafından yeni bir EC2 instance başlatıldığında bu script çalışır:
#   1. Docker ve Docker Compose v2'yi kurar
#   2. ECR'den backend imajını çeker (IAM instance profile ile kimlik doğrulama)
#   3. docker-compose.prod.yml oluşturur (Terraform tarafından bake edilen değerlerle)
#   4. FastAPI (uvicorn) ve Celery worker container'larını başlatır
#
# Tüm $${...} ifadeleri Terraform tarafından deploy sırasında gerçek değerlerle
# doldurulur. Bash değişkenleri $${VAR} ile escape edilir.
# ==============================================================================
set -ex

exec > >(tee /var/log/user-data.log) 2>&1
echo "[$(date)] Dopamin Shop EC2 User Data baslatiliyor..."

# ── Docker kurulumu (Amazon Linux 2023) ──────────────────────────────────────

dnf update -y -q
dnf install -y docker

systemctl enable docker
systemctl start docker

# Docker daemon'ın başladığını doğrula
for i in $(seq 1 30); do
  docker info &>/dev/null && break
  echo "Docker baslatiliyor, bekleniyor... ($i/30)"
  sleep 2
done

# ── Docker Compose v2 plugin ─────────────────────────────────────────────────

mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-$(uname -m)" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

echo "Docker Compose versiyon: $(docker compose version)"

# ── ECR girişi ───────────────────────────────────────────────────────────────

aws ecr get-login-password --region ${region} \
  | docker login --username AWS --password-stdin ${ecr_registry}

# ── Uygulama dizini ve Compose dosyası ───────────────────────────────────────

mkdir -p /opt/dopamin-shop
cd /opt/dopamin-shop

# Not: Asagidaki tum degerler Terraform templatefile() tarafindan
# deploy aninda (bake-time) gercek endpoint'lerle doldurulur.
# Container icinde Redis ve PostgreSQL KURULMAZ; yonetilen AWS servisleri kullanilir.

cat > docker-compose.prod.yml << 'COMPOSE_EOF'
services:
  backend:
    image: ${ecr_image}:latest
    restart: always
    ports:
      - "8000:8000"
    environment:
      POSTGRES_HOST: "${rds_endpoint}"
      POSTGRES_PORT: "5432"
      POSTGRES_USER: "${db_username}"
      POSTGRES_PASSWORD: "${db_password}"
      POSTGRES_DB: "${db_name}"
      REDIS_URL: "redis://${redis_endpoint}:6379/0"
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  celery:
    image: ${ecr_image}:latest
    restart: always
    entrypoint: ["./entrypoint.sh"]
    command: ["celery", "-A", "app.celery_app", "worker", "--loglevel=info", "--concurrency=2"]
    environment:
      POSTGRES_HOST: "${rds_endpoint}"
      POSTGRES_PORT: "5432"
      POSTGRES_USER: "${db_username}"
      POSTGRES_PASSWORD: "${db_password}"
      POSTGRES_DB: "${db_name}"
      REDIS_URL: "redis://${redis_endpoint}:6379/0"
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
COMPOSE_EOF

# ── Container'ları çek ve başlat ─────────────────────────────────────────────

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

echo "[$(date)] Dopamin Shop backend basariyla baslatildi."
echo "  Backend:  http://localhost:8000"
echo "  RDS:      ${rds_endpoint}"
echo "  Redis:    ${redis_endpoint}"
