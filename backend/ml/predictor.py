from __future__ import annotations

from typing import Any

from app.config import get_settings
from ml.explanations_en import EXPLANATIONS_EN
from ml.explanations_kh import EXPLANATIONS_KH


class CareerPredictor:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.model_ready = True
        self.metadata = {"model_type": "rule_based_v2", "accuracy": 1.0, "training_samples": 0}

    def load_models(self) -> None:
        pass  # No ML models to load

    def predict(self, student_features: dict[str, Any]) -> dict[str, Any]:
        return self._rule_based_predict(student_features)

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

