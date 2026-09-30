from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    rx_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    consultation_id: Mapped[int] = mapped_column(
        ForeignKey("consultations.id"), nullable=False, index=True
    )
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id"), nullable=False, index=True
    )
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="CREATED"
    )  # CREATED / PRINTED / DISPENSED / CANCELLED
    general_advice: Mapped[str | None] = mapped_column(Text, nullable=True)
    diet_and_lifestyle: Mapped[str | None] = mapped_column(Text, nullable=True)
    follow_up_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    follow_up_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
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
    consultation: Mapped["Consultation"] = relationship(  # type: ignore[name-defined]
        "Consultation", back_populates="prescriptions"
    )
    patient: Mapped["Patient"] = relationship("Patient", back_populates="prescriptions")  # type: ignore[name-defined]
    doctor: Mapped["Doctor"] = relationship("Doctor")
    items: Mapped[list["PrescriptionItem"]] = relationship(
        "PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Prescription id={self.id} rx={self.rx_number!r} status={self.status!r}>"


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    prescription_id: Mapped[int] = mapped_column(
        ForeignKey("prescriptions.id"), nullable=False, index=True
    )
    medicine_name: Mapped[str] = mapped_column(String(300), nullable=False)
    strength: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dosage: Mapped[str | None] = mapped_column(String(100), nullable=True)
    frequency: Mapped[str | None] = mapped_column(String(100), nullable=True)
    duration: Mapped[str | None] = mapped_column(String(100), nullable=True)
    route: Mapped[str | None] = mapped_column(String(50), nullable=True)
    timing: Mapped[str | None] = mapped_column(String(100), nullable=True)
    quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)

    # relationships
    prescription: Mapped["Prescription"] = relationship("Prescription", back_populates="items")
