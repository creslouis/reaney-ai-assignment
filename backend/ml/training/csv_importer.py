"""
csv_importer.py
Maps uploaded Google Survey CSV/JSON to the internal training format.
Flexible column mapping handles common survey column name variations.
"""
from __future__ import annotations

import io
import json
from pathlib import Path
from typing import Any

import pandas as pd

from ml.training.feature_engineering import INTEREST_COLUMNS, letter_grade_to_score

# ---------------------------------------------------------------------------
# Column name aliases  (survey col -> internal name)
# ---------------------------------------------------------------------------
GRADE_ALIASES: dict[str, str] = {
    # Math
    "math": "math", "mathematics": "math", "គណិតវិទ្យា": "math",
    # Khmer
    "khmer": "khmer", "khmer language": "khmer", "ភាសាខ្មែរ": "khmer",
    # English
    "english": "english", "english language": "english", "ភាសាអង់គ្លេស": "english",
    # Science
    "science": "science", "earth science": "science", "earth": "science",
    # Biology
    "biology": "biology", "bio": "biology", "ជីវវិទ្យា": "biology",
    # History
    "history": "history", "ប្រវត្តិសាស្ត្រ": "history",
    # Geography
    "geography": "geography", "geo": "geography", "ភូមិវិទ្យា": "geography",
    # Physics
    "physics": "physics", "រូបវិទ្យា": "physics",
    # Chemistry
    "chemistry": "chemistry", "chem": "chemistry", "គីមីវិទ្យា": "chemistry",
}

INTEREST_ALIASES: dict[str, str] = {
    "technology": "technology", "tech": "technology", "it": "technology",
    "business": "business", "commerce": "business",
    "medicine": "medicine", "medical": "medicine", "health": "medicine",
    "education": "education", "teaching": "education",
    "arts": "arts", "art": "arts",
    "law": "law", "legal": "law",
    "engineering": "engineering", "engineer": "engineering",
    "agriculture": "agriculture", "farming": "agriculture",
    "tourism": "tourism", "hospitality": "tourism",
}

MAJOR_ALIASES: dict[str, str] = {
    "computer science": "Computer Science & IT",
    "computer science & it": "Computer Science & IT",
    "it": "Computer Science & IT",
    "information technology": "Computer Science & IT",
    "business administration": "Business Administration",
    "business": "Business Administration",
    "accounting": "Accounting & Finance",
    "accounting & finance": "Accounting & Finance",
    "finance": "Accounting & Finance",
    "civil engineering": "Civil Engineering",
    "electrical engineering": "Electrical Engineering",
    "engineering": "Civil Engineering",
    "medicine": "Medicine & Health Sciences",
    "medicine & health sciences": "Medicine & Health Sciences",
    "health sciences": "Medicine & Health Sciences",
    "nursing": "Nursing",
    "education": "Education & Teaching",
    "education & teaching": "Education & Teaching",
    "teaching": "Education & Teaching",
    "law": "Law",
    "tourism": "Tourism & Hospitality",
    "tourism & hospitality": "Tourism & Hospitality",
    "hospitality": "Tourism & Hospitality",
    "agriculture": "Agriculture",
    "architecture": "Architecture",
    "environmental science": "Environmental Science",
    "media": "Media & Communication",
    "media & communication": "Media & Communication",
    "communication": "Media & Communication",
    "international relations": "International Relations",
}

BUDGET_ALIASES: dict[str, str] = {
    "low": "low", "public": "low", "scholarship": "scholarship",
    "medium": "medium", "private": "medium", "high": "high",
}


def _normalize(s: Any) -> str:
    return str(s).strip().lower()


def _find_column(df: pd.DataFrame, aliases: dict[str, str]) -> dict[str, str]:
    """Return mapping of df column -> internal name for matched aliases."""
    result = {}
    for col in df.columns:
        key = _normalize(col)
        if key in aliases:
            result[col] = aliases[key]
    return result


def _score(val: Any) -> float:
    s = str(val).strip()
    # Letter grade
    if s.upper() in {"A", "B", "C", "D", "E", "F"}:
        return letter_grade_to_score(s)
    try:
        return float(s)
    except (ValueError, TypeError):
        return 0.0


def import_csv_to_training_rows(content: bytes, filename: str) -> pd.DataFrame:
    """
    Parse uploaded CSV or JSON, map columns, and return a DataFrame
    in the internal training format (same columns as seed_dataset.csv).
    """
    fname = filename.lower()
    if fname.endswith(".json") or fname.endswith(".jsonl"):
        try:
            records = json.loads(content.decode("utf-8-sig"))
            if isinstance(records, dict):
                records = [records]
            raw_df = pd.DataFrame(records)
        except Exception as exc:
            raise ValueError(f"Invalid JSON: {exc}") from exc
    else:
        try:
            raw_df = pd.read_csv(io.BytesIO(content), encoding="utf-8-sig")
        except Exception as exc:
            raise ValueError(f"Invalid CSV: {exc}") from exc

    if raw_df.empty:
        raise ValueError("Uploaded file is empty")

    grade_map = _find_column(raw_df, GRADE_ALIASES)
    interest_map = _find_column(raw_df, INTEREST_ALIASES)

    # Detect target_major column
    major_col = None
    for col in raw_df.columns:
        if _normalize(col) in {"target_major", "major", "chosen_major", "recommended_major",
                                "intended major", "desired major", "major choice"}:
            major_col = col
            break

    # Detect budget column
    budget_col = None
    for col in raw_df.columns:
        if _normalize(col) in {"budget", "budget_range", "budget range", "family budget"}:
            budget_col = col
            break

    # Detect province column
    province_col = None
    for col in raw_df.columns:
        if _normalize(col) in {"province", "location", "city", "region"}:
            province_col = col
            break

    rows = []
    for _, row in raw_df.iterrows():
        # Grades
        grades: dict[str, float] = {}
        for df_col, internal in grade_map.items():
            grades[internal] = _score(row[df_col])

        # Derive computed grade features
        math = grades.get("math", 0.0)
        khmer = grades.get("khmer", 0.0)
        english = grades.get("english", 0.0)
        science = grades.get("science", 0.0)
        biology = grades.get("biology", 0.0)
        history = grades.get("history", 0.0)
        geography = grades.get("geography", 0.0)
        physics = grades.get("physics", 0.0)
        chemistry = grades.get("chemistry", 0.0)

        stem_avg = (math + science + physics + chemistry) / 4
        language_avg = (khmer + english) / 2
        social_avg = (history + geography) / 2
        top_subject_score = max(math, khmer, english, science, biology, history, geography, physics, chemistry, 0.0)

        # Interests (binary columns in survey)
        interest_set: set[str] = set()
        for df_col, internal in interest_map.items():
            val = str(row[df_col]).strip().lower()
            if val in {"1", "true", "yes", "y", "x", "✓", "checked"}:
                interest_set.add(internal)

        # If interests are stored as a comma-separated text column instead
        for col in raw_df.columns:
            if _normalize(col) in {"interests", "interest", "hobbies"}:
                raw_interests = str(row[col]).lower()
                for token in raw_interests.replace(";", ",").split(","):
                    t = token.strip()
                    if t in INTEREST_ALIASES:
                        interest_set.add(INTEREST_ALIASES[t])

        # Budget
        budget_raw = _normalize(row[budget_col]) if budget_col else ""
        budget = BUDGET_ALIASES.get(budget_raw, "medium")

        # Province
        province_raw = _normalize(row[province_col]) if province_col else ""
        province = "phnom_penh" if "phnom penh" in province_raw or province_raw == "phnom_penh" else "province"

        # Target major
        if major_col:
            raw_major = _normalize(row[major_col])
            target_major = MAJOR_ALIASES.get(raw_major, str(row[major_col]).strip())
        else:
            target_major = None

        record: dict[str, Any] = {
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
            "budget_public": 1.0 if budget in {"low", "public"} else 0.0,
            "budget_private": 1.0 if budget in {"medium", "high", "private"} else 0.0,
            "budget_scholarship": 1.0 if budget == "scholarship" else 0.0,
            "location_phnom_penh": 1.0 if province == "phnom_penh" else 0.0,
            "location_province": 0.0 if province == "phnom_penh" else 1.0,
            "analytical_score": 3.0,
            "creative_score": 3.0,
            "people_oriented_score": 3.0,
            "detail_oriented_score": 3.0,
        }
        for col in INTEREST_COLUMNS:
            record[f"interest_{col}"] = 1.0 if col in interest_set else 0.0

        if target_major:
            record["target_major"] = target_major

        rows.append(record)

    result_df = pd.DataFrame(rows)
    if "target_major" not in result_df.columns:
        raise ValueError(
            "Could not find a 'target_major' / 'major' column in your file. "
            "Please add a column named 'target_major' with the student's chosen major."
        )
    return result_df


def save_uploaded_dataset(df: pd.DataFrame, merge: bool = True) -> int:
    """Save parsed rows to ml/data/survey_data.csv. Returns total row count."""
    out_path = Path("ml/data/survey_data.csv")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if merge and out_path.exists():
        existing = pd.read_csv(out_path)
        combined = pd.concat([existing, df], ignore_index=True)
    else:
        combined = df

    combined.to_csv(out_path, index=False)
    return len(combined)
