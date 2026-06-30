from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import secrets

import bcrypt
import pyotp
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from jose import JWTError, jwt

from app.config import get_settings

settings = get_settings()


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))



def allowed_admin_emails() -> set[str]:
    return {item.strip().lower() for item in settings.google_allowed_admin_emails.split(",") if item.strip()}


def verify_google_id_token(token: str) -> dict:
    info = id_token.verify_oauth2_token(token, google_requests.Request(), settings.google_client_id or None)
    email = str(info.get("email", "")).lower()
    if allowed_admin_emails() and email not in allowed_admin_emails():
        raise ValueError("Email is not allowed for admin access")
    return info


def create_access_token(subject: str, email: str, role: str = "admin") -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "email": email,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=2)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")


def create_refresh_token(subject: str, email: str) -> tuple[str, str, datetime]:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=14)
    token_id = secrets.token_urlsafe(24)
    payload = {
        "sub": subject,
        "email": email,
        "type": "refresh",
        "jti": token_id,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_refresh_secret_key, algorithm="HS256")
    return token, hash_token(token), expires_at


def decode_refresh_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_refresh_secret_key, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token type")
        return payload
    except JWTError as exc:
        raise ValueError("Invalid refresh token") from exc


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
    except JWTError as exc:
        raise ValueError("Invalid access token") from exc


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def verify_totp(secret: str, code: str) -> bool:
    return pyotp.TOTP(secret).verify(code, valid_window=1)


def build_totp_uri(secret: str, email: str) -> str:
    return pyotp.TOTP(secret).provisioning_uri(name=email, issuer_name="ReanEy CMS")
