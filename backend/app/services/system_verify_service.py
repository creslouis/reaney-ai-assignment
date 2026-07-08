from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.cambodia_universities import CAREER_PATHS, MAJOR_KHMER, UNIVERSITIES
from app.services.gemini_service import gemini_service
from app.services.predictor_singleton import predictor
from ml.explanations_en import EXPLANATIONS_EN
from ml.explanations_kh import EXPLANATIONS_KH
from ml.training.feature_engineering import feature_columns


MODEL_DIR = Path("ml/models")
MODEL_FILES = {
    "model": MODEL_DIR / "major_classifier.pkl",
    "label_encoder": MODEL_DIR / "label_encoder.pkl",
    "scaler": MODEL_DIR / "feature_scaler.pkl",
    "metadata": MODEL_DIR / "model_metadata.json",
}
ALLOWED_MODEL_TYPES = {"random_forest", "gradient_boosting", "hist_gradient_boosting", "catboost", "rule_based_v2"}


def _ok(ok: bool, **details: Any) -> dict[str, Any]:
    return {"ok": ok, **details}


def _known_major_sets() -> dict[str, set[str]]:
    label_encoder = getattr(predictor, "label_encoder", None)
    raw_classes = getattr(label_encoder, "classes_", None) if label_encoder is not None else None
    ml_classes = list(raw_classes) if raw_classes is not None else []
    sample_science = predictor._rule_based_predict(  # noqa: SLF001
        {
            "grades": {"math": 95, "physics": 92, "chem": 88, "science": 90, "bio": 75, "english": 80, "khmer": 78},
            "interests": ["technology", "engineering", "business", "arts", "medicine", "agriculture", "environment"],
            "track": "Science Track",
        }
    )
    sample_social = predictor._rule_based_predict(  # noqa: SLF001
        {
            "grades": {"khmer": 90, "english": 88, "history": 92, "geo": 85, "math": 65, "science": 60},
            "interests": ["law", "social", "media", "arts", "business", "tourism"],
            "track": "Social Science Track",
        }
    )
    rule_majors = {item["major"] for item in sample_science["all_predictions"] + sample_social["all_predictions"]}
    ml_majors = set(ml_classes)
    return {
        "rule_based": rule_majors,
        "ml": ml_majors,
        "universities": set(UNIVERSITIES.keys()),
        "careers": set(CAREER_PATHS.keys()),
        "khmer": set(MAJOR_KHMER.keys()),
        "explanations_en": set(EXPLANATIONS_EN.keys()),
        "explanations_kh": set(EXPLANATIONS_KH.keys()),
    }


def _major_alignment_check() -> dict[str, Any]:
    known = _known_major_sets()
    supported = known["universities"] & known["careers"] & known["khmer"]
    missing = {
        "rule_missing_universities": sorted(known["rule_based"] - known["universities"]),
        "rule_missing_careers": sorted(known["rule_based"] - known["careers"]),
        "rule_missing_khmer": sorted(known["rule_based"] - known["khmer"]),
        "ml_missing_universities": sorted(known["ml"] - known["universities"]),
        "ml_missing_careers": sorted(known["ml"] - known["careers"]),
        "ml_missing_khmer": sorted(known["ml"] - known["khmer"]),
        "missing_explanations_en": sorted(supported - known["explanations_en"]),
        "missing_explanations_kh": sorted(supported - known["explanations_kh"]),
    }
    ok = all(not values for values in missing.values())
    return _ok(ok, **missing)


def _artifact_check() -> dict[str, Any]:
    files = {name: path.exists() for name, path in MODEL_FILES.items()}
    return _ok(all(files.values()), files=files)


def _metadata_check() -> dict[str, Any]:
    path = MODEL_FILES["metadata"]
    if not path.exists():
        return _ok(False, reason="metadata file missing")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return _ok(False, reason=f"invalid metadata json: {exc}")

    model_type = str(data.get("model_type", ""))
    training_samples = int(data.get("training_samples", 0) or 0)
    training_date = data.get("training_date")
    ok = bool(model_type in ALLOWED_MODEL_TYPES and training_samples >= 0 and training_date)
    return _ok(
        ok,
        model_type=model_type,
        training_samples=training_samples,
        training_date=training_date,
        accuracy=data.get("accuracy"),
    )


def _feature_schema_check() -> dict[str, Any]:
    columns = feature_columns()
    scaler = getattr(predictor, "scaler", None)
    expected = getattr(scaler, "n_features_in_", None)
    if expected is None:
        return _ok(True, feature_count=len(columns), scaler_feature_count=None)
    return _ok(expected == len(columns), feature_count=len(columns), scaler_feature_count=int(expected))


def _sample_prediction_input(track: str) -> dict[str, Any]:
    base = {
        "budget_range": "public",
        "province": "phnom_penh",
        "personality": {
            "analytical_score": 4.2,
            "creative_score": 3.4,
            "people_oriented_score": 3.5,
            "detail_oriented_score": 4.1,
        },
        "track": track,
    }
    if "science" in track.lower():
        return {
            **base,
            "grades": {"math": 92, "physics": 88, "chem": 84, "science": 86, "bio": 73, "english": 80, "khmer": 76},
            "interests": ["technology", "engineering"],
        }
    return {
        **base,
        "grades": {"khmer": 90, "english": 86, "history": 89, "geo": 83, "math": 68, "science": 65},
        "interests": ["law", "media", "business"],
    }


def _prediction_check(mode: str) -> dict[str, Any]:
    checks = {}
    for key, sample in {
        "science": _sample_prediction_input("Science Track"),
        "social": _sample_prediction_input("Social Science Track"),
    }.items():
        result = predictor.predict(sample)
        predictions = result.get("all_predictions", [])
        majors = [item.get("major") for item in predictions]
        scores = [float(item.get("confidence", 0.0)) for item in predictions]
        checks[key] = {
            "model_used": result.get("model_used"),
            "top_major": result.get("top_major"),
            "prediction_count": len(predictions),
            "majors": majors,
            "sorted_desc": scores == sorted(scores, reverse=True),
            "supported_majors": all(major in UNIVERSITIES and major in CAREER_PATHS for major in majors if major),
        }
    ok = all(
        item["prediction_count"] > 0 and item["sorted_desc"] and item["supported_majors"]
        for item in checks.values()
    )
    return _ok(ok, mode=mode, samples=checks)


async def _gemini_check(mode: str) -> dict[str, Any]:
    if not gemini_service.available:
        return _ok(False, configured=False, live_checked=False, reason="gemini api key missing")
    if mode != "deep":
        return _ok(True, configured=True, live_checked=False, model=gemini_service.model_name)

    text = gemini_service._generate("Reply with exactly: OK", "OK")  # noqa: SLF001
    ok = bool(text and not text.startswith("[API ERROR]"))
    return _ok(ok, configured=True, live_checked=True, model=gemini_service.model_name, response_preview=text[:120])


async def verify_system(db: AsyncSession, mode: str = "shallow") -> dict[str, Any]:
    checks: dict[str, Any] = {}

    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = _ok(True)
    except Exception as exc:
        checks["database"] = _ok(False, reason=str(exc))

    checks["ml_artifacts"] = _artifact_check()
    checks["ml_metadata"] = _metadata_check()
    checks["predictor_runtime"] = _ok(
        True,
        ml_ready=bool(getattr(predictor, "ml_ready", False)),
        model_type=predictor.metadata.get("model_type", "rule_based_v2"),
        training_samples=int(predictor.metadata.get("training_samples", 0)),
    )
    checks["feature_schema"] = _feature_schema_check()
    checks["major_alignment"] = _major_alignment_check()
    checks["sample_predictions"] = _prediction_check(mode)
    checks["gemini"] = await _gemini_check(mode)

    failing = [name for name, result in checks.items() if not result.get("ok", False)]
    status = "ok" if not failing else "degraded"
    return {
        "status": status,
        "mode": mode,
        "summary": {
            "all_checks_passed": not failing,
            "failed_checks": failing,
            "predictor_mode": "ml" if getattr(predictor, "ml_ready", False) else "rule_based",
        },
        "checks": checks,
    }
