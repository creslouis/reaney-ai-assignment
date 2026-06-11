from datetime import datetime, timezone
from io import BytesIO

import base64
import qrcode

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.admin_session import AdminSession
from app.models.admin_user import AdminUser
from app.models.legal_document import LegalDocument
from app.schemas.auth import GoogleLoginRequest, RefreshTokenRequest, TermsAcceptRequest, TwoFactorVerifyRequest
from app.services.audit_service import log_audit_event
from app.services.auth_service import (
    build_totp_uri,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    generate_totp_secret,
    hash_token,
    verify_google_id_token,
    verify_totp,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_payload(user: AdminUser) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "terms_accepted": user.terms_accepted,
        "two_factor_enabled": user.two_factor_enabled,
    }


async def _get_current_admin_user(db: AsyncSession, authorization: str) -> AdminUser:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.replace("Bearer ", "", 1).strip()
    try:
        payload = decode_access_token(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    user = await db.scalar(select(AdminUser).where(AdminUser.google_sub == payload.get("sub")))
    if not user:
        raise HTTPException(status_code=401, detail="Admin user not found")
    return user


@router.post("/google-login")
async def google_login(payload: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        info = verify_google_id_token(payload.id_token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail={"error": "Google login failed", "message": str(exc)})

    email = str(info.get("email", "")).lower()
    sub = str(info.get("sub"))
    user = await db.scalar(select(AdminUser).where(AdminUser.google_sub == sub))
    if not user:
        user = AdminUser(
            email=email,
            full_name=info.get("name"),
            google_sub=sub,
            avatar_url=info.get("picture"),
            role="admin",
            is_active=True,
        )
        db.add(user)
        await db.flush()
    else:
        user.full_name = info.get("name")
        user.avatar_url = info.get("picture")

    if user.two_factor_enabled:
        if not payload.totp_code or not user.two_factor_secret or not verify_totp(user.two_factor_secret, payload.totp_code):
            await db.commit()
            return {
                "access_token": "",
                "token_type": "bearer",
                "requires_terms_acceptance": not user.terms_accepted,
                "requires_2fa_setup": False,
                "requires_2fa_verify": True,
                "user": _user_payload(user),
            }

    user.last_login_at = datetime.now(timezone.utc)
    access_token = create_access_token(sub, email, role=user.role)
    refresh_token, refresh_hash, refresh_expires_at = create_refresh_token(sub, email)
    db.add(AdminSession(admin_user_id=user.id, refresh_token_hash=refresh_hash, expires_at=refresh_expires_at, is_revoked=False))
    await log_audit_event(db, admin_user_id=str(user.id), action="auth.google_login", target_type="admin_user", target_id=str(user.id), details={"email": email})
    await db.commit()
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "requires_terms_acceptance": not user.terms_accepted,
        "requires_2fa_setup": not user.two_factor_enabled,
        "user": _user_payload(user),
    }


@router.post("/refresh")
async def refresh_session(payload: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    try:
        token_payload = decode_refresh_token(payload.refresh_token)
        hashed = hash_token(payload.refresh_token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    session = await db.scalar(select(AdminSession).where(AdminSession.refresh_token_hash == hashed).where(AdminSession.is_revoked.is_(False)))
    if not session or session.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh session expired")

    user = await db.scalar(select(AdminUser).where(AdminUser.google_sub == token_payload.get("sub")))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Admin user not found")

    access_token = create_access_token(user.google_sub, user.email, role=user.role)
    new_refresh_token, new_refresh_hash, new_expires = create_refresh_token(user.google_sub, user.email)
    session.refresh_token_hash = new_refresh_hash
    session.expires_at = new_expires
    await log_audit_event(db, admin_user_id=str(user.id), action="auth.refresh", target_type="admin_session", target_id=str(session.id))
    await db.commit()
    return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer", "user": _user_payload(user)}


@router.post("/logout")
async def logout(payload: RefreshTokenRequest, authorization: str = Header(default=""), db: AsyncSession = Depends(get_db)):
    hashed = hash_token(payload.refresh_token)
    session = await db.scalar(select(AdminSession).where(AdminSession.refresh_token_hash == hashed).where(AdminSession.is_revoked.is_(False)))
    if session:
        session.is_revoked = True
    user_id = None
    if authorization.startswith("Bearer "):
        try:
            user = await _get_current_admin_user(db, authorization)
            user_id = str(user.id)
        except Exception:
            user_id = None
    await log_audit_event(db, admin_user_id=user_id, action="auth.logout", target_type="admin_session", target_id=str(session.id) if session else None)
    await db.commit()
    return {"success": True}


@router.get("/me")
async def me(authorization: str = Header(default=""), db: AsyncSession = Depends(get_db)):
    user = await _get_current_admin_user(db, authorization)
    return _user_payload(user)


@router.post("/accept-terms")
async def accept_terms(payload: TermsAcceptRequest, authorization: str = Header(default=""), db: AsyncSession = Depends(get_db)):
    user = await _get_current_admin_user(db, authorization)
    if not payload.accept:
        raise HTTPException(status_code=400, detail="Terms must be accepted")
    user.terms_accepted = True
    user.terms_accepted_at = datetime.now(timezone.utc)
    await log_audit_event(db, admin_user_id=str(user.id), action="auth.accept_terms", target_type="admin_user", target_id=str(user.id))
    await db.commit()
    return {"success": True}


@router.get("/legal/terms")
async def terms_document(db: AsyncSession = Depends(get_db)):
    doc = await db.scalar(select(LegalDocument).where(LegalDocument.slug == "terms").where(LegalDocument.is_active.is_(True)))
    if not doc:
        raise HTTPException(status_code=404, detail="Terms document not found")
    return {"title": doc.title, "content_markdown": doc.content_markdown, "version": doc.version}


@router.post("/2fa/setup")
async def setup_2fa(authorization: str = Header(default=""), db: AsyncSession = Depends(get_db)):
    user = await _get_current_admin_user(db, authorization)
    secret = generate_totp_secret()
    user.two_factor_secret = secret
    user.two_factor_enabled = False
    await db.commit()
    otpauth_url = build_totp_uri(secret, user.email)
    qr = qrcode.make(otpauth_url)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return {"secret": secret, "otpauth_url": otpauth_url, "qr_code_data_url": f"data:image/png;base64,{encoded}"}


@router.post("/2fa/enable")
async def enable_2fa(payload: TwoFactorVerifyRequest, authorization: str = Header(default=""), db: AsyncSession = Depends(get_db)):
    user = await _get_current_admin_user(db, authorization)
    if not user.two_factor_secret or not verify_totp(user.two_factor_secret, payload.code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
    user.two_factor_enabled = True
    await log_audit_event(db, admin_user_id=str(user.id), action="auth.enable_2fa", target_type="admin_user", target_id=str(user.id))
    await db.commit()
    return {"success": True}
