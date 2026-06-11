from __future__ import annotations

import json
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.experience_submission import ExperienceSubmission
from app.middleware.auth import AdminAuth
from app.models.grade import Grade
from app.models.interest import Interest
from app.models.ml_prediction import MLPrediction
from app.models.personality import PersonalityScore
from app.models.student import Student
from app.models.survey_response import SurveyResponse
from app.schemas.ml_prediction import MLPredictRequest, MLPredictResponse, MLStatusResponse
from app.services.predictor_singleton import predictor
from app.services.training_service import append_approved_experience_rows, export_survey_rows_to_csv, log_training_event
from ml.training.evaluate_model import read_model_report
from ml.training.train_model import train_and_save

router = APIRouter(prefix="/ml", tags=["ml"])


@router.post("/predict", response_model=MLPredictResponse)
async def predict_for_student(payload: MLPredictRequest, db: AsyncSession = Depends(get_db)):
    try:
        student = await db.scalar(select(Student).where(Student.id == UUID(payload.student_id)))
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        grades = (await db.scalars(select(Grade).where(Grade.student_id == student.id))).all()
        interests = (await db.scalars(select(Interest).where(Interest.student_id == student.id))).all()
        personality = await db.scalar(select(PersonalityScore).where(PersonalityScore.student_id == student.id))

        student_data = {
            "grades": {g.subject: g.score for g in grades},
            "interests": [i.interest for i in interests],
            "budget_range": student.budget_range,
            "province": student.province,
            "personality": {
                "analytical_score": personality.analytical_score if personality else 3.0,
                "creative_score": personality.creative_score if personality else 3.0,
                "people_oriented_score": personality.people_oriented_score if personality else 3.0,
                "detail_oriented_score": personality.detail_oriented_score if personality else 3.0,
            },
        }
        prediction = predictor.predict(student_data)
        db.add(
            MLPrediction(
                student_id=student.id,
                top_major=prediction["top_major"],
                top_confidence=prediction["top_score"],
                all_predictions=prediction["all_predictions"],
                model_used=prediction["model_used"],
                model_accuracy=prediction["model_accuracy"],
                training_samples=prediction["training_samples"],
                raw_features=prediction["raw_features"],
            )
        )
        await db.commit()
        return MLPredictResponse(**prediction)
    except HTTPException:
        raise
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Prediction failed", "message": str(exc)})


@router.get("/predict/{student_id}", response_model=MLPredictResponse)
async def get_saved_prediction(student_id: UUID, db: AsyncSession = Depends(get_db)):
    try:
        prediction = await db.scalar(
            select(MLPrediction).where(MLPrediction.student_id == student_id).order_by(MLPrediction.created_at.desc())
        )
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction not found")
        return MLPredictResponse(
            top_major=prediction.top_major,
            top_score=prediction.top_confidence,
            all_predictions=prediction.all_predictions,
            model_used=prediction.model_used,
            model_accuracy=prediction.model_accuracy,
            training_samples=prediction.training_samples,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "Failed to fetch prediction", "message": str(exc)})


@router.post("/retrain", dependencies=[AdminAuth])
async def retrain_model(db: AsyncSession = Depends(get_db)):
    try:
        survey_rows = (await db.scalars(select(SurveyResponse))).all()
        approved_experience_rows = (
            await db.scalars(select(ExperienceSubmission).where(ExperienceSubmission.is_approved.is_(True)))
        ).all()
        csv_path = export_survey_rows_to_csv(survey_rows)
        append_approved_experience_rows(csv_path, approved_experience_rows)

        old_accuracy = predictor.metadata.get("accuracy", 0.0)
        new_meta = train_and_save(data_source="survey", triggered_by="admin")
        await log_training_event(db, new_meta, triggered_by="admin")
        predictor.load_models()
        await db.commit()
        return {
            "new_accuracy": new_meta.get("accuracy", 0.0),
            "old_accuracy": old_accuracy,
            "training_samples": new_meta.get("training_samples", 0),
            "model_type": new_meta.get("model_type", "random_forest"),
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "Retrain failed", "message": str(exc)})


@router.get("/status", response_model=MLStatusResponse, dependencies=[AdminAuth])
async def model_status():
    try:
        metadata_path = Path("ml/models/model_metadata.json")
        if metadata_path.exists():
            meta = json.loads(metadata_path.read_text(encoding="utf-8"))
            return MLStatusResponse(
                model_type=meta.get("model_type", "rule_based"),
                accuracy=float(meta.get("accuracy", 0.0)),
                training_samples=int(meta.get("training_samples", 0)),
                last_trained=meta.get("training_date"),
                is_ready=predictor.model_ready,
            )
        return MLStatusResponse(model_type="rule_based", accuracy=0.0, training_samples=0, last_trained=None, is_ready=False)
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "Status fetch failed", "message": str(exc)})


@router.get("/evaluation", dependencies=[AdminAuth])
async def model_evaluation():
    try:
        return read_model_report()
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "Evaluation fetch failed", "message": str(exc)})
