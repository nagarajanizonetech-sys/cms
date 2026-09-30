from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="role")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Role id={self.id} name={self.name!r}>"
