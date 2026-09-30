from __future__ import annotations

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, record_audit
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginRequest, MeResponse, RefreshRequest, TokenResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(request_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email/password and return JWT tokens and user info."""
    user = (
        db.query(User)
        .filter(User.email.ilike(request_data.email.strip()))
        .first()
    )

    if not user or not verify_password(request_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact your administrator.",
        )

    # Update last login timestamp
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    role_name = user.role.name if user.role else "USER"
    doctor_id = user.doctor_profile.id if user.doctor_profile else None

    token_extra = {
        "role": role_name,
        "email": user.email,
        "full_name": user.full_name,
        "doctor_id": doctor_id,
    }

    access_token = create_access_token(subject=str(user.id), extra_data=token_extra)
    refresh_token = create_refresh_token(subject=str(user.id))

    record_audit(db, action="USER_LOGIN", user_id=user.id, entity_type="User", entity_id=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        role=role_name,
        user_id=user.id,
        full_name=user.full_name,
        doctor_id=doctor_id,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token_endpoint(request_data: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh an access token using a valid refresh token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(request_data.refresh_token)
        if payload.get("type") != "refresh":
            raise credentials_exception
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise credentials_exception
        user_id = int(user_id_str)
    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise credentials_exception

    role_name = user.role.name if user.role else "USER"
    doctor_id = user.doctor_profile.id if user.doctor_profile else None

    token_extra = {
        "role": role_name,
        "email": user.email,
        "full_name": user.full_name,
        "doctor_id": doctor_id,
    }

    new_access_token = create_access_token(subject=str(user.id), extra_data=token_extra)
    new_refresh_token = create_refresh_token(subject=str(user.id))

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        role=role_name,
        user_id=user.id,
        full_name=user.full_name,
        doctor_id=doctor_id,
    )


@router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return MeResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role.name if current_user.role else "USER",
        is_active=current_user.is_active,
        doctor_id=current_user.doctor_profile.id if current_user.doctor_profile else None,
    )
