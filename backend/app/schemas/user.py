from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role_id: int
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role_id: int
    role_name: Optional[str] = None
    is_active: bool
    doctor_id: Optional[int] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    total: int
    users: List[UserResponse]
