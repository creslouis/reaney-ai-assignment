from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class LegalDocument(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "legal_documents"

    slug: Mapped[str] = mapped_column(String(50), unique=True)
    title: Mapped[str] = mapped_column(String(150))
    content_markdown: Mapped[str] = mapped_column(Text)
    version: Mapped[str] = mapped_column(String(30), default="1.0")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
