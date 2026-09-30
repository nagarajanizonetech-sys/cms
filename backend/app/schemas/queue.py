from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CheckInRequest(BaseModel):
    appointment_id: int
    priority: str = "NORMAL"
    fee: Optional[float] = None


class QueueEntryCreate(BaseModel):
    appointment_id: Optional[int] = None
    patient_id: int
    doctor_id: int
    priority: str = "NORMAL"  # NORMAL / URGENT / EMERGENCY
    notes: Optional[str] = None


class QueueStatusUpdate(BaseModel):
    status: str  # WAITING / ENGAGED / COMPLETED / NO_SHOW


class QueuePriorityUpdate(BaseModel):
    priority: str  # NORMAL / URGENT / EMERGENCY


class QueueActionRequest(BaseModel):
    action: str  # call / start / complete / skip / recall


class QueueEntryResponse(BaseModel):
    id: int
    appointment_id: Optional[int] = None
    patient_id: int
    patient_name: Optional[str] = None
    patient_uhid: Optional[str] = None
    doctor_id: int
    doctor_name: Optional[str] = None
    token_number: str
    priority: str
    status: str
    check_in_time: Optional[datetime] = None
    called_time: Optional[datetime] = None
    consultation_start_time: Optional[datetime] = None
    consultation_end_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    appointment_type: Optional[str] = None
    reason: Optional[str] = None

    model_config = {"from_attributes": True}


class QueueListResponse(BaseModel):
    total: int
    entries: List[QueueEntryResponse]
