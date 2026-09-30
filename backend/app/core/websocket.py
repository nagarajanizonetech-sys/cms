from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections and broadcasts real-time clinic updates."""

    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket client connected. Active connections: %d", len(self.active_connections))

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected. Active connections: %d", len(self.active_connections))

    async def broadcast(self, message: Dict[str, Any]) -> None:
        if not self.active_connections:
            return
        payload = json.dumps(message)
        dead_connections: List[WebSocket] = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.debug("Failed sending WebSocket message to client: %s", e)
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

    def broadcast_sync(self, message: Dict[str, Any]) -> None:
        """Thread-safe broadcast helper to invoke from synchronous FastAPI route handlers."""
        if not self.active_connections:
            return

        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.broadcast(message))
        except RuntimeError:
            if self._loop and self._loop.is_running():
                asyncio.run_coroutine_threadsafe(self.broadcast(message), self._loop)
            else:
                logger.debug("No event loop available for WebSocket broadcast")


ws_manager = ConnectionManager()


def notify_data_change(event: str, data: Optional[Dict[str, Any]] = None) -> None:
    """Broadcast an update event to all connected clients in real-time."""
    ws_manager.broadcast_sync({
        "event": event,
        "data": data or {},
    })
