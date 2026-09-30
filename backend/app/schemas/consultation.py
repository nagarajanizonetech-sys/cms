from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel


class SymptomCreate(BaseModel):
    name: str
    duration: Optional[str] = None
    severity: Optional[str] = None  # Mild / Moderate / Severe
    notes: Optional[str] = None


class SymptomResponse(BaseModel):
    id: int
    name: str
    duration: Optional[str]
    severity: Optional[str]
    notes: Optional[str]

    model_config = {"from_attributes": True}


class DiagnosisCreate(BaseModel):
    code: Optional[str] = None
    description: str
    diagnosis_type: str = "PRIMARY"  # PRIMARY / SECONDARY / PROVISIONAL
    notes: Optional[str] = None


class DiagnosisResponse(BaseModel):
    id: int
    code: Optional[str]
    description: str
    diagnosis_type: str
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


from app.schemas.vital import VitalResponse


class ConsultationVitalsInput(BaseModel):
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    blood_pressure_systolic: Optional[float] = None
    blood_pressure_diastolic: Optional[float] = None
    pulse: Optional[float] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    respiratory_rate: Optional[float] = None


class ConsultationCreate(BaseModel):
    patient_id: int
    appointment_id: int
    doctor_id: int
    chief_complaint: Optional[str] = None
    clinical_notes: Optional[str] = None
    examination_notes: Optional[str] = None
    treatment_advice: Optional[str] = None
    doctor_notes: Optional[str] = None
    symptoms: List[SymptomCreate] = []
    diagnoses: List[DiagnosisCreate] = []
    vitals: Optional[ConsultationVitalsInput] = None


class ConsultationUpdate(BaseModel):
    chief_complaint: Optional[str] = None
    clinical_notes: Optional[str] = None
    examination_notes: Optional[str] = None
    treatment_advice: Optional[str] = None
    doctor_notes: Optional[str] = None
    symptoms: Optional[List[SymptomCreate]] = None
    diagnoses: Optional[List[DiagnosisCreate]] = None
    vitals: Optional[ConsultationVitalsInput] = None


class ConsultationChargeResponse(BaseModel):
    id: int
    service_name: str
    amount: float
    original_amount: float
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class ConsultationResponse(BaseModel):
    id: int
    patient_id: int
    patient_name: Optional[str] = None
    patient_uhid: Optional[str] = None
    appointment_id: int
    doctor_id: int
    doctor_name: Optional[str] = None
    chief_complaint: Optional[str]
    clinical_notes: Optional[str]
    examination_notes: Optional[str]
    treatment_advice: Optional[str]
    doctor_notes: Optional[str]
    status: str
    vitals: Optional[VitalResponse] = None
    symptoms: List[SymptomResponse] = []
    diagnoses: List[DiagnosisResponse] = []
    charges: List[ConsultationChargeResponse] = []
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}
