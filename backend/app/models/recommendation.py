from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class Recommendation(Base, UUIDMixin):
    __tablename__ = "recommendations"

    student_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"))
    ml_prediction_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ml_predictions.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    recommended_majors: Mapped[list] = mapped_column(JSONB)
    recommended_universities: Mapped[list] = mapped_column(JSONB)
    career_paths: Mapped[list] = mapped_column(JSONB)
    gemini_summary: Mapped[str] = mapped_column(Text)
