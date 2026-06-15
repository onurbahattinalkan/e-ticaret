#!/bin/bash
# ==============================================================================
# Backend container başlangıç scripti.
#
# Davranış:
#   - İlk argüman "uvicorn" ise: tabloları oluşturur, seed verisini yükler,
#     ardından uvicorn'u başlatır.
#   - Diğer durumlarda (Celery vb.): doğrudan CMD'e geçer.
#
# Bu ayrım sayesinde celery servisi gereksiz yere DB işlemi yapmaz.
# ==============================================================================
set -e

if [[ "$1" == "uvicorn" ]]; then
    echo "==> [entrypoint] Veritabanı tabloları oluşturuluyor..."
    python -c "
from app.database import Base, engine
import app.models  # noqa: tüm modelleri metadata'ya kaydet
Base.metadata.create_all(bind=engine)
print('    Tablolar hazır.')
"
    echo "==> [entrypoint] Seed verisi kontrol ediliyor..."
    python -m app.seed
fi

echo "==> [entrypoint] Başlatılıyor: $*"
exec "$@"
