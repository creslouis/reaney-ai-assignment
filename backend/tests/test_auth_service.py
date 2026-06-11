import os

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://user:password@localhost:5432/dbname")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("JWT_REFRESH_SECRET_KEY", "test-refresh-secret")

from app.services.auth_service import (  # noqa: E402
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_token,
)


def test_access_token_round_trip():
    token = create_access_token("sub-1", "admin@example.com")
    payload = decode_access_token(token)
    assert payload["sub"] == "sub-1"
    assert payload["email"] == "admin@example.com"
    assert payload["role"] == "admin"


def test_refresh_token_round_trip_and_hash():
    token, token_hash, expires_at = create_refresh_token("sub-2", "admin@example.com")
    payload = decode_refresh_token(token)
    assert payload["sub"] == "sub-2"
    assert payload["type"] == "refresh"
    assert token_hash == hash_token(token)
    assert expires_at is not None
