from __future__ import annotations

import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.websocket import notify_data_change
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import (
    NotificationCreate,
    NotificationListResponse,
    NotificationResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _map_notification_response(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=n.id,
        user_id=n.user_id,
        title=n.title,
        message=n.message,
        type=n.type,
        is_read=n.is_read,
        link_route=n.link_route,
        created_at=n.created_at,
    )


@router.get("", response_model=NotificationListResponse)
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all notifications for the authenticated user."""
    items = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(100)
        .all()
    )

    if not items:
        # Provide welcoming operational notifications for staff if empty
        is_doc = current_user.role and current_user.role.name == "DOCTOR"
        welcome_notifs = [
            Notification(
                user_id=current_user.id,
                title="Clinical Workstation Online",
                message="Connected to clinic real-time network. Queue and appointments synchronized.",
                type="INFO",
                link_route="/doctor/appointments" if is_doc else "/reception/queue",
                is_read=False,
            ),
            Notification(
                user_id=current_user.id,
                title="Live Queue Ready",
                message="Patient tokens and consultation states will notify automatically.",
                type="QUEUE",
                link_route="/doctor/appointments" if is_doc else "/reception/queue",
                is_read=False,
            ),
        ]
        for wn in welcome_notifs:
            db.add(wn)
        try:
            db.commit()
            for wn in welcome_notifs:
                db.refresh(wn)
            items = welcome_notifs
        except Exception:
            db.rollback()
            items = []

    unread_count = sum(1 for n in items if not n.is_read)

    return NotificationListResponse(
        total=len(items),
        unread_count=unread_count,
        notifications=[_map_notification_response(n) for n in items],
    )


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read."""
    n = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")

    n.is_read = True
    db.commit()
    db.refresh(n)
    notify_data_change("notification_updated", {"id": n.id, "user_id": n.user_id})
    return _map_notification_response(n)


@router.put("/read-all", status_code=status.HTTP_200_OK)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications as read for current user."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,  # noqa: E712
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    notify_data_change("notification_updated", {"user_id": current_user.id})
    return {"message": "All notifications marked as read"}


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a notification for a user."""
    target_user_id = data.user_id if data.user_id is not None else current_user.id
    notif = Notification(
        user_id=target_user_id,
        title=data.title,
        message=data.message,
        type=data.type,
        link_route=data.link_route,
        is_read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    notify_data_change("notification_updated", {"id": notif.id, "user_id": notif.user_id})
    return _map_notification_response(notif)
