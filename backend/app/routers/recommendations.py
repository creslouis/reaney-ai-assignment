from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.recommendation import Recommendation

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/{student_id}")
async def get_recommendation(student_id: UUID, db: AsyncSession = Depends(get_db)):
    try:
        rec = await db.scalar(
            select(Recommendation).where(Recommendation.student_id == student_id).order_by(Recommendation.created_at.desc())
        )
        if not rec:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        return {
            "student_id": str(student_id),
            "recommended_majors": rec.recommended_majors,
            "recommended_universities": rec.recommended_universities,
            "career_paths": rec.career_paths,
            "gemini_summary": rec.gemini_summary,
            "results": rec.recommended_majors,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "Failed to fetch recommendation", "message": str(exc)})
