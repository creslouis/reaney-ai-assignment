from fastapi import Depends, Header, HTTPException, status

from app.config import get_settings
from app.services.auth_service import decode_access_token


def require_admin_api_key(x_api_key: str = Header(default=""), authorization: str = Header(default="")) -> str:
    settings = get_settings()
    if authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "", 1).strip()
        try:
            payload = decode_access_token(token)
            if payload.get("role") == "admin":
                return token
        except Exception:
            pass
    if not settings.admin_api_key or x_api_key != settings.admin_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin API key")
    return x_api_key


AdminAuth = Depends(require_admin_api_key)
