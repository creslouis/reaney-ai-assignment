from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import AdminAuth
from app.models.contact_request import ContactRequest
from app.schemas.contact import ContactSendRequest

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("/send")
async def send_contact(payload: ContactSendRequest, db: AsyncSession = Depends(get_db)):
    try:
        item = ContactRequest(name=payload.name, email=payload.email, phone=payload.phone, message=payload.message)
        db.add(item)
        await db.commit()
        return {"success": True}
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Contact request failed", "message": str(exc)})


@router.get("/all", dependencies=[AdminAuth])
async def all_contacts(db: AsyncSession = Depends(get_db)):
    try:
        rows = (await db.scalars(select(ContactRequest).order_by(ContactRequest.created_at.desc()))).all()
        return [
            {
                "id": row.id,
                "name": row.name,
                "email": row.email,
                "phone": row.phone,
                "message": row.message,
                "created_at": row.created_at,
                "is_read": row.is_read,
            }
            for row in rows
        ]
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "Contact fetch failed", "message": str(exc)})


@router.patch("/{contact_id}/read", dependencies=[AdminAuth])
async def mark_contact_read(contact_id: UUID, db: AsyncSession = Depends(get_db)):
    try:
        item = await db.scalar(select(ContactRequest).where(ContactRequest.id == contact_id))
        if not item:
            raise HTTPException(status_code=404, detail="Contact request not found")
        item.is_read = True
        await db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Failed to update contact request", "message": str(exc)})
