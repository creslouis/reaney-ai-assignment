from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import AdminAuth
from app.models.experience_submission import ExperienceSubmission
from app.schemas.experience import ExperienceSubmitRequest

router = APIRouter(prefix="/experience", tags=["experience"])


@router.post("/submit")
async def submit_experience(payload: ExperienceSubmitRequest, db: AsyncSession = Depends(get_db)):
    try:
        item = ExperienceSubmission(**payload.model_dump(), is_approved=False)
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return {"success": True, "id": item.id, "is_approved": item.is_approved}
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Experience submission failed", "message": str(exc)})


@router.get("/all", dependencies=[AdminAuth])
async def all_experience(db: AsyncSession = Depends(get_db)):
    rows = (await db.scalars(select(ExperienceSubmission).order_by(ExperienceSubmission.created_at.desc()))).all()
    return [
        {
            "id": row.id,
            "contributor_type": row.contributor_type,
            "name": row.name,
            "email": row.email,
            "current_major": row.current_major,
            "university": row.university,
            "job_title": row.job_title,
            "satisfaction_score": row.satisfaction_score,
            "would_recommend": row.would_recommend,
            "is_approved": row.is_approved,
            "created_at": row.created_at,
        }
        for row in rows
    ]


@router.get("/stats", dependencies=[AdminAuth])
async def experience_stats(db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count()).select_from(ExperienceSubmission))
    approved = await db.scalar(select(func.count()).select_from(ExperienceSubmission).where(ExperienceSubmission.is_approved.is_(True)))
    return {"total_submissions": total or 0, "approved_submissions": approved or 0}


@router.patch("/{experience_id}/approve", dependencies=[AdminAuth])
async def approve_experience(experience_id: UUID, db: AsyncSession = Depends(get_db)):
    item = await db.scalar(select(ExperienceSubmission).where(ExperienceSubmission.id == experience_id))
    if not item:
        raise HTTPException(status_code=404, detail="Experience submission not found")
    item.is_approved = True
    await db.commit()
    return {"success": True}
