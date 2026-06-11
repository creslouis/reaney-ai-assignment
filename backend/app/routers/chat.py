from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.chat_message import ChatMessage
from app.models.interest import Interest
from app.models.ml_prediction import MLPrediction
from app.models.recommendation import Recommendation
from app.models.student import Student
from app.schemas.chat import ChatSendRequest
from app.services.experience_service import flatten_experience_insights, get_approved_experience_insights
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/send")
async def send_chat(payload: ChatSendRequest, db: AsyncSession = Depends(get_db)):
    try:
        student = await db.scalar(select(Student).where(Student.id == UUID(payload.student_id)))
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        prediction = await db.scalar(
            select(MLPrediction).where(MLPrediction.student_id == student.id).order_by(MLPrediction.created_at.desc())
        )
        recommendation = await db.scalar(
            select(Recommendation).where(Recommendation.student_id == student.id).order_by(Recommendation.created_at.desc())
        )
        interests = (await db.scalars(select(Interest).where(Interest.student_id == student.id))).all()
        majors = ([prediction.top_major] + [item["major"] for item in prediction.all_predictions[1:]]) if prediction else []
        experience_insights = await get_approved_experience_insights(db, majors)

        history_rows = (
            await db.scalars(select(ChatMessage).where(ChatMessage.session_id == UUID(payload.session_id)).order_by(ChatMessage.created_at.asc()))
        ).all()
        history = [{"role": row.role, "content": row.message} for row in history_rows]

        context = {
            "name": student.name,
            "province": student.province or "Unknown",
            "budget": student.budget_range or "flexible",
            "grades_summary": "Recorded",
            "interests": ", ".join([i.interest for i in interests]) or "general",
            "top_major": prediction.top_major if prediction else "Unknown",
            "confidence": round((prediction.top_confidence if prediction else 0) * 100, 2),
            "alt_majors": ", ".join([i["major"] for i in (prediction.all_predictions[1:] if prediction else [])]),
            "universities": recommendation.recommended_universities if recommendation else [],
            "career_paths": recommendation.career_paths if recommendation else [],
            "gemini_summary": recommendation.gemini_summary if recommendation else "",
            "experience_insights": flatten_experience_insights(experience_insights),
        }

        reply = gemini_service.chat_reply(context=context, message=payload.message, history=history)
        db.add(ChatMessage(session_id=UUID(payload.session_id), student_id=student.id, role="user", message=payload.message))
        db.add(ChatMessage(session_id=UUID(payload.session_id), student_id=student.id, role="assistant", message=reply))
        await db.commit()
        return {"reply": reply, "session_id": payload.session_id}
    except HTTPException:
        raise
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Chat failed", "message": str(exc)})


@router.get("/history/{session_id}")
async def chat_history(session_id: UUID, db: AsyncSession = Depends(get_db)):
    try:
        rows = (await db.scalars(select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()))).all()
        return [{"role": row.role, "message": row.message, "created_at": row.created_at} for row in rows]
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "History fetch failed", "message": str(exc)})
