from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class Interest(Base, UUIDMixin):
    __tablename__ = "interests"

    student_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"))
    interest: Mapped[str] = mapped_column(String(50))

    student = relationship("Student", back_populates="interests")
