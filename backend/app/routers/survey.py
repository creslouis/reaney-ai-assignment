from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import AdminAuth
from app.models.survey_response import SurveyResponse
from app.schemas.survey import SurveyManualRequest, SurveySyncRequest, SurveyWebhookRequest
from app.services.survey_sync import fetch_google_sheet_rows
from app.services.training_service import export_survey_rows_to_csv, log_training_event
from app.services.predictor_singleton import predictor
from ml.training.train_model import train_and_save

router = APIRouter(prefix="/survey", tags=["survey"])


def _from_form_data(form_data: dict) -> dict:
    # TODO: Google Form integration - expand mapping here
    def first(key: str, default=None):
        val = form_data.get(key, default)
        if isinstance(val, list):
            return val[0] if val else default
        return val

    interests = first("Your interests in high school?", "")
    if isinstance(interests, str):
        interests = [x.strip() for x in interests.split(",") if x.strip()]

    return {
        "source": "google_form",
        "respondent_current_major": first("Your current major?", "Unknown"),
        "respondent_university": first("Your university?", None),
        "respondent_year": int(first("Year of study?", 1) or 1),
        "respondent_satisfaction": int(first("Satisfaction with your choice (1-5)?", 3) or 3),
        "hs_math_score": float(first("Your high school Math score?", 0) or 0),
        "hs_khmer_score": float(first("Your high school Khmer score?", 0) or 0),
        "hs_english_score": float(first("Your high school English score?", 0) or 0),
        "hs_science_score": float(first("Your high school Science score?", 0) or 0),
        "hs_biology_score": float(first("Your high school Biology score?", 0) or 0),
        "hs_history_score": float(first("Your high school History score?", 0) or 0),
        "hs_geography_score": float(first("Your high school Geography score?", 0) or 0),
        "hs_physics_score": float(first("Your high school Physics score?", 0) or 0),
        "hs_chemistry_score": float(first("Your high school Chemistry score?", 0) or 0),
        "hs_interests": interests,
        "hs_province": first("Your high school province?", None),
        "hs_budget_range": first("Budget range preference?", None),
        "hs_personality": {},
        "actual_major": first("Your current major?", "Unknown"),
        "would_recommend": str(first("Would you recommend this major to a similar student?", "yes")).lower()
        in {"yes", "true", "1"},
        "raw_form_data": form_data,
        "google_form_response_id": first("Response ID", None),
    }


@router.post("/webhook")
async def survey_webhook(payload: SurveyWebhookRequest, db: AsyncSession = Depends(get_db)):
    settings = get_settings()
    if payload.token != settings.survey_webhook_token:
        raise HTTPException(status_code=401, detail="Invalid webhook token")
    try:
        mapped = _from_form_data(payload.form_data)
        db.add(SurveyResponse(**mapped))
        await db.commit()

        rows = (await db.scalars(select(SurveyResponse))).all()
        total = len(rows)
        if total >= settings.ml_retrain_threshold and total % 10 == 0:
            export_survey_rows_to_csv(rows)
            meta = train_and_save(data_source="survey", triggered_by="webhook")
            predictor.load_models()
            await log_training_event(db, meta, triggered_by="webhook")
            await db.commit()
        return {"received": True}
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Webhook processing failed", "message": str(exc)})


@router.post("/manual", dependencies=[AdminAuth])
async def manual_survey(payload: SurveyManualRequest, db: AsyncSession = Depends(get_db)):
    try:
        row = SurveyResponse(**payload.model_dump())
        db.add(row)
        await db.commit()
        return {"success": True, "id": row.id}
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Manual survey save failed", "message": str(exc)})


@router.get("/all", dependencies=[AdminAuth])
async def all_surveys(db: AsyncSession = Depends(get_db)):
    try:
        rows = (await db.scalars(select(SurveyResponse).order_by(SurveyResponse.created_at.desc()))).all()
        return [
            {
                "id": row.id,
                "source": row.source,
                "actual_major": row.actual_major,
                "respondent_university": row.respondent_university,
                "created_at": row.created_at,
            }
            for row in rows
        ]
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "Survey fetch failed", "message": str(exc)})


@router.get("/stats", dependencies=[AdminAuth])
async def survey_stats(db: AsyncSession = Depends(get_db)):
    try:
        rows = (await db.scalars(select(SurveyResponse))).all()
        majors = Counter([r.actual_major for r in rows if r.actual_major])
        universities = Counter([r.respondent_university for r in rows if r.respondent_university])
        sats = [r.respondent_satisfaction for r in rows if r.respondent_satisfaction is not None]
        avg_sat = sum(sats) / len(sats) if sats else 0
        settings = get_settings()
        return {
            "total_responses": len(rows),
            "by_major": dict(majors),
            "by_university": dict(universities),
            "avg_satisfaction": round(avg_sat, 2),
            "ready_for_training": len(rows) >= settings.ml_retrain_threshold,
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail={"error": "Survey stats failed", "message": str(exc)})


@router.post("/sync-google-sheet", dependencies=[AdminAuth])
async def sync_google_sheet(payload: SurveySyncRequest, db: AsyncSession = Depends(get_db)):
    settings = get_settings()
    try:
        rows = await fetch_google_sheet_rows(payload.sheet_id, payload.sheet_range, settings.google_sheets_api_key)
        inserted = 0
        for row in rows:
            mapped = _from_form_data(row)
            db.add(SurveyResponse(**mapped))
            inserted += 1
        await db.commit()
        return {"success": True, "inserted": inserted}
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Google Sheet sync failed", "message": str(exc)})
