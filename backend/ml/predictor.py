from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.config import get_settings
from ml.training.feature_engineering import build_feature_vector, feature_columns
from ml.training.train_model import train_and_save


MAJORS = [
    "Computer Science & IT",
    "Business Administration",
    "Accounting & Finance",
    "Civil Engineering",
    "Electrical Engineering",
    "Medicine & Health Sciences",
    "Nursing",
    "Education & Teaching",
    "Law",
    "Tourism & Hospitality",
    "Agriculture",
    "Architecture",
    "Environmental Science",
    "Media & Communication",
    "International Relations",
]


class CareerPredictor:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.model = None
        self.label_encoder = None
        self.scaler = None
        self.metadata: dict[str, Any] = {}
        self.model_ready = False
        self.load_models()

    def load_models(self) -> None:
        model_path = Path("ml/models/major_classifier.pkl")
        encoder_path = Path("ml/models/label_encoder.pkl")
        scaler_path = Path("ml/models/feature_scaler.pkl")
        metadata_path = Path("ml/models/model_metadata.json")

        if model_path.exists() and encoder_path.exists() and scaler_path.exists() and metadata_path.exists():
            self.model = joblib.load(model_path)
            self.label_encoder = joblib.load(encoder_path)
            self.scaler = joblib.load(scaler_path)
            self.metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            self.model_ready = (
                self.metadata.get("data_source") == "survey"
                and int(self.metadata.get("training_samples", 0)) >= self.settings.ml_retrain_threshold
            )
        else:
            self.model_ready = False

    def predict(self, student_features: dict[str, Any]) -> dict[str, Any]:
        features = build_feature_vector(student_features)
        if self.model_ready and self.model is not None:
            return self._ml_predict(features)
        return self._rule_based_predict(features)

    def _ml_predict(self, features: dict[str, float]) -> dict[str, Any]:
        cols = feature_columns()
        frame = pd.DataFrame([[features[c] for c in cols]], columns=cols)
        scaled = self.scaler.transform(frame)

        probs = self.model.predict_proba(scaled)[0]
        indices = np.argsort(probs)[::-1][:4]
        predictions = []
        for idx in indices:
            major = self.label_encoder.inverse_transform([idx])[0]
            predictions.append({"major": major, "confidence": round(float(probs[idx]), 4)})

        top = predictions[0]
        return {
            "top_major": top["major"],
            "top_score": top["confidence"],
            "all_predictions": predictions,
            "model_used": self.metadata.get("model_type", "random_forest"),
            "model_accuracy": float(self.metadata.get("accuracy", 0.0)),
            "training_samples": int(self.metadata.get("training_samples", 0)),
            "raw_features": features,
        }

    def _rule_based_predict(self, features: dict[str, float]) -> dict[str, Any]:
        scores = {
            "Computer Science & IT": features["stem_avg"] * 0.5 + features["interest_technology"] * 30 + features["interest_engineering"] * 20,
            "Business Administration": features["language_avg"] * 0.4 + features["interest_business"] * 35,
            "Accounting & Finance": features["math_score"] * 0.5 + features["interest_business"] * 25,
            "Civil Engineering": features["math_score"] * 0.5 + features["physics_score"] * 0.3 + features["interest_engineering"] * 25,
            "Electrical Engineering": features["math_score"] * 0.45 + features["physics_score"] * 0.35 + features["interest_engineering"] * 25,
            "Medicine & Health Sciences": features["biology_score"] * 0.5 + features["chemistry_score"] * 0.3 + features["interest_medicine"] * 30,
            "Nursing": features["biology_score"] * 0.45 + features["people_oriented_score"] * 12 + features["interest_medicine"] * 25,
            "Education & Teaching": features["language_avg"] * 0.45 + features["people_oriented_score"] * 10 + features["interest_education"] * 30,
            "Law": features["social_avg"] * 0.45 + features["language_avg"] * 0.25 + features["interest_law"] * 30,
            "Tourism & Hospitality": features["english_score"] * 0.4 + features["people_oriented_score"] * 12 + features["interest_tourism"] * 30,
            "Agriculture": features["science_score"] * 0.4 + features["interest_agriculture"] * 30,
            "Architecture": features["math_score"] * 0.35 + features["creative_score"] * 12 + features["interest_arts"] * 30,
            "Environmental Science": features["science_score"] * 0.35 + features["social_avg"] * 0.25 + features["interest_agriculture"] * 20,
            "Media & Communication": features["english_score"] * 0.35 + features["creative_score"] * 14 + features["interest_arts"] * 20,
            "International Relations": features["english_score"] * 0.35 + features["social_avg"] * 0.35 + features["people_oriented_score"] * 10,
        }

        ordered = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        top3 = ordered[:4]
        max_score = top3[0][1] if top3 else 1

        preds = [{"major": major, "confidence": round(score / max_score, 4)} for major, score in top3]
        return {
            "top_major": preds[0]["major"],
            "top_score": preds[0]["confidence"],
            "all_predictions": preds,
            "model_used": "rule_based",
            "model_accuracy": float(self.metadata.get("accuracy", 0.0)),
            "training_samples": int(self.metadata.get("training_samples", 0)),
            "raw_features": features,
        }

    def retrain(self) -> dict[str, Any]:
        data_source = "survey" if Path("ml/data/survey_data.csv").exists() else "seed"
        result = train_and_save(data_source=data_source, triggered_by="admin")
        self.load_models()
        return result
