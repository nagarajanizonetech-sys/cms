from __future__ import annotations

import logging
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── Engine Configuration ───────────────────────────────────────────────────
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=settings.SQL_ECHO,
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=settings.SQL_ECHO,
    )

if not settings.SQL_ECHO:
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

# ─── Session factory ─────────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# ─── Declarative base ────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ─── Table creation ──────────────────────────────────────────────────────────
def create_all_tables() -> None:
    """Create all tables that don't exist yet (used at startup)."""
    try:
        import app.models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified / created.")
    except Exception as e:
        logger.error("Error creating database tables: %s", e)


# ─── Dependency ──────────────────────────────────────────────────────────────
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
