from __future__ import annotations

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, record_audit
from app.models.patient import Patient
from app.models.user import User
from app.models.vital import Vital
from app.schemas.vital import VitalCreate, VitalResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vitals", tags=["Vitals"])


def _calculate_bmi(height_cm: Optional[float], weight_kg: Optional[float]) -> Optional[float]:
    if height_cm and weight_kg and height_cm > 0:
        height_m = height_cm / 100.0
        return round(weight_kg / (height_m * height_m), 1)
    return None


def _map_vital_response(v: Vital) -> VitalResponse:
    return VitalResponse(
        id=v.id,
        patient_id=v.patient_id,
        appointment_id=v.appointment_id,
        recorded_by=v.recorded_by,
        height=v.height,
        weight=v.weight,
        bmi=v.bmi,
        blood_pressure_systolic=v.blood_pressure_systolic,
        blood_pressure_diastolic=v.blood_pressure_diastolic,
        pulse=v.pulse,
        spo2=v.spo2,
        temperature=v.temperature,
        respiratory_rate=v.respiratory_rate,
        created_at=v.created_at,
    )


@router.get("/patient/{patient_id}", response_model=List[VitalResponse])
def get_patient_vitals(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get vital signs history for a specific patient."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    vitals = (
        db.query(Vital)
        .filter(Vital.patient_id == patient_id)
        .order_by(Vital.created_at.desc())
        .all()
    )
    return [_map_vital_response(v) for v in vitals]


@router.post("", response_model=VitalResponse, status_code=status.HTTP_201_CREATED)
def record_vitals(
    data: VitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record vital signs for a patient."""
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    bmi = data.bmi
    if bmi is None:
        bmi = _calculate_bmi(data.height, data.weight)

    vital = None
    if data.appointment_id:
        vital = db.query(Vital).filter(Vital.appointment_id == data.appointment_id).first()

    if vital:
        if data.height is not None: vital.height = data.height
        if data.weight is not None: vital.weight = data.weight
        if bmi is not None: vital.bmi = bmi
        if data.blood_pressure_systolic is not None: vital.blood_pressure_systolic = data.blood_pressure_systolic
        if data.blood_pressure_diastolic is not None: vital.blood_pressure_diastolic = data.blood_pressure_diastolic
        if data.pulse is not None: vital.pulse = data.pulse
        if data.spo2 is not None: vital.spo2 = data.spo2
        if data.temperature is not None: vital.temperature = data.temperature
        if data.respiratory_rate is not None: vital.respiratory_rate = data.respiratory_rate
    else:
        vital = Vital(
            patient_id=data.patient_id,
            appointment_id=data.appointment_id,
            recorded_by=current_user.id,
            height=data.height,
            weight=data.weight,
            bmi=bmi,
            blood_pressure_systolic=data.blood_pressure_systolic,
            blood_pressure_diastolic=data.blood_pressure_diastolic,
            pulse=data.pulse,
            spo2=data.spo2,
            temperature=data.temperature,
            respiratory_rate=data.respiratory_rate,
        )
        db.add(vital)
    db.commit()
    db.refresh(vital)

    record_audit(
        db,
        action="RECORD_VITALS",
        user_id=current_user.id,
        entity_type="Vital",
        entity_id=vital.id,
    )

    return _map_vital_response(vital)


@router.get("/{vital_id}", response_model=VitalResponse)
def get_vital(
    vital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single vital record by ID."""
    vital = db.query(Vital).filter(Vital.id == vital_id).first()
    if not vital:
        raise HTTPException(status_code=404, detail="Vital record not found")
    return _map_vital_response(vital)
