"""
Database Reset Utility
Drops all existing tables and re-creates them cleanly.
Run with: python -m app.reset_db
"""
from __future__ import annotations

import logging
from sqlalchemy import text
from app.core.database import engine, Base
import app.models  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reset_db")


def reset_database():
    logger.info("⚠️  Dropping all tables...")
    with engine.begin() as conn:
        # For Postgres, dropping schema public cascade cleanly clears all tables and alembic_version
        try:
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            logger.info("✅ Dropped and recreated public schema.")
        except Exception as e:
            logger.warning("Schema drop fallback: %s. Using Base.metadata.drop_all...", e)
            Base.metadata.drop_all(bind=conn)

    logger.info("✅ Database completely reset to clean state.")


if __name__ == "__main__":
    reset_database()
