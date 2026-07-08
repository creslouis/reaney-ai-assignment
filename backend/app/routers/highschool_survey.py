from __future__ import annotations

import hashlib
import json
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import AdminAuth
from app.models.highschool_survey import HighschoolSurvey
from app.schemas.highschool_survey import HighschoolSurveyRequest, HighschoolSurveyResponse
from app.services.predictor_singleton import predictor

router = APIRouter(prefix="/hs-survey", tags=["highschool_survey"])

def _compute_hash(data: dict) -> str:
    # Sort keys to ensure consistent hashing
    data_str = json.dumps(data, sort_keys=True)
    return hashlib.sha256(data_str.encode("utf-8")).hexdigest()

@router.post("/submit", response_model=HighschoolSurveyResponse)
async def submit_hs_survey(payload: HighschoolSurveyRequest, db: AsyncSession = Depends(get_db)):
    try:
        data_dict = payload.model_dump()
        content_hash = _compute_hash(data_dict)

        # Check for duplicates
        existing = await db.scalar(select(HighschoolSurvey).where(HighschoolSurvey.content_hash == content_hash))
        if existing:
            # If duplicate, just return the prediction without saving
            features = {
                "grades": {
                    "math": payload.math_score,
                    "khmer": payload.khmer_score,
                    "english": payload.english_score,
                    "science": payload.science_score,
                    "bio": payload.biology_score,
                    "history": payload.history_score,
                    "geo": payload.geography_score,
                    "physics": payload.physics_score,
                    "chem": payload.chemistry_score,
                },
                "interests": payload.interests,
                "track": payload.study_track,
            }
            prediction = predictor.predict(features)
            return HighschoolSurveyResponse(
                success=True,
                prediction=prediction,
                message="Duplicate survey skipped, but prediction generated."
            )

        # Save to DB
        survey = HighschoolSurvey(
            study_track=payload.study_track,
            intended_major=payload.intended_major,
            province=payload.province,
            budget_range=payload.budget_range,
            math_score=payload.math_score,
            khmer_score=payload.khmer_score,
            english_score=payload.english_score,
            science_score=payload.science_score,
            biology_score=payload.biology_score,
            history_score=payload.history_score,
            geography_score=payload.geography_score,
            physics_score=payload.physics_score,
            chemistry_score=payload.chemistry_score,
            interests=payload.interests,
            personality=payload.personality.model_dump(),
            content_hash=content_hash,
        )
        db.add(survey)
        await db.commit()

        # Generate prediction
        features = {
            "grades": {
                "math": payload.math_score,
                "khmer": payload.khmer_score,
                "english": payload.english_score,
                "science": payload.science_score,
                "bio": payload.biology_score,
                "history": payload.history_score,
                "geo": payload.geography_score,
                "physics": payload.physics_score,
                "chem": payload.chemistry_score,
            },
            "interests": payload.interests,
            "track": payload.study_track,
        }
        prediction = predictor.predict(features)

        return HighschoolSurveyResponse(
            success=True,
            prediction=prediction,
            message="Survey submitted successfully."
        )

    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Failed to submit survey", "message": str(exc)})


@router.get("/stats", dependencies=[AdminAuth])
async def get_hs_survey_stats(db: AsyncSession = Depends(get_db)):
    try:
        total_surveys = await db.scalar(select(func.count()).select_from(HighschoolSurvey))
        threshold = 300
        return {
            "total_surveys": total_surveys or 0,
            "threshold": threshold,
            "ready_for_export": (total_surveys or 0) >= threshold,
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "Failed to fetch stats", "message": str(exc)})


@router.get("/export", dependencies=[AdminAuth])
async def export_hs_surveys(db: AsyncSession = Depends(get_db)):
    try:
        # Get all non-exported surveys
        surveys = (await db.scalars(select(HighschoolSurvey).where(HighschoolSurvey.is_exported == False))).all()
        if not surveys:
            raise HTTPException(status_code=404, detail="No new surveys to export.")

        output_list = []
        for s in surveys:
            output_list.append({
                "target_major": s.intended_major,
                "math_score": s.math_score,
                "khmer_score": s.khmer_score,
                "english_score": s.english_score,
                "science_score": s.science_score,
                "biology_score": s.biology_score,
                "history_score": s.history_score,
                "geography_score": s.geography_score,
                "physics_score": s.physics_score,
                "chemistry_score": s.chemistry_score,
                "interests": s.interests,
                "budget_range": s.budget_range,
                "province": s.province,
                "analytical_score": s.personality.get("analytical_score", 3.0),
                "creative_score": s.personality.get("creative_score", 3.0),
                "people_oriented_score": s.personality.get("people_oriented_score", 3.0),
                "detail_oriented_score": s.personality.get("detail_oriented_score", 3.0),
                "track": s.study_track,
            })
            s.is_exported = True

        await db.commit()

        # Convert to JSONL
        jsonl_content = "\n".join(json.dumps(row) for row in output_list)
        return StreamingResponse(
            io.StringIO(jsonl_content),
            media_type="application/x-ndjson",
            headers={"Content-Disposition": "attachment; filename=hs_survey_export.jsonl"}
        )

    except HTTPException:
        raise
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Failed to export surveys", "message": str(exc)})
