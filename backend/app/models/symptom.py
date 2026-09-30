from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Symptom(Base):
    __tablename__ = "symptoms"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    consultation_id: Mapped[int] = mapped_column(
        ForeignKey("consultations.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    duration: Mapped[str | None] = mapped_column(String(100), nullable=True)
    severity: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Mild / Moderate / Severe
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # relationships
    consultation: Mapped["Consultation"] = relationship("Consultation", back_populates="symptoms")  # type: ignore[name-defined]
