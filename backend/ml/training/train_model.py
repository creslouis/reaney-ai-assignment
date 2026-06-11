from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, top_k_accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

from app.config import get_settings
from ml.training.feature_engineering import feature_columns
from ml.training.seed_data import generate_seed_data

try:
    from catboost import CatBoostClassifier
except Exception:  # pragma: no cover
    CatBoostClassifier = None


MODEL_DIR = Path("ml/models")
MODEL_PATH = MODEL_DIR / "major_classifier.pkl"
ENCODER_PATH = MODEL_DIR / "label_encoder.pkl"
SCALER_PATH = MODEL_DIR / "feature_scaler.pkl"
META_PATH = MODEL_DIR / "model_metadata.json"


def _load_dataset(data_source: str = "seed") -> pd.DataFrame:
    if data_source == "survey":
        survey_path = Path("ml/data/survey_data.csv")
        if survey_path.exists():
            return pd.read_csv(survey_path)
    seed_path = Path("ml/data/seed_dataset.csv")
    if not seed_path.exists():
        generate_seed_data(300, str(seed_path))
    return pd.read_csv(seed_path)


def train_and_save(data_source: str = "seed", triggered_by: str = "manual") -> dict:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    df = _load_dataset(data_source)
    columns = feature_columns()

    if "target_major" not in df.columns:
        raise ValueError("Dataset missing target_major column")

    x = df[columns]
    y = df["target_major"]

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    scaler = StandardScaler()
    x_scaled = scaler.fit_transform(x)

    x_train, x_test, y_train, y_test = train_test_split(
        x_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    candidates = {
        "random_forest": RandomForestClassifier(n_estimators=250, random_state=42, class_weight="balanced"),
        "gradient_boosting": GradientBoostingClassifier(random_state=42),
        "hist_gradient_boosting": HistGradientBoostingClassifier(random_state=42),
    }
    if CatBoostClassifier is not None:
        candidates["catboost"] = CatBoostClassifier(verbose=0, random_seed=42)

    comparison = []
    best_model = None
    model_used = "random_forest"
    best_pred = None
    best_probs = None
    best_acc = -1.0

    for name, model in candidates.items():
        model.fit(x_train, y_train)
        pred = model.predict(x_test)
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(x_test)
        else:
            decision = model.decision_function(x_test)
            probs = decision
        acc = accuracy_score(y_test, pred)
        try:
            top3 = top_k_accuracy_score(y_test, probs, k=min(3, len(label_encoder.classes_)), labels=list(range(len(label_encoder.classes_))))
        except Exception:
            top3 = acc
        comparison.append({"model": name, "accuracy": float(acc), "top3_accuracy": float(top3)})
        if acc > best_acc:
            best_model = model
            model_used = name
            best_pred = pred
            best_probs = probs
            best_acc = acc

    report = classification_report(y_test, best_pred, output_dict=True, zero_division=0)
    try:
        best_top3 = top_k_accuracy_score(
            y_test,
            best_probs,
            k=min(3, len(label_encoder.classes_)),
            labels=list(range(len(label_encoder.classes_))),
        )
    except Exception:
        best_top3 = best_acc

    joblib.dump(best_model, MODEL_PATH)
    joblib.dump(label_encoder, ENCODER_PATH)
    joblib.dump(scaler, SCALER_PATH)

    old_meta = {}
    if META_PATH.exists():
        old_meta = json.loads(META_PATH.read_text(encoding="utf-8"))

    meta = {
        "model_type": model_used,
        "data_source": data_source,
        "accuracy": float(best_acc),
        "training_samples": int(len(df)),
        "training_date": datetime.now(timezone.utc).isoformat(),
        "triggered_by": triggered_by,
        "old_accuracy": old_meta.get("accuracy"),
        "top3_accuracy": float(best_top3),
        "precision": float(report.get("weighted avg", {}).get("precision", 0.0)),
        "recall": float(report.get("weighted avg", {}).get("recall", 0.0)),
        "f1": float(report.get("weighted avg", {}).get("f1-score", 0.0)),
        "comparison": comparison,
    }
    META_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta


def should_retrain() -> bool:
    settings = get_settings()
    survey_path = Path("ml/data/survey_data.csv")
    if not survey_path.exists():
        return False
    survey_df = pd.read_csv(survey_path)
    if len(survey_df) < settings.ml_retrain_threshold:
        return False
    if not META_PATH.exists():
        return True

    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    trained_at = datetime.fromisoformat(meta["training_date"])
    return datetime.now(timezone.utc) - trained_at >= timedelta(days=settings.ml_retrain_interval_days)
