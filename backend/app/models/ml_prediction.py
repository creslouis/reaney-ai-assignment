from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class MLPrediction(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ml_predictions"

    student_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"))
    top_major: Mapped[str] = mapped_column(String(100))
    top_confidence: Mapped[float] = mapped_column(Float)
    all_predictions: Mapped[list] = mapped_column(JSONB)
    model_used: Mapped[str] = mapped_column(String(20))
    model_accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    training_samples: Mapped[int] = mapped_column(Integer, default=0)
    raw_features: Mapped[dict] = mapped_column(JSONB)
