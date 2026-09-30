from __future__ import annotations

import logging
from typing import Callable, List, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)

security_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db),
) -> User:
    """Validate JWT access token and return the authenticated User."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        raise credentials_exception

    token = credentials.credentials
    try:
        payload = decode_token(token)
        token_type = payload.get("type")
        if token_type != "access":
            raise credentials_exception
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Return User if valid token provided, otherwise None (for endpoints with dual behavior)."""
    if not credentials or not credentials.credentials:
        return None
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None


def require_roles(allowed_roles: List[str]) -> Callable[[User], User]:
    """Dependency factory that checks if current user's role is in the allowed list."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role.name if current_user.role else ""
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {allowed_roles}",
            )
        return current_user
    return role_checker


# Convenient role presets
require_admin = require_roles(["ADMIN"])
require_doctor = require_roles(["DOCTOR", "ADMIN"])
require_receptionist = require_roles(["RECEPTIONIST", "ADMIN"])
require_clinical = require_roles(["DOCTOR", "NURSE", "ADMIN"])
require_staff = require_roles(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "PHARMACIST"])


def record_audit(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    old_data: Optional[str] = None,
    new_data: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> None:
    """Helper to record audit log events."""
    try:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_data=old_data,
            new_data=new_data,
            ip_address=ip_address,
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.warning("Failed to record audit log: %s", e)
