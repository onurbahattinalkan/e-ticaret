#!/usr/bin/env bash
# =============================================================================
# local_run.sh — Alışveriş Dopamin Simülatörü Yerel Başlatma Scripti
#
# Başlatılan servisler:
#   1. Redis         — Celery broker + WebSocket Pub/Sub
#   2. FastAPI       — uvicorn --reload (port 8000)
#   3. Celery Worker — sipariş durum pipeline'ı
#   4. Vite          — React frontend (port 3000)
#
# Kullanım:
#   chmod +x local_run.sh
#   ./local_run.sh
#
# Çıkış: Ctrl+C tüm süreçleri durdurur.
# =============================================================================

set -euo pipefail

# ── Renkli çıktı ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
step()    { echo -e "\n${CYAN}══ $* ══${NC}"; }

# ── PID takip dizisi — Ctrl+C ile temizlik için ──────────────────────────────
PIDS=()

cleanup() {
    echo ""
    warn "Durdurma sinyali alındı. Tüm servisler kapatılıyor..."
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    # Arka planda kalmış uvicorn / celery süreçlerini de temizle
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
    pkill -f "celery -A app.celery_app" 2>/dev/null || true
    success "Tüm servisler durduruldu."
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── Proje kök dizini ─────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🛍️  Alışveriş Dopamin Simülatörü               ║${NC}"
echo -e "${CYAN}║     Yerel Geliştirme Ortamı Başlatıcı            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# ADIM 0: Ön koşul kontrolleri
# =============================================================================
step "Ön Koşul Kontrolleri"

check_cmd() {
    if ! command -v "$1" &>/dev/null; then
        error "'$1' bulunamadı. Lütfen kurun: $2"
        exit 1
    fi
    success "$1 ✓"
}

check_cmd redis-cli  "sudo apt install redis-server"
check_cmd psql       "sudo apt install postgresql postgresql-client"
check_cmd python3    "sudo apt install python3 python3-pip python3-venv"
check_cmd node       "https://nodejs.org veya: sudo apt install nodejs npm"
check_cmd npm        "sudo apt install npm"

# =============================================================================
# ADIM 1: Redis kontrolü / başlatma
# =============================================================================
step "Redis"

if redis-cli -u "${REDIS_URL:-redis://localhost:6379/0}" ping &>/dev/null; then
    success "Redis zaten çalışıyor."
else
    info "Redis başlatılıyor..."
    if command -v redis-server &>/dev/null; then
        redis-server --daemonize yes --logfile /tmp/dopamin-redis.log
        sleep 1
        if redis-cli ping &>/dev/null; then
            success "Redis başlatıldı."
        else
            error "Redis başlatılamadı. Log: /tmp/dopamin-redis.log"
            exit 1
        fi
    else
        error "redis-server bulunamadı. 'sudo apt install redis-server' çalıştırın."
        exit 1
    fi
fi

# =============================================================================
# ADIM 2: PostgreSQL — veritabanı oluşturma
# =============================================================================
step "PostgreSQL"

# .env dosyasından değerleri oku (varsa)
ENV_FILE="$BACKEND_DIR/.env"
if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
fi

PG_USER="${POSTGRES_USER:-postgres}"
PG_PASS="${POSTGRES_PASSWORD:-postgres}"
PG_HOST="${POSTGRES_HOST:-localhost}"
PG_PORT="${POSTGRES_PORT:-5432}"
PG_DB="${POSTGRES_DB:-dopamin_simulator}"

export PGPASSWORD="$PG_PASS"

# PostgreSQL bağlantı kontrolü
if ! psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -c '\q' 2>/dev/null; then
    error "PostgreSQL'e bağlanılamadı. Kullanıcı: $PG_USER, Host: $PG_HOST:$PG_PORT"
    error "PostgreSQL çalışıyor mu? 'sudo service postgresql start' veya 'sudo systemctl start postgresql'"
    exit 1
fi
success "PostgreSQL bağlantısı ✓"

# Veritabanı yoksa oluştur
if psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" \
       -lqt 2>/dev/null | cut -d'|' -f1 | grep -qw "$PG_DB"; then
    success "Veritabanı '$PG_DB' zaten mevcut."
else
    info "Veritabanı '$PG_DB' oluşturuluyor..."
    psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" \
         -c "CREATE DATABASE $PG_DB;" 2>/dev/null
    success "Veritabanı oluşturuldu: $PG_DB"
fi

unset PGPASSWORD

# =============================================================================
# ADIM 3: Python sanal ortamı ve bağımlılıklar
# =============================================================================
step "Python Sanal Ortamı"

VENV_DIR="$BACKEND_DIR/venv"

if [[ ! -d "$VENV_DIR" ]]; then
    info "Sanal ortam oluşturuluyor: $VENV_DIR"
    python3 -m venv "$VENV_DIR"
    success "Sanal ortam oluşturuldu."
else
    success "Sanal ortam zaten mevcut."
fi

# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

info "Python bağımlılıkları kontrol ediliyor..."
pip install -q --upgrade pip
pip install -q -r "$BACKEND_DIR/requirements.txt"
success "Python bağımlılıkları hazır."

# =============================================================================
# ADIM 4: Veritabanı tabloları ve seed verisi
# =============================================================================
step "Veritabanı Tabloları ve Seed"

cd "$BACKEND_DIR"

info "Tablolar oluşturuluyor (mevcutsa atlanır)..."
python3 -c "
from app.database import Base, engine
import app.models  # noqa: modelleri kaydet
Base.metadata.create_all(bind=engine)
print('[OK]    Tablolar hazır.')
"

info "Seed verisi yükleniyor (mevcutsa atlanır)..."
python3 -m app.seed

# =============================================================================
# ADIM 5: FastAPI (uvicorn) başlatma
# =============================================================================
step "FastAPI Sunucusu (port 8000)"

LOG_UVICORN="/tmp/dopamin-uvicorn.log"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload \
    > "$LOG_UVICORN" 2>&1 &
UVICORN_PID=$!
PIDS+=("$UVICORN_PID")

# uvicorn'un gerçekten ayağa kalktığından emin ol
info "uvicorn başlatılıyor (PID: $UVICORN_PID)..."
for i in {1..15}; do
    sleep 1
    if curl -sf http://localhost:8000/ &>/dev/null; then
        success "FastAPI hazır → http://localhost:8000"
        success "Swagger UI   → http://localhost:8000/docs"
        break
    fi
    if ! kill -0 "$UVICORN_PID" 2>/dev/null; then
        error "uvicorn beklenmedik şekilde durdu. Log: $LOG_UVICORN"
        cat "$LOG_UVICORN" | tail -20
        exit 1
    fi
    if [[ $i -eq 15 ]]; then
        warn "uvicorn 15 sn içinde yanıt vermedi. Log: $LOG_UVICORN"
    fi
done

# =============================================================================
# ADIM 6: Celery Worker başlatma
# =============================================================================
step "Celery Worker"

LOG_CELERY="/tmp/dopamin-celery.log"
celery -A app.celery_app worker \
    --loglevel=info \
    --concurrency=2 \
    > "$LOG_CELERY" 2>&1 &
CELERY_PID=$!
PIDS+=("$CELERY_PID")

info "Celery worker başlatılıyor (PID: $CELERY_PID)..."
sleep 3

if ! kill -0 "$CELERY_PID" 2>/dev/null; then
    error "Celery worker başlatılamadı. Log: $LOG_CELERY"
    cat "$LOG_CELERY" | tail -20
    exit 1
fi
success "Celery worker hazır."
info "Sipariş pipeline gecikmeleri:"
info "  Hazırlanıyor  : ${ORDER_DELAY_HAZIRLANIYOR:-10}s"
info "  Kurye Yola Çıktı: ${ORDER_DELAY_KURYE:-30}s"
info "  Teslim Edildi : ${ORDER_DELAY_TESLIM:-50}s"

# =============================================================================
# ADIM 7: Frontend (Vite) başlatma
# =============================================================================
step "React Frontend (port 3000)"

cd "$FRONTEND_DIR"

if [[ ! -d "node_modules" ]]; then
    info "npm bağımlılıkları kuruluyor..."
    npm install --silent
    success "npm bağımlılıkları kuruldu."
else
    success "node_modules zaten mevcut."
fi

LOG_VITE="/tmp/dopamin-vite.log"
npm run dev > "$LOG_VITE" 2>&1 &
VITE_PID=$!
PIDS+=("$VITE_PID")

info "Vite başlatılıyor (PID: $VITE_PID)..."
for i in {1..20}; do
    sleep 1
    if curl -sf http://localhost:3000/ &>/dev/null; then
        success "Frontend hazır → http://localhost:3000"
        break
    fi
    if ! kill -0 "$VITE_PID" 2>/dev/null; then
        error "Vite beklenmedik şekilde durdu. Log: $LOG_VITE"
        cat "$LOG_VITE" | tail -20
        exit 1
    fi
    if [[ $i -eq 20 ]]; then
        warn "Vite 20 sn içinde yanıt vermedi. Log: $LOG_VITE"
    fi
done

# =============================================================================
# ÖZET
# =============================================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅  Tüm servisler başarıyla başlatıldı!         ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Frontend   →  http://localhost:3000             ║${NC}"
echo -e "${GREEN}║  API        →  http://localhost:8000             ║${NC}"
echo -e "${GREEN}║  Swagger    →  http://localhost:8000/docs        ║${NC}"
echo -e "${GREEN}║  WebSocket  →  ws://localhost:8000/ws/tracking/* ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Loglar:                                         ║${NC}"
echo -e "${GREEN}║  uvicorn  →  /tmp/dopamin-uvicorn.log            ║${NC}"
echo -e "${GREEN}║  celery   →  /tmp/dopamin-celery.log             ║${NC}"
echo -e "${GREEN}║  vite     →  /tmp/dopamin-vite.log               ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Durdurmak için: Ctrl+C                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Tüm arka plan süreçleri bitene kadar bekle
wait
