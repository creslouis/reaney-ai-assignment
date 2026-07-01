from sqlalchemy import String, Float, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin

class HighschoolSurvey(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "highschool_surveys"

    study_track: Mapped[str] = mapped_column(String(50))
    intended_major: Mapped[str] = mapped_column(String(100))
    province: Mapped[str | None] = mapped_column(String(100), nullable=True)
    budget_range: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    math_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    khmer_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    english_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    science_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    biology_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    history_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    geography_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    physics_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    chemistry_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    interests: Mapped[list] = mapped_column(JSONB, default=list)
    personality: Mapped[dict] = mapped_column(JSONB, default=dict)

    content_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    is_exported: Mapped[bool] = mapped_column(default=False)
