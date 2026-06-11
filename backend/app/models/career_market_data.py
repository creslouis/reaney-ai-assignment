from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class CareerMarketData(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "career_market_data"

    major_name: Mapped[str] = mapped_column(String(120))
    career_name: Mapped[str] = mapped_column(String(120))
    avg_salary_usd_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    demand_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
