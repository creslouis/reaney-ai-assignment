from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class ExperienceSubmission(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "experience_submissions"

    contributor_type: Mapped[str] = mapped_column(String(30))
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(150))
    current_major: Mapped[str | None] = mapped_column(String(120), nullable=True)
    university: Mapped[str | None] = mapped_column(String(150), nullable=True)
    year_of_study: Mapped[int | None] = mapped_column(Integer, nullable=True)
    job_title: Mapped[str | None] = mapped_column(String(120), nullable=True)
    years_of_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)
    province: Mapped[str | None] = mapped_column(String(100), nullable=True)
    satisfaction_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    would_recommend: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    high_school_interests: Mapped[list] = mapped_column(JSONB, default=list)
    advice_text: Mapped[str] = mapped_column(Text)
    challenges_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    why_choose_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str] = mapped_column(String(30), default="web")
