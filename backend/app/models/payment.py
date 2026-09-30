from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    bill_id: Mapped[int] = mapped_column(
        ForeignKey("bills.id"), nullable=False, index=True
    )
    receipt_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # CASH / UPI / CARD / OTHER
    transaction_reference: Mapped[str | None] = mapped_column(String(200), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    payment_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # relationships
    bill: Mapped["Bill"] = relationship("Bill", back_populates="payments")

    def __repr__(self) -> str:
        return f"<Payment id={self.id} amount={self.amount} method={self.payment_method!r}>"
