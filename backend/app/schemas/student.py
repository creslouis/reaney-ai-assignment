from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PersonalityInput(BaseModel):
    analytical_score: float = 3.0
    creative_score: float = 3.0
    people_oriented_score: float = 3.0
    detail_oriented_score: float = 3.0


class StudentSubmitRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = None
    grade_level: str = "Grade12"
    province: str | None = None
    budget_range: str | None = None
    track: str | None = "Science Track"
    grades: dict[str, float | str] = Field(default_factory=dict)
    interests: list[str] = Field(default_factory=list)
    personality: PersonalityInput = Field(default_factory=PersonalityInput)


class StudentProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    phone: str | None
    grade_level: str
    province: str | None
    budget_range: str | None
    session_id: UUID
    grades: list[dict[str, Any]]
    interests: list[str]
    personality: dict[str, float]


class StudentSubmitResponse(BaseModel):
    student_id: UUID
    session_id: UUID
    ml_prediction: dict[str, Any]
    recommendation: dict[str, Any]
    gemini_summary: str
    results: list[dict[str, Any]]
