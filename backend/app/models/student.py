from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Student(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "students"

    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(150))
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    grade_level: Mapped[str] = mapped_column(String(20))
    province: Mapped[str | None] = mapped_column(String(100), nullable=True)
    budget_range: Mapped[str | None] = mapped_column(String(20), nullable=True)
    session_id: Mapped[str] = mapped_column(UUID(as_uuid=True))

    grades = relationship("Grade", back_populates="student", cascade="all, delete-orphan")
    interests = relationship("Interest", back_populates="student", cascade="all, delete-orphan")
    personality = relationship(
        "PersonalityScore", back_populates="student", uselist=False, cascade="all, delete-orphan"
    )
