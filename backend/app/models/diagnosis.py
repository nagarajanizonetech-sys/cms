from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    consultation_id: Mapped[int] = mapped_column(
        ForeignKey("consultations.id"), nullable=False, index=True
    )
    code: Mapped[str | None] = mapped_column(String(30), nullable=True)  # ICD-10 / custom
    description: Mapped[str] = mapped_column(Text, nullable=False)
    diagnosis_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PRIMARY"
    )  # PRIMARY / SECONDARY / PROVISIONAL
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # relationships
    consultation: Mapped["Consultation"] = relationship(  # type: ignore[name-defined]
        "Consultation", back_populates="diagnoses"
    )
