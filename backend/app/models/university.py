from sqlalchemy import Boolean, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class University(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "universities"

    name: Mapped[str] = mapped_column(String(150), unique=True)
    location: Mapped[str] = mapped_column(String(100))
    type: Mapped[str] = mapped_column(String(20))
    website: Mapped[str | None] = mapped_column(String(200), nullable=True)
    tuition_usd_year: Mapped[float | None] = mapped_column(Float, nullable=True)
    scholarship_available: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    programs = relationship("UniversityProgram", back_populates="university", cascade="all, delete-orphan")
