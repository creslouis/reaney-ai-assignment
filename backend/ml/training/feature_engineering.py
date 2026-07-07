from __future__ import annotations

from typing import Any


INTEREST_COLUMNS = [
    "technology",
    "business",
    "medicine",
    "education",
    "arts",
    "law",
    "engineering",
    "agriculture",
    "tourism",
]


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def letter_grade_to_score(letter: str | float | int | None) -> float | None:
    if isinstance(letter, (float, int)):
        return float(letter)
    if not letter:
        return None
    mapping = {"A": 95, "B": 85, "C": 75, "D": 65, "E": 55, "F": 45}
    return float(mapping.get(str(letter).upper(), None))


def build_feature_vector(student_data: dict[str, Any]) -> dict[str, float]:
    grades = student_data.get("grades", {})
    interests = student_data.get("interests", [])
    personality = student_data.get("personality", {})

    raw_scores = {
        "math": letter_grade_to_score(grades.get("math")),
        "khmer": letter_grade_to_score(grades.get("khmer")),
        "english": letter_grade_to_score(grades.get("english")),
        "science": letter_grade_to_score(grades.get("science") or grades.get("earth")),
        "biology": letter_grade_to_score(grades.get("bio") or grades.get("biology")),
        "history": letter_grade_to_score(grades.get("history")),
        "geography": letter_grade_to_score(grades.get("geo") or grades.get("geography")),
        "physics": letter_grade_to_score(grades.get("physics")),
        "chemistry": letter_grade_to_score(grades.get("chem") or grades.get("chemistry")),
    }

    # Calculate average of provided grades to impute missing ones
    valid_scores = [s for s in raw_scores.values() if s is not None]
    avg_score = sum(valid_scores) / len(valid_scores) if valid_scores else 65.0

    math = raw_scores["math"] or avg_score
    khmer = raw_scores["khmer"] or avg_score
    english = raw_scores["english"] or avg_score
    science = raw_scores["science"] or avg_score
    biology = raw_scores["biology"] or avg_score
    history = raw_scores["history"] or avg_score
    geography = raw_scores["geography"] or avg_score
    physics = raw_scores["physics"] or avg_score
    chemistry = raw_scores["chemistry"] or avg_score

    stem_avg = (math + science + physics + chemistry) / 4
    language_avg = (khmer + english) / 2
    social_avg = (history + geography) / 2
    top_subject_score = max(math, khmer, english, science, biology, history, geography, physics, chemistry)

    interest_set = {str(i).lower() for i in interests}
    features: dict[str, float] = {
        "math_score": math,
        "khmer_score": khmer,
        "english_score": english,
        "science_score": science,
        "biology_score": biology,
        "history_score": history,
        "geography_score": geography,
        "physics_score": physics,
        "chemistry_score": chemistry,
        "stem_avg": stem_avg,
        "language_avg": language_avg,
        "social_avg": social_avg,
        "top_subject_score": top_subject_score,
        "budget_public": 1.0 if student_data.get("budget_range") in {"low", "public"} else 0.0,
        "budget_private": 1.0 if student_data.get("budget_range") in {"medium", "high", "private"} else 0.0,
        "budget_scholarship": 1.0 if student_data.get("budget_range") in {"low", "scholarship"} else 0.0,
        "location_phnom_penh": 1.0 if student_data.get("province") == "phnom_penh" else 0.0,
        "location_province": 0.0 if student_data.get("province") == "phnom_penh" else 1.0,
        "analytical_score": _to_float(personality.get("analytical_score"), 3.0),
        "creative_score": _to_float(personality.get("creative_score"), 3.0),
        "people_oriented_score": _to_float(personality.get("people_oriented_score"), 3.0),
        "detail_oriented_score": _to_float(personality.get("detail_oriented_score"), 3.0),
    }

    for item in INTEREST_COLUMNS:
        features[f"interest_{item}"] = 1.0 if item in interest_set else 0.0

    return features


def feature_columns() -> list[str]:
    columns = [
        "math_score",
        "khmer_score",
        "english_score",
        "science_score",
        "biology_score",
        "history_score",
        "geography_score",
        "physics_score",
        "chemistry_score",
        "stem_avg",
        "language_avg",
        "social_avg",
        "top_subject_score",
    ]
    columns.extend([f"interest_{name}" for name in INTEREST_COLUMNS])
    columns.extend(
        [
            "budget_public",
            "budget_private",
            "budget_scholarship",
            "location_phnom_penh",
            "location_province",
            "analytical_score",
            "creative_score",
            "people_oriented_score",
            "detail_oriented_score",
        ]
    )
    return columns
