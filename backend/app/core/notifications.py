from __future__ import annotations

import logging
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.websocket import notify_data_change
from app.models.notification import Notification
from app.models.role import Role
from app.models.user import User

logger = logging.getLogger(__name__)


def get_staff_user_ids(db: Session) -> List[int]:
    """Retrieve all user IDs that are staff, reception, or admin."""
    try:
        users = (
            db.query(User.id)
            .join(Role, User.role_id == Role.id)
            .filter(Role.name.in_(["RECEPTIONIST", "ADMIN", "STAFF"]))
            .all()
        )
        return [u[0] for u in users]
    except Exception as e:
        logger.warning("Error fetching staff user IDs: %s", e)
        return []


def create_system_notifications(
    db: Session,
    user_ids: List[int],
    title: str,
    message: str,
    notif_type: str = "INFO",
    link_route: Optional[str] = None,
) -> None:
    """Create notification rows for a list of target user IDs and broadcast realtime update."""
    created_any = False
    valid_uids = set(user_ids)
    for uid in valid_uids:
        if not uid:
            continue
        try:
            user_exists = db.query(User.id).filter(User.id == uid).first()
            if user_exists:
                n = Notification(
                    user_id=uid,
                    title=title,
                    message=message,
                    type=notif_type,
                    link_route=link_route,
                    is_read=False,
                )
                db.add(n)
                created_any = True
        except Exception as e:
            logger.warning("Error adding notification for user %s: %s", uid, e)

    if created_any:
        try:
            db.commit()
            notify_data_change("notification_updated")
        except Exception as e:
            logger.warning("Error committing system notifications: %s", e)
            db.rollback()
