from __future__ import annotations

import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogListResponse, AuditLogResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


def _map_log_response(log: AuditLog) -> AuditLogResponse:
    return AuditLogResponse(
        id=log.id,
        user_id=log.user_id,
        user_name=log.user.full_name if log.user else None,
        action=log.action,
        entity_type=log.entity_type,
        entity_id=log.entity_id,
        old_data=log.old_data,
        new_data=log.new_data,
        ip_address=log.ip_address,
        created_at=log.created_at,
    )


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List system audit logs (Admin only)."""
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    return AuditLogListResponse(
        total=total,
        logs=[_map_log_response(l) for l in logs],
    )
