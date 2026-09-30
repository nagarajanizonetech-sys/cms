from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, field_validator


class VitalCreate(BaseModel):
    patient_id: int
    appointment_id: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    blood_pressure_systolic: Optional[float] = None
    blood_pressure_diastolic: Optional[float] = None
    pulse: Optional[float] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    respiratory_rate: Optional[float] = None

    @field_validator("spo2")
    @classmethod
    def validate_spo2(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("SpO2 must be between 0 and 100")
        return v

    @field_validator("pulse")
    @classmethod
    def validate_pulse(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (0 < v < 300):
            raise ValueError("Pulse must be between 0 and 300 bpm")
        return v


class VitalUpdate(BaseModel):
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    blood_pressure_systolic: Optional[float] = None
    blood_pressure_diastolic: Optional[float] = None
    pulse: Optional[float] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    respiratory_rate: Optional[float] = None


class VitalResponse(BaseModel):
    id: int
    patient_id: int
    appointment_id: Optional[int] = None
    recorded_by: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    blood_pressure_systolic: Optional[float] = None
    blood_pressure_diastolic: Optional[float] = None
    pulse: Optional[float] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    respiratory_rate: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class VitalListResponse(BaseModel):
    total: int
    vitals: List[VitalResponse]
