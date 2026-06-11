from __future__ import annotations

import random
import sys
from pathlib import Path

import pandas as pd

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ml.training.feature_engineering import build_feature_vector, feature_columns

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


def _noisy(low: float, high: float) -> float:
    base = random.uniform(low, high)
    return max(35.0, min(100.0, random.gauss(base, 4.5)))


def _profile_for_major(major: str) -> dict:
    common = {
        "khmer": _noisy(60, 90),
        "math": _noisy(55, 95),
        "english": _noisy(55, 90),
        "science": _noisy(50, 90),
        "bio": _noisy(50, 90),
        "history": _noisy(50, 90),
        "geo": _noisy(50, 90),
        "physics": _noisy(50, 90),
        "chem": _noisy(50, 90),
    }
    interests = []

    if major in {"Computer Science & IT", "Electrical Engineering", "Civil Engineering"}:
        common["math"] = _noisy(82, 98)
        common["physics"] = _noisy(80, 95)
        interests = ["technology", "engineering"]
    elif major in {"Business Administration", "Accounting & Finance"}:
        common["math"] = _noisy(70, 90)
        common["english"] = _noisy(75, 95)
        interests = ["business"]
    elif major in {"Medicine & Health Sciences", "Nursing"}:
        common["bio"] = _noisy(82, 97)
        common["chem"] = _noisy(75, 95)
        interests = ["medicine"]
    elif major in {"Education & Teaching", "Law", "International Relations"}:
        common["khmer"] = _noisy(80, 97)
        common["history"] = _noisy(78, 95)
        interests = ["education", "law"]
    elif major in {"Tourism & Hospitality", "Media & Communication"}:
        common["english"] = _noisy(78, 97)
        common["khmer"] = _noisy(70, 90)
        interests = ["tourism", "media"]
    elif major == "Agriculture":
        common["science"] = _noisy(70, 92)
        common["bio"] = _noisy(72, 95)
        interests = ["agriculture", "environment"]
    elif major in {"Architecture", "Environmental Science"}:
        common["math"] = _noisy(72, 93)
        common["physics"] = _noisy(68, 92)
        interests = ["arts", "environment", "engineering"]

    return {
        "grades": common,
        "interests": interests,
        "personality": {
            "analytical_score": random.uniform(2.4, 4.8),
            "creative_score": random.uniform(2.2, 4.8),
            "people_oriented_score": random.uniform(2.2, 4.8),
            "detail_oriented_score": random.uniform(2.2, 4.8),
        },
        "budget_range": random.choice(["public", "private", "scholarship"]),
        "province": random.choice(["phnom_penh", "siem_reap", "battambang", "kampong_cham", "other"]),
    }


def generate_seed_data(n_samples: int = 300, output_path: str | None = None) -> Path:
    output = Path(output_path or "ml/data/seed_dataset.csv")
    output.parent.mkdir(parents=True, exist_ok=True)

    rows = []
    majors = [random.choice(MAJORS) for _ in range(n_samples)]
    for major in majors:
        profile = _profile_for_major(major)
        features = build_feature_vector(profile)
        row = {k: features[k] for k in feature_columns()}
        row["target_major"] = major
        rows.append(row)

    pd.DataFrame(rows).to_csv(output, index=False)
    return output


if __name__ == "__main__":
    generate_seed_data(300)
