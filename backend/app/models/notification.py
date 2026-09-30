from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="INFO"
    )  # INFO / SUCCESS / WARNING / ERROR / APPOINTMENT / PAYMENT / QUEUE
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    link_route: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Notification id={self.id} title={self.title!r} read={self.is_read}>"
