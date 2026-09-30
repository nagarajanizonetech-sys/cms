from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class FollowUpCreate(BaseModel):
    patient_id: int
    doctor_id: int
    consultation_id: Optional[int] = None
    follow_up_date: str  # YYYY-MM-DD
    notes: Optional[str] = None


class FollowUpUpdate(BaseModel):
    follow_up_date: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None  # SCHEDULED / COMPLETED / OVERDUE / CANCELLED


class FollowUpResponse(BaseModel):
    id: int
    patient_id: int
    patient_name: Optional[str] = None
    patient_uhid: Optional[str] = None
    patient_phone: Optional[str] = None
    doctor_id: int
    doctor_name: Optional[str] = None
    consultation_id: Optional[int] = None
    follow_up_date: str
    notes: Optional[str] = None
    status: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FollowUpListResponse(BaseModel):
    total: int
    follow_ups: List[FollowUpResponse]
