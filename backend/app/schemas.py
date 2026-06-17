"""Pydantic request / response şemaları."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Auth ─────────────────────────────────────────────────────────────


class AuthRegisterRequest(BaseModel):
    """Kayıt isteği."""

    email: EmailStr
    password: str = Field(min_length=6, description="En az 6 karakter")


class AuthLoginRequest(BaseModel):
    """Giriş isteği."""

    email: EmailStr
    password: str


class AuthUserOut(BaseModel):
    """Token yanıtında dönen kullanıcı bilgisi."""

    id: int
    email: str
    username: str
    total_saved_balance: float

    model_config = {"from_attributes": True}


class AuthTokenResponse(BaseModel):
    """JWT token yanıtı."""

    access_token: str
    token_type: str = "bearer"
    user: AuthUserOut


# ── Product ──────────────────────────────────────────────────────────

class ProductOut(BaseModel):
    """Ürün listeleme yanıtı."""

    id: int
    name: str
    description: str
    price: float
    image_url: str
    category: str

    model_config = {"from_attributes": True}


# ── Cart ─────────────────────────────────────────────────────────────

class CartItemAdd(BaseModel):
    """Sepete ürün ekleme isteği."""

    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemOut(BaseModel):
    """Sepet öğesi yanıtı."""

    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    line_total: float


# ── Checkout ─────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    """Misafir ödeme isteği.

    Gerçek kredi kartı verisi ALINMAZ.
    Sadece kullanıcı kimliği yeterlidir.
    """

    user_id: int


class CheckoutResponse(BaseModel):
    """Ödeme simülasyonu sonucu."""

    order_id: int
    status: str
    total_amount: float
    message: str
    simulated_3d_secure: bool = True


# ── Order ────────────────────────────────────────────────────────────

class OrderItemOut(BaseModel):
    """Sipariş kalemi yanıtı."""

    product_id: int
    quantity: int
    unit_price: float

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    """Sipariş yanıtı."""

    id: int
    user_id: int
    total_amount: float
    status: str
    created_at: datetime
    items: list[OrderItemOut] = []

    model_config = {"from_attributes": True}


# ── User ─────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    """Kullanıcı yanıtı."""

    id: int
    username: str
    total_saved_balance: float

    model_config = {"from_attributes": True}
