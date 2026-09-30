from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
    doctor_id: Optional[int] = None


class RefreshRequest(BaseModel):
    refresh_token: str


class MeResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    doctor_id: Optional[int] = None

    model_config = {"from_attributes": True}
