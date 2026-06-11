import os

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://user:password@localhost:5432/dbname")

from ml.predictor import CareerPredictor  # noqa: E402


def test_rule_based_prediction_returns_ranked_results():
    predictor = CareerPredictor()
    predictor.model_ready = False
    sample = {
        "grades": {"math": "A", "physics": "A", "chem": "B", "english": "B", "khmer": "B", "history": "C", "bio": "B"},
        "interests": ["technology", "engineering"],
        "budget_range": "public",
        "province": "phnom_penh",
        "personality": {
            "analytical_score": 4.5,
            "creative_score": 3.0,
            "people_oriented_score": 3.0,
            "detail_oriented_score": 4.0,
        },
    }
    result = predictor.predict(sample)
    assert result["model_used"] == "rule_based"
    assert len(result["all_predictions"]) == 4
    assert result["top_major"] == result["all_predictions"][0]["major"]
