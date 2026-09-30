from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id"), nullable=False, index=True
    )
    consultation_id: Mapped[int | None] = mapped_column(
        ForeignKey("consultations.id"), nullable=True
    )
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id"), nullable=False
    )
    follow_up_date: Mapped[str] = mapped_column(String(20), nullable=False)  # YYYY-MM-DD
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="SCHEDULED"
    )  # SCHEDULED / COMPLETED / OVERDUE / CANCELLED
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="follow_ups")  # type: ignore[name-defined]
    consultation: Mapped["Consultation | None"] = relationship(  # type: ignore[name-defined]
        "Consultation", back_populates="follow_ups"
    )
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="follow_ups")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<FollowUp id={self.id} date={self.follow_up_date!r} status={self.status!r}>"
