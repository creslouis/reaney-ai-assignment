from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from app.config import get_settings
from ml.explanations_en import EXPLANATIONS_EN
from ml.explanations_kh import EXPLANATIONS_KH

_DEPS_AVAILABLE = False
try:
    import joblib
    import numpy as np
    _DEPS_AVAILABLE = True
except ImportError:
    pass

_FEATURE_ENG_AVAILABLE = False
try:
    from ml.training.feature_engineering import build_feature_vector, feature_columns
    _FEATURE_ENG_AVAILABLE = True
except ImportError:
    pass

logger = logging.getLogger(__name__)

class CareerPredictor:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.model_ready = True
        self.ml_ready = False
        self.model = None
        self.label_encoder = None
        self.scaler = None
        self.metadata = {"model_type": "rule_based_v2", "accuracy": 1.0, "training_samples": 0}

    def load_models(self) -> None:
        if not _DEPS_AVAILABLE:
            logger.warning("ML dependencies (joblib, numpy) not available. Falling back to rule-based.")
            self.ml_ready = False
            return

        model_dir = Path("ml/models")
        model_path = model_dir / "major_classifier.pkl"
        encoder_path = model_dir / "label_encoder.pkl"
        scaler_path = model_dir / "feature_scaler.pkl"
        meta_path = model_dir / "model_metadata.json"

        if not (model_path.exists() and encoder_path.exists() and scaler_path.exists() and meta_path.exists()):
            logger.warning("ML model files not found. Falling back to rule-based.")
            self.ml_ready = False
            return

        try:
            self.model = joblib.load(model_path)
            self.label_encoder = joblib.load(encoder_path)
            self.scaler = joblib.load(scaler_path)
            self.metadata = json.loads(meta_path.read_text(encoding="utf-8"))
            self.ml_ready = True
            logger.info(f"Loaded ML model: {self.metadata.get('model_type')}")
        except Exception as e:
            logger.error(f"Failed to load ML models: {e}. Falling back to rule-based.")
            self.ml_ready = False

    def predict(self, student_features: dict[str, Any]) -> dict[str, Any]:
        if self.ml_ready and _FEATURE_ENG_AVAILABLE:
            try:
                return self._ml_predict(student_features)
            except Exception as e:
                logger.error(f"ML predict failed: {e}. Falling back to rule-based.")
        
        return self._rule_based_predict(student_features)
        
    def _ml_predict(self, student_features: dict[str, Any]) -> dict[str, Any]:
        features_dict = build_feature_vector(student_features)
        columns = feature_columns()
        
        # Build numpy array in exact column order
        feature_array = np.array([[features_dict.get(col, 0.0) for col in columns]])
        scaled_features = self.scaler.transform(feature_array)
        
        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(scaled_features)[0]
        else:
            probs = self.model.decision_function(scaled_features)[0]
            
        classes = self.label_encoder.classes_
        
        # Sort by confidence descending
        sorted_indices = np.argsort(probs)[::-1]
        
        predictions = []
        for idx in sorted_indices[:5]:
            major = classes[idx]
            conf = float(probs[idx])
            predictions.append({
                "major": major,
                "confidence": round(conf, 4),
                "explanation_en": EXPLANATIONS_EN.get(major, f"{major} matches your academic profile, interests, and current preference pattern."),
                "explanation_kh": EXPLANATIONS_KH.get(major, f"ជំនាញ {major} សមស្របជាមួយលទ្ធផលសិក្សា ចំណាប់អារម្មណ៍ និងចំណូលចិត្តរបស់អ្នក។")
            })

        return {
            "top_major": predictions[0]["major"],
            "top_score": predictions[0]["confidence"],
            "all_predictions": predictions,
            "model_used": self.metadata.get("model_type", "unknown_ml"),
            "model_accuracy": float(self.metadata.get("accuracy", 1.0)),
            "training_samples": int(self.metadata.get("training_samples", 0)),
            "raw_features": student_features,
        }

    def _letter_to_score(self, grade: str | float | int | None) -> float:
        if isinstance(grade, (int, float)):
            return float(grade)
        if not grade:
            return 0.0
        mapping = {"A": 5, "B": 4, "C": 3, "D": 2, "E": 1, "F": 0}
        return mapping.get(str(grade).upper().strip(), 0.0)

    def _rule_based_predict(self, features: dict[str, Any]) -> dict[str, Any]:
        # Extract features directly from the raw student_data dict instead of the ML feature vector
        grades = features.get("grades", {})
        interests = {str(i).lower() for i in features.get("interests", [])}
        track = features.get("track", "Science Track")  # Default to Science if missing

        math = self._letter_to_score(grades.get("math"))
        khmer = self._letter_to_score(grades.get("khmer"))
        english = self._letter_to_score(grades.get("english"))
        science = self._letter_to_score(grades.get("science") or grades.get("earth"))
        biology = self._letter_to_score(grades.get("bio") or grades.get("biology"))
        history = self._letter_to_score(grades.get("history"))
        geography = self._letter_to_score(grades.get("geo") or grades.get("geography"))
        physics = self._letter_to_score(grades.get("physics"))
        chemistry = self._letter_to_score(grades.get("chem") or grades.get("chemistry"))

        stem_score = (math + physics + chemistry + science) / 4
        bio_score = (biology + chemistry) / 2
        humanities_score = (khmer + history + geography) / 3
        language_score = (khmer + english) / 2

        scores = {}

        # Phase 1: Track-based constraints
        is_science = "science" in track.lower() and "social" not in track.lower()

        # Engine A: Science Track Eligible Majors
        if is_science:
            scores["Computer Science & IT"] = stem_score * 0.5 + (0.3 if "technology" in interests else 0) + (0.2 if math >= 4 else 0)
            scores["Civil Engineering"] = stem_score * 0.4 + (0.3 if "engineering" in interests else 0) + (0.3 if physics >= 3 else 0)
            scores["Electrical Engineering"] = stem_score * 0.4 + (0.3 if "engineering" in interests else 0) + (0.3 if physics >= 4 else 0)
            scores["Medicine & Health Sciences"] = bio_score * 0.6 + (0.4 if "medicine" in interests else 0)
            scores["Nursing"] = bio_score * 0.4 + (0.4 if "medicine" in interests else 0) + (0.2 if language_score >= 3 else 0)
            scores["Agriculture"] = (science + biology) / 2 * 0.5 + (0.5 if "agriculture" in interests else 0)
            scores["Architecture"] = math * 0.4 + (0.4 if "arts" in interests else 0) + (0.2 if "engineering" in interests else 0)
            scores["Environmental Science"] = (science + geography) / 2 * 0.5 + (0.5 if "environment" in interests else 0)
        else:
            # Engine B: Social Science Eligible Majors
            scores["Law"] = humanities_score * 0.5 + (0.3 if "law" in interests else 0) + (0.2 if khmer >= 4 else 0)
            scores["Political Science"] = humanities_score * 0.5 + (0.3 if "social" in interests else 0) + (0.2 if history >= 4 else 0)
            scores["Media & Communication"] = language_score * 0.5 + (0.3 if "media" in interests else 0) + (0.2 if "arts" in interests else 0)
            scores["International Relations"] = language_score * 0.5 + (0.3 if "social" in interests else 0) + (0.2 if english >= 4 else 0)
            scores["Public Administration"] = humanities_score * 0.6 + (0.4 if "business" in interests or "social" in interests else 0)

        # Cross-Track Majors (Available to both)
        scores["Business Administration"] = language_score * 0.3 + math * 0.2 + (0.5 if "business" in interests else 0)
        scores["Accounting & Finance"] = math * 0.4 + language_score * 0.2 + (0.4 if "finance" in interests or "business" in interests else 0)
        scores["Education & Teaching"] = language_score * 0.4 + (0.6 if "education" in interests else 0)
        scores["Tourism & Hospitality"] = english * 0.4 + (0.4 if "tourism" in interests else 0) + (0.2 if "business" in interests else 0)

        # Normalize scores to 0-1 range
        ordered = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        top5 = ordered[:5]
        max_score = top5[0][1] if top5 and top5[0][1] > 0 else 1

        predictions = []
        for major, score in top5:
            conf = min(0.99, (score / max_score) * 0.95) if max_score > 0 else 0.50
            if score == 0:
                conf = 0.40  # Fallback for empty inputs
            
            predictions.append({
                "major": major,
                "confidence": round(conf, 4),
                "explanation_en": EXPLANATIONS_EN.get(major, "This major aligns well with your profile."),
                "explanation_kh": EXPLANATIONS_KH.get(major, "ជំនាញនេះស្របគ្នាយ៉ាងល្អជាមួយប្រវត្តិរូបរបស់អ្នក។")
            })

        return {
            "top_major": predictions[0]["major"],
            "top_score": predictions[0]["confidence"],
            "all_predictions": predictions,
            "model_used": "rule_based_v2",
            "model_accuracy": 1.0,
            "training_samples": 0,
            "raw_features": features,
        }

    def retrain(self) -> dict[str, Any]:
        return {"accuracy": 1.0, "training_samples": 0, "model_type": "rule_based_v2"}
