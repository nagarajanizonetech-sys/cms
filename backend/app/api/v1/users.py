from __future__ import annotations

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, record_audit
from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User
from app.schemas.user import (
    RoleResponse,
    UserCreate,
    UserListResponse,
    UserResponse,
    UserUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])


def _map_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role_id=user.role_id,
        role_name=user.role.name if user.role else None,
        is_active=user.is_active,
        doctor_id=user.doctor_profile.id if user.doctor_profile else None,
        last_login=user.last_login,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.get("/roles/list", response_model=List[RoleResponse])
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all available system roles."""
    roles = db.query(Role).all()
    return roles


@router.get("", response_model=UserListResponse)
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List users with optional search, role filter, and status filter."""
    query = db.query(User)

    if role:
        query = query.join(Role).filter(Role.name == role.upper())
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((User.full_name.ilike(s)) | (User.email.ilike(s)) | (User.username.ilike(s)))

    total = query.count()
    users = query.order_by(User.id.asc()).offset(skip).limit(limit).all()

    return UserListResponse(
        total=total,
        users=[_map_user_response(u) for u in users],
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create a new user account (Admin only)."""
    # Check if username or email exists
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    role = db.query(Role).filter(Role.id == data.role_id).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role_id specified")

    new_user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role_id=data.role_id,
        is_active=data.is_active,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    record_audit(db, action="CREATE_USER", user_id=current_user.id, entity_type="User", entity_id=new_user.id)
    return _map_user_response(new_user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _map_user_response(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update user attributes (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.username and data.username != user.username:
        if db.query(User).filter(User.username == data.username, User.id != user_id).first():
            raise HTTPException(status_code=400, detail="Username already in use")
        user.username = data.username

    if data.email and data.email != user.email:
        if db.query(User).filter(User.email == data.email, User.id != user_id).first():
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = data.email

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.role_id is not None:
        role = db.query(Role).filter(Role.id == data.role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role_id")
        user.role_id = data.role_id
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.password:
        user.password_hash = hash_password(data.password)

    db.commit()
    db.refresh(user)

    record_audit(db, action="UPDATE_USER", user_id=current_user.id, entity_type="User", entity_id=user.id)
    return _map_user_response(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Deactivate user account (soft delete)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    user.is_active = False
    db.commit()
    record_audit(db, action="DEACTIVATE_USER", user_id=current_user.id, entity_type="User", entity_id=user.id)
