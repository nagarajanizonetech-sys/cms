from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False
    )
    doctor_code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    specialization: Mapped[str] = mapped_column(String(200), nullable=False)
    department: Mapped[str | None] = mapped_column(String(200), nullable=True)
    room: Mapped[str | None] = mapped_column(String(100), nullable=True)
    consultation_fee: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    schedule_days: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="JSON array of working days"
    )
    schedule_start: Mapped[str | None] = mapped_column(String(10), nullable=True)
    schedule_end: Mapped[str | None] = mapped_column(String(10), nullable=True)
    slot_duration_mins: Mapped[int] = mapped_column(default=15)
    status: Mapped[str] = mapped_column(
        String(30), default="Available", nullable=False
    )  # Available / In Consultation / Not Available / On Leave
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
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
    user: Mapped["User"] = relationship("User", back_populates="doctor_profile")  # type: ignore[name-defined]
    appointments: Mapped[list["Appointment"]] = relationship(  # type: ignore[name-defined]
        "Appointment", back_populates="doctor"
    )
    queue_entries: Mapped[list["QueueEntry"]] = relationship(  # type: ignore[name-defined]
        "QueueEntry", back_populates="doctor"
    )
    consultations: Mapped[list["Consultation"]] = relationship(  # type: ignore[name-defined]
        "Consultation", back_populates="doctor"
    )
    follow_ups: Mapped[list["FollowUp"]] = relationship(  # type: ignore[name-defined]
        "FollowUp", back_populates="doctor"
    )

    def __repr__(self) -> str:
        return f"<Doctor id={self.id} code={self.doctor_code!r}>"
