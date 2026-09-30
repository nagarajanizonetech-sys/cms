from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel


class DoctorCreate(BaseModel):
    user_id: int
    doctor_code: str
    specialization: str
    department: Optional[str] = None
    room: Optional[str] = None
    consultation_fee: float = 0.0
    schedule_days: Optional[str] = None
    schedule_start: Optional[str] = "09:00"
    schedule_end: Optional[str] = "17:00"
    slot_duration_mins: int = 15
    status: str = "Available"
    is_active: bool = True


class DoctorUpdate(BaseModel):
    specialization: Optional[str] = None
    department: Optional[str] = None
    room: Optional[str] = None
    consultation_fee: Optional[float] = None
    schedule_days: Optional[str] = None
    schedule_start: Optional[str] = None
    schedule_end: Optional[str] = None
    slot_duration_mins: Optional[int] = None
    status: Optional[str] = None


class DoctorStatusUpdate(BaseModel):
    status: str  # Available / In Consultation / Not Available / On Leave


class DoctorResponse(BaseModel):
    id: int
    doctor_code: str
    specialization: str
    department: Optional[str] = None
    room: Optional[str] = None
    consultation_fee: float
    schedule_days: Optional[str] = None
    schedule_start: Optional[str] = None
    schedule_end: Optional[str] = None
    slot_duration_mins: int
    status: str
    is_active: bool
    full_name: str
    email: str
    phone: Optional[str] = None
    user_id: int

    model_config = {"from_attributes": True}


class DoctorListResponse(BaseModel):
    total: int
    doctors: List[DoctorResponse]
