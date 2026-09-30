from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class EmergencyContactSchema(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    relationship: Optional[str] = None


class PatientCreate(BaseModel):
    first_name: str
    last_name: str = ""
    gender: str  # Male / Female / Other
    date_of_birth: date
    phone: str
    email: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def phone_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Phone number is required")
        return v

    @field_validator("gender")
    @classmethod
    def gender_valid(cls, v: str) -> str:
        allowed = {"Male", "Female", "Other"}
        if v not in allowed:
            raise ValueError(f"gender must be one of {allowed}")
        return v


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None


class PatientResponse(BaseModel):
    id: int
    uhid: str
    first_name: str
    last_name: str = ""
    full_name: str
    gender: str
    date_of_birth: date
    phone: str
    email: Optional[str]
    blood_group: Optional[str]
    address: Optional[str]
    city: Optional[str]
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    emergency_contact_relationship: Optional[str]
    allergies: Optional[str]
    medical_conditions: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PatientListResponse(BaseModel):
    total: int
    patients: list[PatientResponse]
