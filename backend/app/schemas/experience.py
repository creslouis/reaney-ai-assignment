from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ExperienceSubmitRequest(BaseModel):
    contributor_type: str
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    current_major: str | None = None
    university: str | None = None
    year_of_study: int | None = None
    job_title: str | None = None
    years_of_experience: int | None = None
    province: str | None = None
    satisfaction_score: int | None = None
    would_recommend: bool | None = None
    high_school_interests: list[str] = Field(default_factory=list)
    advice_text: str = Field(min_length=10)
    challenges_text: str | None = None
    why_choose_text: str | None = None


class ExperienceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    contributor_type: str
    name: str
    email: str
    current_major: str | None
    university: str | None
    year_of_study: int | None
    job_title: str | None
    years_of_experience: int | None
    province: str | None
    satisfaction_score: int | None
    would_recommend: bool | None
    high_school_interests: list[str]
    advice_text: str
    challenges_text: str | None
    why_choose_text: str | None
    is_approved: bool
    created_at: datetime
