from __future__ import annotations

from datetime import datetime, date

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id"), nullable=False, index=True
    )
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id"), nullable=False, index=True
    )
    appointment_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    appointment_time: Mapped[str] = mapped_column(String(10), nullable=False)  # HH:MM
    appointment_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="CONSULTATION"
    )
    # CONSULTATION / FOLLOW_UP / REVIEW / WALK_IN
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="SCHEDULED"
    )
    # SCHEDULED / CHECKED_IN / WAITING / IN_CONSULTATION / COMPLETED / CANCELLED / NO_SHOW
    token_number: Mapped[str | None] = mapped_column(String(15), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
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
    patient: Mapped["Patient"] = relationship("Patient", back_populates="appointments")  # type: ignore[name-defined]
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="appointments")  # type: ignore[name-defined]
    queue_entry: Mapped["QueueEntry | None"] = relationship(  # type: ignore[name-defined]
        "QueueEntry", back_populates="appointment", uselist=False
    )
    consultation: Mapped["Consultation | None"] = relationship(  # type: ignore[name-defined]
        "Consultation", back_populates="appointment", uselist=False
    )
    vitals: Mapped[list["Vital"]] = relationship("Vital", back_populates="appointment")  # type: ignore[name-defined]
    bill: Mapped["Bill | None"] = relationship(  # type: ignore[name-defined]
        "Bill", back_populates="appointment", uselist=False
    )

    def __repr__(self) -> str:
        return f"<Appointment id={self.id} status={self.status!r}>"
