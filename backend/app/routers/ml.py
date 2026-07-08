from __future__ import annotations

import json
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
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
from app.services.system_verify_service import verify_system
from app.services.training_service import append_approved_experience_rows, export_survey_rows_to_csv, log_training_event
from ml.training.csv_importer import import_csv_to_training_rows, save_uploaded_dataset
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


@router.post("/upload-dataset", dependencies=[AdminAuth])
async def upload_dataset(
    file: UploadFile = File(...),
    retrain_after: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a CSV or JSON file with survey data.
    The file is mapped to the internal training format and appended to survey_data.csv.
    If retrain_after=true (default), the model is retrained immediately after saving.
    """
    try:
        allowed = {".csv", ".json", ".jsonl"}
        suffix = Path(file.filename or "data.csv").suffix.lower()
        if suffix not in allowed:
            raise HTTPException(status_code=400, detail=f"File type '{suffix}' not supported. Upload CSV or JSON.")

        content = await file.read()
        if len(content) > 10 * 1024 * 1024:  # 10 MB max
            raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

        df = import_csv_to_training_rows(content, file.filename or "data.csv")
        total_rows = save_uploaded_dataset(df, merge=True)

        result = {
            "rows_uploaded": len(df),
            "total_rows_in_dataset": total_rows,
            "retrained": False,
        }

        if retrain_after:
            new_meta = train_and_save(data_source="survey", triggered_by="upload")
            await log_training_event(db, new_meta, triggered_by="upload")
            predictor.load_models()
            await db.commit()
            result["retrained"] = True
            result["new_accuracy"] = new_meta.get("accuracy", 0.0)
            result["model_type"] = new_meta.get("model_type", "random_forest")
            result["training_samples"] = new_meta.get("training_samples", 0)

        return result

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={"error": "Dataset parse error", "message": str(exc)})
    except Exception as exc:
        raise HTTPException(status_code=500, detail={"error": "Upload failed", "message": str(exc)})


@router.get("/status", response_model=MLStatusResponse, dependencies=[AdminAuth])
async def model_status():
    try:
        ml_ready = getattr(predictor, "ml_ready", False)
        return MLStatusResponse(
            model_type=predictor.metadata.get("model_type", "rule_based_v2"),
            accuracy=float(predictor.metadata.get("accuracy", 1.0)),
            training_samples=int(predictor.metadata.get("training_samples", 0)),
            last_trained=predictor.metadata.get("training_date"),
            is_ready=True,
            ml_model_loaded=ml_ready,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "Status fetch failed", "message": str(exc)})


@router.get("/evaluation", dependencies=[AdminAuth])
async def model_evaluation():
    try:
        report = read_model_report()
        if not report.get("ready", False):
            # No trained model yet — return rule-based defaults
            return {
                "model_type": "rule_based_v2",
                "accuracy": None,
                "precision": None,
                "recall": None,
                "f1": None,
                "top3_accuracy": None,
                "training_date": None,
                "comparison": [],
                "note": "No trained model found. Upload training data and click Retrain to train the ML model.",
            }
        return {
            "model_type": report.get("model_type", "random_forest"),
            "accuracy": report.get("accuracy"),
            "precision": report.get("precision"),
            "recall": report.get("recall"),
            "f1": report.get("f1"),
            "top3_accuracy": report.get("top3_accuracy"),
            "training_date": report.get("training_date"),
            "training_samples": report.get("training_samples"),
            "data_source": report.get("data_source"),
            "comparison": report.get("comparison", []),
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "Evaluation fetch failed", "message": str(exc)})


@router.get("/verify", dependencies=[AdminAuth])
async def verify_runtime(mode: str = "shallow", db: AsyncSession = Depends(get_db)):
    try:
        selected_mode = mode if mode in {"shallow", "deep"} else "shallow"
        return await verify_system(db, mode=selected_mode)
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "Verification failed", "message": str(exc)})
