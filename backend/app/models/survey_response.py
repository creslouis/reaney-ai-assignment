from sqlalchemy import Boolean, Float, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class SurveyResponse(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "survey_responses"

    source: Mapped[str] = mapped_column(String(20), default="manual")

    respondent_current_major: Mapped[str] = mapped_column(String(100))
    respondent_university: Mapped[str | None] = mapped_column(String(100), nullable=True)
    respondent_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    respondent_satisfaction: Mapped[int | None] = mapped_column(Integer, nullable=True)

    hs_math_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    hs_khmer_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    hs_english_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    hs_science_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    hs_biology_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    hs_history_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    hs_geography_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    hs_physics_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    hs_chemistry_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    hs_interests: Mapped[list] = mapped_column(JSONB, default=list)
    hs_province: Mapped[str | None] = mapped_column(String(100), nullable=True)
    hs_budget_range: Mapped[str | None] = mapped_column(String(20), nullable=True)
    hs_personality: Mapped[dict] = mapped_column(JSONB, default=dict)

    actual_major: Mapped[str] = mapped_column(String(100))
    would_recommend: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    raw_form_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    google_form_response_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
