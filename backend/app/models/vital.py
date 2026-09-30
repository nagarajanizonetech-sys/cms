from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Vital(Base):
    __tablename__ = "vitals"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id"), nullable=False, index=True
    )
    appointment_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointments.id"), nullable=True
    )
    recorded_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    height: Mapped[float | None] = mapped_column(Float, nullable=True, comment="cm")
    weight: Mapped[float | None] = mapped_column(Float, nullable=True, comment="kg")
    bmi: Mapped[float | None] = mapped_column(Float, nullable=True)
    blood_pressure_systolic: Mapped[float | None] = mapped_column(Float, nullable=True, comment="mmHg")
    blood_pressure_diastolic: Mapped[float | None] = mapped_column(Float, nullable=True, comment="mmHg")
    pulse: Mapped[float | None] = mapped_column(Float, nullable=True, comment="bpm")
    spo2: Mapped[float | None] = mapped_column(Float, nullable=True, comment="%")
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True, comment="°C")
    respiratory_rate: Mapped[float | None] = mapped_column(Float, nullable=True, comment="breaths/min")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="vitals")  # type: ignore[name-defined]
    appointment: Mapped["Appointment | None"] = relationship(  # type: ignore[name-defined]
        "Appointment", back_populates="vitals"
    )

    def __repr__(self) -> str:
        return f"<Vital id={self.id} patient_id={self.patient_id}>"
