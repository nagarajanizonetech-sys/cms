from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: Optional[int] = None
    title: str
    message: str
    type: str = "INFO"  # INFO / SUCCESS / WARNING / ERROR / APPOINTMENT / PAYMENT / QUEUE
    link_route: Optional[str] = None


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    link_route: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    total: int
    unread_count: int
    notifications: List[NotificationResponse]
