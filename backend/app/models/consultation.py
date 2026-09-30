from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Consultation(Base):
    __tablename__ = "consultations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id"), nullable=False, index=True
    )
    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id"), unique=True, nullable=False
    )
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id"), nullable=False, index=True
    )
    chief_complaint: Mapped[str | None] = mapped_column(Text, nullable=True)
    clinical_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    examination_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    treatment_advice: Mapped[str | None] = mapped_column(Text, nullable=True)
    doctor_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), default="IN_PROGRESS", nullable=False
    )  # IN_PROGRESS / COMPLETED
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="consultations")  # type: ignore[name-defined]
    appointment: Mapped["Appointment"] = relationship(  # type: ignore[name-defined]
        "Appointment", back_populates="consultation"
    )
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="consultations")  # type: ignore[name-defined]
    symptoms: Mapped[list["Symptom"]] = relationship(  # type: ignore[name-defined]
        "Symptom", back_populates="consultation", cascade="all, delete-orphan"
    )
    diagnoses: Mapped[list["Diagnosis"]] = relationship(  # type: ignore[name-defined]
        "Diagnosis", back_populates="consultation", cascade="all, delete-orphan"
    )
    prescriptions: Mapped[list["Prescription"]] = relationship(  # type: ignore[name-defined]
        "Prescription", back_populates="consultation"
    )
    follow_ups: Mapped[list["FollowUp"]] = relationship(  # type: ignore[name-defined]
        "FollowUp", back_populates="consultation"
    )

    def __repr__(self) -> str:
        return f"<Consultation id={self.id} status={self.status!r}>"
