from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Scholarship(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "scholarships"

    university_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("universities.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(150))
    provider: Mapped[str | None] = mapped_column(String(120), nullable=True)
    eligibility: Mapped[str | None] = mapped_column(Text, nullable=True)
    coverage: Mapped[str | None] = mapped_column(String(200), nullable=True)
    website: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
