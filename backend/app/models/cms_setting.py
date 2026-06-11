from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class CMSSetting(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "cms_settings"

    category: Mapped[str] = mapped_column(String(50))
    key: Mapped[str] = mapped_column(String(100), unique=True)
    label: Mapped[str] = mapped_column(String(150))
    value: Mapped[dict] = mapped_column(JSONB, default=dict)
    value_type: Mapped[str] = mapped_column(String(30), default="json")
    is_public: Mapped[bool] = mapped_column(default=True)
