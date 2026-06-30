from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class GoogleLoginRequest(BaseModel):
    id_token: str
    totp_code: str | None = None


class EmailPasswordLoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

class TermsAcceptRequest(BaseModel):
    accept: bool


class TwoFactorVerifyRequest(BaseModel):
    code: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    requires_terms_acceptance: bool = False
    requires_2fa_setup: bool = False
    user: dict


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AdminUserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None
    role: str
    terms_accepted: bool
    two_factor_enabled: bool
    last_login_at: datetime | None
