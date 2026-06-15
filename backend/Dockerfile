# ==============================================================================
# Backend Dockerfile — FastAPI (uvicorn) ve Celery Worker için ortak imaj.
#
# Kullanım:
#   uvicorn  →  docker-compose.yml'deki 'backend' servisi (varsayılan CMD)
#   celery   →  docker-compose.yml'deki 'celery' servisi (command override)
# ==============================================================================

FROM python:3.12-slim

WORKDIR /app

# psycopg2-binary kendi libpq'sunu paketler; ek sistem bağımlılığı gerekmez.
# Yalnızca pip güncellenir ve bağımlılıklar kurulur.
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# Kaynak kodunu kopyala
# (docker-compose geliştirme modunda ./backend/app:/app/app bind mount ile ezilir)
COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 8000

# entrypoint.sh:
#   - İlk argüman 'uvicorn' → tablo + seed çalıştırır
#   - Sonra exec ile CMD'e geçer
ENTRYPOINT ["./entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
