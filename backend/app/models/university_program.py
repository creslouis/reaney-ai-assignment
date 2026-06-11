from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class UniversityProgram(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "university_programs"

    university_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("universities.id", ondelete="CASCADE"))
    major_name: Mapped[str] = mapped_column(String(120))
    major_name_kh: Mapped[str | None] = mapped_column(String(120), nullable=True)
    faculty: Mapped[str | None] = mapped_column(String(120), nullable=True)
    duration_years: Mapped[str | None] = mapped_column(String(20), nullable=True)
    degree_level: Mapped[str] = mapped_column(String(50), default="Bachelor")
    language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    program_url: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    university = relationship("University", back_populates="programs")
