from sqlalchemy import Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class PersonalityScore(Base, UUIDMixin):
    __tablename__ = "personality_scores"

    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), unique=True
    )
    analytical_score: Mapped[float] = mapped_column(Float, default=3.0)
    creative_score: Mapped[float] = mapped_column(Float, default=3.0)
    people_oriented_score: Mapped[float] = mapped_column(Float, default=3.0)
    detail_oriented_score: Mapped[float] = mapped_column(Float, default=3.0)

    student = relationship("Student", back_populates="personality")
