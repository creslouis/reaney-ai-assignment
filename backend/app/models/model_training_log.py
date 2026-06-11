from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class ModelTrainingLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "model_training_log"

    model_type: Mapped[str] = mapped_column(String(50))
    accuracy: Mapped[float] = mapped_column(Float)
    precision_score: Mapped[float] = mapped_column(Float)
    recall_score: Mapped[float] = mapped_column(Float)
    f1_score: Mapped[float] = mapped_column(Float)
    training_samples: Mapped[int] = mapped_column(Integer)
    triggered_by: Mapped[str] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
