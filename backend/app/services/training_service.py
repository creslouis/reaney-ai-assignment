from __future__ import annotations

from datetime import datetime
from pathlib import Path

import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.experience_submission import ExperienceSubmission
from app.models.model_training_log import ModelTrainingLog


def export_survey_rows_to_csv(rows: list) -> Path:
    csv_path = Path("ml/data/survey_data.csv")
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    exported = []
    for row in rows:
        features = {
            "math_score": row.hs_math_score or 0,
            "khmer_score": row.hs_khmer_score or 0,
            "english_score": row.hs_english_score or 0,
            "science_score": row.hs_science_score or 0,
            "biology_score": row.hs_biology_score or 0,
            "history_score": row.hs_history_score or 0,
            "geography_score": row.hs_geography_score or 0,
            "physics_score": row.hs_physics_score or 0,
            "chemistry_score": row.hs_chemistry_score or 0,
            "budget_public": 1 if row.hs_budget_range in {"public", "low"} else 0,
            "budget_private": 1 if row.hs_budget_range in {"private", "medium", "high"} else 0,
            "budget_scholarship": 1 if row.hs_budget_range in {"scholarship", "low"} else 0,
            "location_phnom_penh": 1 if row.hs_province == "phnom_penh" else 0,
            "location_province": 0 if row.hs_province == "phnom_penh" else 1,
            "analytical_score": float((row.hs_personality or {}).get("analytical_score", 3.0)),
            "creative_score": float((row.hs_personality or {}).get("creative_score", 3.0)),
            "people_oriented_score": float((row.hs_personality or {}).get("people_oriented_score", 3.0)),
            "detail_oriented_score": float((row.hs_personality or {}).get("detail_oriented_score", 3.0)),
        }
        interests = set(row.hs_interests or [])
        for key in [
            "technology",
            "business",
            "medicine",
            "education",
            "arts",
            "law",
            "engineering",
            "agriculture",
            "tourism",
        ]:
            features[f"interest_{key}"] = 1 if key in interests else 0
        features["stem_avg"] = (features["math_score"] + features["science_score"] + features["physics_score"] + features["chemistry_score"]) / 4
        features["language_avg"] = (features["khmer_score"] + features["english_score"]) / 2
        features["social_avg"] = (features["history_score"] + features["geography_score"]) / 2
        features["top_subject_score"] = max(
            features["math_score"],
            features["khmer_score"],
            features["english_score"],
            features["science_score"],
            features["biology_score"],
            features["history_score"],
            features["geography_score"],
            features["physics_score"],
            features["chemistry_score"],
        )
        features["target_major"] = row.actual_major
        exported.append(features)
    pd.DataFrame(exported).to_csv(csv_path, index=False)
    return csv_path


def append_approved_experience_rows(csv_path: Path, rows: list[ExperienceSubmission]) -> Path:
    if not rows:
        return csv_path

    frame = pd.read_csv(csv_path) if csv_path.exists() else pd.DataFrame()
    exported = []
    for row in rows:
        interests = set(row.high_school_interests or [])
        math_bias = 85 if row.current_major in {"Computer Science & IT", "Civil Engineering", "Electrical Engineering", "Accounting & Finance"} else 65
        language_bias = 85 if row.current_major in {"Law", "International Relations", "Media & Communication", "Education & Teaching"} else 70
        bio_bias = 85 if row.current_major in {"Medicine & Health Sciences", "Nursing", "Agriculture"} else 65
        record = {
            "math_score": math_bias,
            "khmer_score": language_bias,
            "english_score": language_bias,
            "science_score": 75,
            "biology_score": bio_bias,
            "history_score": language_bias,
            "geography_score": 70,
            "physics_score": math_bias if row.current_major in {"Computer Science & IT", "Civil Engineering", "Electrical Engineering", "Architecture"} else 60,
            "chemistry_score": bio_bias if row.current_major in {"Medicine & Health Sciences", "Nursing"} else 60,
            "budget_public": 1 if row.university and any(k in row.university.lower() for k in ["rupp", "itc", "rule", "national", "royal"]) else 0,
            "budget_private": 0 if row.university and any(k in row.university.lower() for k in ["rupp", "itc", "rule", "national", "royal"]) else 1,
            "budget_scholarship": 1 if row.would_recommend and (row.satisfaction_score or 0) >= 4 else 0,
            "location_phnom_penh": 1 if row.province == "phnom_penh" else 0,
            "location_province": 0 if row.province == "phnom_penh" else 1,
            "analytical_score": 4.0 if row.contributor_type == "working_professional" else 3.5,
            "creative_score": 3.5,
            "people_oriented_score": 4.0 if row.current_major in {"Education & Teaching", "Law", "Tourism & Hospitality", "Nursing"} else 3.0,
            "detail_oriented_score": 4.0,
        }
        for key in ["technology", "business", "medicine", "education", "arts", "law", "engineering", "agriculture", "tourism"]:
            record[f"interest_{key}"] = 1 if key in interests else 0
        record["stem_avg"] = (record["math_score"] + record["science_score"] + record["physics_score"] + record["chemistry_score"]) / 4
        record["language_avg"] = (record["khmer_score"] + record["english_score"]) / 2
        record["social_avg"] = (record["history_score"] + record["geography_score"]) / 2
        record["top_subject_score"] = max(
            record["math_score"],
            record["khmer_score"],
            record["english_score"],
            record["science_score"],
            record["biology_score"],
            record["history_score"],
            record["geography_score"],
            record["physics_score"],
            record["chemistry_score"],
        )
        record["target_major"] = row.current_major
        exported.append(record)

    merged = pd.concat([frame, pd.DataFrame(exported)], ignore_index=True) if not frame.empty else pd.DataFrame(exported)
    merged.to_csv(csv_path, index=False)
    return csv_path


async def log_training_event(db: AsyncSession, metadata: dict, triggered_by: str, notes: str | None = None) -> None:
    db.add(
        ModelTrainingLog(
            model_type=metadata.get("model_type", "unknown"),
            accuracy=float(metadata.get("accuracy", 0.0)),
            precision_score=float(metadata.get("precision", 0.0)),
            recall_score=float(metadata.get("recall", 0.0)),
            f1_score=float(metadata.get("f1", 0.0)),
            training_samples=int(metadata.get("training_samples", 0)),
            triggered_by=triggered_by,
            notes=notes,
        )
    )
