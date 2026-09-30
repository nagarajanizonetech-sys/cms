from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    old_data: Optional[str] = None
    new_data: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    total: int
    logs: List[AuditLogResponse]
