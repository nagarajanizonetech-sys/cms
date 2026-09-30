from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    appointment_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointments.id"), nullable=True
    )
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id"), nullable=False, index=True
    )
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id"), nullable=False, index=True
    )
    queue_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    token_number: Mapped[str] = mapped_column(String(20), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="NORMAL", nullable=False)
    # NORMAL / URGENT / EMERGENCY
    status: Mapped[str] = mapped_column(
        String(20), default="WAITING", nullable=False, index=True
    )
    # WAITING / ENGAGED / COMPLETED / NO_SHOW
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    called_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    engaged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

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
    appointment: Mapped["Appointment | None"] = relationship(  # type: ignore[name-defined]
        "Appointment", back_populates="queue_entry"
    )
    patient: Mapped["Patient"] = relationship("Patient")  # type: ignore[name-defined]
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="queue_entries")  # type: ignore[name-defined]

    # Aliases for frontend / schema compatibility
    @property
    def check_in_time(self) -> datetime | None:
        return self.checked_in_at

    @property
    def called_time(self) -> datetime | None:
        return self.called_at

    @property
    def consultation_start_time(self) -> datetime | None:
        return self.engaged_at

    @property
    def consultation_end_time(self) -> datetime | None:
        return self.completed_at

    def __repr__(self) -> str:
        return f"<QueueEntry id={self.id} token={self.token_number!r} status={self.status!r}>"
