from __future__ import annotations

from datetime import datetime, date

from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey,
    Integer, String, Text, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    uhid: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    gender: Mapped[str] = mapped_column(String(10), nullable=False)  # Male / Female / Other
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Emergency contact
    emergency_contact_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    emergency_contact_relationship: Mapped[str | None] = mapped_column(String(50), nullable=True)

    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    medical_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
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
    appointments: Mapped[list["Appointment"]] = relationship(  # type: ignore[name-defined]
        "Appointment", back_populates="patient"
    )
    vitals: Mapped[list["Vital"]] = relationship("Vital", back_populates="patient")  # type: ignore[name-defined]
    consultations: Mapped[list["Consultation"]] = relationship(  # type: ignore[name-defined]
        "Consultation", back_populates="patient"
    )
    bills: Mapped[list["Bill"]] = relationship("Bill", back_populates="patient")  # type: ignore[name-defined]
    prescriptions: Mapped[list["Prescription"]] = relationship(  # type: ignore[name-defined]
        "Prescription", back_populates="patient"
    )
    follow_ups: Mapped[list["FollowUp"]] = relationship(  # type: ignore[name-defined]
        "FollowUp", back_populates="patient"
    )

    @property
    def full_name(self) -> str:
        clean_last = self.last_name.strip() if self.last_name else ""
        if clean_last and clean_last != ".":
            return f"{self.first_name.strip()} {clean_last}".strip()
        return self.first_name.strip()

    def __repr__(self) -> str:
        return f"<Patient id={self.id} uhid={self.uhid!r} name={self.full_name!r}>"
