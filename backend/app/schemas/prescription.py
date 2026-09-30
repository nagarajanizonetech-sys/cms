from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class PrescriptionItemCreate(BaseModel):
    medicine_name: str
    strength: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    route: Optional[str] = None
    timing: Optional[str] = None
    quantity: Optional[int] = None
    instructions: Optional[str] = None


class PrescriptionItemResponse(BaseModel):
    id: int
    prescription_id: int
    medicine_name: str
    strength: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    route: Optional[str] = None
    timing: Optional[str] = None
    quantity: Optional[int] = None
    instructions: Optional[str] = None

    model_config = {"from_attributes": True}


class PrescriptionCreate(BaseModel):
    consultation_id: int
    patient_id: int
    doctor_id: int
    general_advice: Optional[str] = None
    diet_and_lifestyle: Optional[str] = None
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None
    items: List[PrescriptionItemCreate] = []


class PrescriptionUpdate(BaseModel):
    status: Optional[str] = None
    general_advice: Optional[str] = None
    diet_and_lifestyle: Optional[str] = None
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None
    items: Optional[List[PrescriptionItemCreate]] = None


class PrescriptionResponse(BaseModel):
    id: int
    rx_number: str
    consultation_id: int
    patient_id: int
    patient_name: Optional[str] = None
    patient_uhid: Optional[str] = None
    doctor_id: int
    doctor_name: Optional[str] = None
    status: str
    general_advice: Optional[str] = None
    diet_and_lifestyle: Optional[str] = None
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[PrescriptionItemResponse] = []

    model_config = {"from_attributes": True}


class PrescriptionListResponse(BaseModel):
    total: int
    prescriptions: List[PrescriptionResponse]
