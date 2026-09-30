from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Bill(Base):
    __tablename__ = "bills"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    bill_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id"), nullable=False, index=True
    )
    appointment_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointments.id"), unique=True, nullable=True
    )
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    discount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    tax: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    total: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    paid_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    balance_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING"
    )  # PENDING / PARTIALLY_PAID / PAID / REFUNDED
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
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
    patient: Mapped["Patient"] = relationship("Patient", back_populates="bills")  # type: ignore[name-defined]
    appointment: Mapped["Appointment | None"] = relationship(  # type: ignore[name-defined]
        "Appointment", back_populates="bill"
    )
    items: Mapped[list["BillItem"]] = relationship(
        "BillItem", back_populates="bill", cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="bill")

    def __repr__(self) -> str:
        return f"<Bill id={self.id} bill_number={self.bill_number!r} status={self.status!r}>"


class BillItem(Base):
    __tablename__ = "bill_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    bill_id: Mapped[int] = mapped_column(
        ForeignKey("bills.id"), nullable=False, index=True
    )
    service_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    # relationships
    bill: Mapped["Bill"] = relationship("Bill", back_populates="items")
