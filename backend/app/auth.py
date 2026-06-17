"""Kimlik doğrulama modülü — şifre hashleme, JWT üretimi ve auth endpoint'leri.

Endpoint'ler:
    POST /api/auth/register  → Yeni kullanıcı kaydı
    POST /api/auth/login     → Giriş ve JWT token üretimi
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import (
    AuthRegisterRequest,
    AuthLoginRequest,
    AuthTokenResponse,
    AuthUserOut,
)

# ── Şifre hashleme ──────────────────────────────────────────────────────

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Düz metin şifreyi bcrypt ile hashler."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Düz metin şifreyi hash ile karşılaştırır."""
    return pwd_context.verify(plain, hashed)


# ── JWT token ───────────────────────────────────────────────────────────

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_access_token(user_id: int, email: str) -> str:
    """Verilen kullanıcı bilgileriyle JWT access token üretir."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": str(user_id), "email": email, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


# ── Dependency: mevcut kullanıcıyı çöz ─────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Authorization header'daki Bearer token'ı doğrular ve User nesnesini döndürür."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz veya süresi dolmuş token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


# ── Router ──────────────────────────────────────────────────────────────

router = APIRouter(prefix="/api/auth", tags=["Kimlik Doğrulama"])


@router.post("/register", response_model=AuthTokenResponse, status_code=201)
def register(body: AuthRegisterRequest, db: Session = Depends(get_db)):
    """Yeni kullanıcı kaydı oluşturur ve JWT token döndürür."""

    # E-posta benzersizlik kontrolü
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu e-posta adresi zaten kayıtlı",
        )

    user = User(
        username=body.email.split("@")[0],  # e-postanın yerel kısmı username olur
        email=body.email,
        hashed_password=hash_password(body.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=AuthUserOut(
            id=user.id,
            email=user.email,
            username=user.username,
            total_saved_balance=float(user.total_saved_balance),
        ),
    )


@router.post("/login", response_model=AuthTokenResponse)
def login(body: AuthLoginRequest, db: Session = Depends(get_db)):
    """E-posta + şifre ile giriş yapar ve JWT token döndürür."""

    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz e-posta veya şifre",
        )

    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz e-posta veya şifre",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesap devre dışı",
        )

    token = create_access_token(user.id, user.email)
    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=AuthUserOut(
            id=user.id,
            email=user.email,
            username=user.username,
            total_saved_balance=float(user.total_saved_balance),
        ),
    )


@router.get("/me", response_model=AuthUserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Token sahibi kullanıcının bilgilerini döndürür."""
    return AuthUserOut(
        id=current_user.id,
        email=current_user.email or "",
        username=current_user.username,
        total_saved_balance=float(current_user.total_saved_balance),
    )
