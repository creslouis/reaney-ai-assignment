from typing import Any

from pydantic import BaseModel, ConfigDict


class MLPredictRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    student_id: str


class MLPredictResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    top_major: str
    top_score: float
    all_predictions: list[dict[str, Any]]
    model_used: str
    model_accuracy: float
    training_samples: int


class MLStatusResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model_type: str
    accuracy: float
    training_samples: int
    last_trained: str | None
    is_ready: bool
    ml_model_loaded: bool = False
