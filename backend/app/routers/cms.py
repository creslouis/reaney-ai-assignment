from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import AdminAuth
from app.models.cms_setting import CMSSetting
from app.models.legal_document import LegalDocument
from app.schemas.cms import CMSBundleResponse, CMSSettingUpdateRequest, LegalDocumentUpdateRequest
from app.services.audit_service import log_audit_event
from app.services.auth_service import decode_access_token
from app.services.cms_service import get_public_cms_bundle

router = APIRouter(prefix="/cms", tags=["cms"])


@router.get("/public", response_model=CMSBundleResponse)
async def public_cms_bundle(db: AsyncSession = Depends(get_db)):
    return await get_public_cms_bundle(db)


@router.get("/admin/settings", dependencies=[AdminAuth])
async def admin_settings(db: AsyncSession = Depends(get_db)):
    rows = (await db.scalars(select(CMSSetting).order_by(CMSSetting.category.asc(), CMSSetting.label.asc()))).all()
    return [
        {
            "id": str(row.id),
            "category": row.category,
            "key": row.key,
            "label": row.label,
            "value": row.value,
            "value_type": row.value_type,
            "is_public": row.is_public,
        }
        for row in rows
    ]


@router.put("/admin/settings/{setting_key}", dependencies=[AdminAuth])
async def update_setting(setting_key: str, payload: CMSSettingUpdateRequest, db: AsyncSession = Depends(get_db), authorization: str = Header(default="")):
    row = await db.scalar(select(CMSSetting).where(CMSSetting.key == setting_key))
    admin_user_id = None
    if authorization.startswith("Bearer "):
        try:
            admin_user_id = decode_access_token(authorization.replace("Bearer ", "", 1).strip()).get("sub")
        except Exception:
            admin_user_id = None
    if not row:
        row = CMSSetting(key=setting_key, **payload.model_dump())
        db.add(row)
    else:
        row.category = payload.category
        row.label = payload.label
        row.value = payload.value
        row.value_type = payload.value_type
        row.is_public = payload.is_public
    await log_audit_event(db, admin_user_id=admin_user_id, action="cms.update_setting", target_type="cms_setting", target_id=setting_key, details={"category": payload.category})
    await db.commit()
    return {"success": True}


@router.get("/admin/legal", dependencies=[AdminAuth])
async def admin_legal(db: AsyncSession = Depends(get_db)):
    rows = (await db.scalars(select(LegalDocument).order_by(LegalDocument.slug.asc()))).all()
    return [
        {
            "id": str(row.id),
            "slug": row.slug,
            "title": row.title,
            "content_markdown": row.content_markdown,
            "version": row.version,
            "is_active": row.is_active,
        }
        for row in rows
    ]


@router.put("/admin/legal/{slug}", dependencies=[AdminAuth])
async def update_legal(slug: str, payload: LegalDocumentUpdateRequest, db: AsyncSession = Depends(get_db), authorization: str = Header(default="")):
    row = await db.scalar(select(LegalDocument).where(LegalDocument.slug == slug))
    admin_user_id = None
    if authorization.startswith("Bearer "):
        try:
            admin_user_id = decode_access_token(authorization.replace("Bearer ", "", 1).strip()).get("sub")
        except Exception:
            admin_user_id = None
    if not row:
        row = LegalDocument(slug=slug, **payload.model_dump())
        db.add(row)
    else:
        row.title = payload.title
        row.content_markdown = payload.content_markdown
        row.version = payload.version
        row.is_active = payload.is_active
    await log_audit_event(db, admin_user_id=admin_user_id, action="cms.update_legal", target_type="legal_document", target_id=slug, details={"version": payload.version})
    await db.commit()
    return {"success": True}
