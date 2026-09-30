from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: date
    appointment_time: str  # HH:MM (24h)
    appointment_type: str = "CONSULTATION"
    reason: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("appointment_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        allowed = {"CONSULTATION", "FOLLOW_UP", "REVIEW", "WALK_IN"}
        if v.upper() not in allowed:
            raise ValueError(f"appointment_type must be one of {allowed}")
        return v.upper()


class AppointmentUpdate(BaseModel):
    appointment_date: Optional[date] = None
    appointment_time: Optional[str] = None
    appointment_type: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    patient_name: Optional[str] = None
    patient_uhid: Optional[str] = None
    patient_phone: Optional[str] = None
    doctor_id: int
    doctor_name: Optional[str] = None
    appointment_date: date
    appointment_time: str
    appointment_type: str
    status: str
    token_number: Optional[str]
    reason: Optional[str]
    notes: Optional[str]
    checked_in_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AppointmentListResponse(BaseModel):
    total: int
    appointments: list[AppointmentResponse]
