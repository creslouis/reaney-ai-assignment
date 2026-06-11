from typing import Any

from pydantic import BaseModel, Field


class SurveyWebhookRequest(BaseModel):
    token: str
    form_data: dict[str, Any]


class SurveyManualRequest(BaseModel):
    source: str = "manual"
    respondent_current_major: str
    respondent_university: str | None = None
    respondent_year: int | None = None
    respondent_satisfaction: int | None = None
    hs_math_score: float | None = None
    hs_khmer_score: float | None = None
    hs_english_score: float | None = None
    hs_science_score: float | None = None
    hs_biology_score: float | None = None
    hs_history_score: float | None = None
    hs_geography_score: float | None = None
    hs_physics_score: float | None = None
    hs_chemistry_score: float | None = None
    hs_interests: list[str] = Field(default_factory=list)
    hs_province: str | None = None
    hs_budget_range: str | None = None
    hs_personality: dict[str, Any] = Field(default_factory=dict)
    actual_major: str
    would_recommend: bool | None = None
    raw_form_data: dict[str, Any] = Field(default_factory=dict)
    google_form_response_id: str | None = None


class SurveySyncRequest(BaseModel):
    sheet_id: str
    sheet_range: str
