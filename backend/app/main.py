"""
AuraCMS Backend - Clinical Management System
FastAPI + PostgreSQL + SQLAlchemy 2.x
"""
from __future__ import annotations

import asyncio
import json
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_all_tables
from app.core.websocket import ws_manager
from app.api.v1 import router as api_v1_router

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
if not getattr(settings, "SQL_ECHO", False):
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


# ─── Lifespan ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    ws_manager.set_loop(asyncio.get_running_loop())
    logger.info("🚀  AuraCMS backend starting up …")
    logger.info("📦  Environment : %s", settings.ENVIRONMENT)
    create_all_tables()
    logger.info("✅  Database tables ready.")
    try:
        from app.core.database import SessionLocal
        from app.models.patient import Patient
        with SessionLocal() as db:
            updated_count = db.query(Patient).filter(Patient.last_name == ".").update({Patient.last_name: ""})
            if updated_count:
                db.commit()
                logger.info("Cleaned %d patient record(s) with '.' as last_name.", updated_count)
    except Exception as e:
        logger.warning("Startup patient cleanup notice: %s", e)
    yield
    logger.info("🛑  AuraCMS backend shutting down.")


# ─── Application ─────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "Production-ready Clinical Management System API. "
        "Provides REST endpoints for patients, doctors, appointments, "
        "queue, consultations, prescriptions, billing and more."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────────────────────────
app.include_router(api_v1_router, prefix="/api/v1")


# ─── Realtime WebSocket ───────────────────────────────────────────────────────
@app.websocket("/ws")
@app.websocket("/api/v1/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        await websocket.send_json({
            "event": "connected",
            "message": "AuraCMS Realtime WebSocket Active",
        })
        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
                if data.get("type") == "ping":
                    await websocket.send_json({"event": "pong"})
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.debug("WebSocket exception: %s", e)
        ws_manager.disconnect(websocket)


# ─── Health ──────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Basic health check endpoint."""
    return {"status": "ok", "service": settings.APP_NAME}


@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": "AuraCMS Clinical Management System API",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "websocket": "/ws",
    }
