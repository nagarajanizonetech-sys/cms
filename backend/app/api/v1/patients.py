from __future__ import annotations

import logging
import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, record_audit
from app.core.websocket import notify_data_change
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import (
    PatientCreate,
    PatientListResponse,
    PatientResponse,
    PatientUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/patients", tags=["Patients"])


def _generate_uhid(db: Session) -> str:
    """Generate a unique hospital ID e.g. UHID-2026-00123"""
    year = datetime.now().year
    count = db.query(Patient).count() + 1
    random_suffix = random.randint(10, 99)
    uhid = f"UHID-{year}-{count:04d}{random_suffix}"
    # Ensure uniqueness
    while db.query(Patient).filter(Patient.uhid == uhid).first():
        random_suffix = random.randint(100, 999)
        uhid = f"UHID-{year}-{count:04d}{random_suffix}"
    return uhid


def _map_patient_response(p: Patient) -> PatientResponse:
    clean_last = p.last_name.strip() if p.last_name and p.last_name.strip() != "." else ""
    return PatientResponse(
        id=p.id,
        uhid=p.uhid,
        first_name=p.first_name,
        last_name=clean_last,
        full_name=p.full_name,
        gender=p.gender,
        date_of_birth=p.date_of_birth,
        phone=p.phone,
        email=p.email,
        blood_group=p.blood_group,
        address=p.address,
        city=p.city,
        emergency_contact_name=p.emergency_contact_name,
        emergency_contact_phone=p.emergency_contact_phone,
        emergency_contact_relationship=p.emergency_contact_relationship,
        allergies=p.allergies,
        medical_conditions=p.medical_conditions,
        is_active=p.is_active,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.get("", response_model=PatientListResponse)
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List patients with search by name, phone, or UHID."""
    query = db.query(Patient)

    if is_active is not None:
        query = query.filter(Patient.is_active == is_active)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Patient.first_name.ilike(s),
                Patient.last_name.ilike(s),
                Patient.phone.ilike(s),
                Patient.uhid.ilike(s),
                Patient.email.ilike(s),
            )
        )

    total = query.count()
    patients = query.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()

    return PatientListResponse(
        total=total,
        patients=[_map_patient_response(p) for p in patients],
    )


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a new patient and automatically generate UHID."""
    uhid = _generate_uhid(db)

    clean_last = data.last_name.strip() if data.last_name and data.last_name.strip() != "." else ""
    new_patient = Patient(
        uhid=uhid,
        first_name=data.first_name.strip(),
        last_name=clean_last,
        gender=data.gender,
        date_of_birth=data.date_of_birth,
        phone=data.phone.strip(),
        email=data.email.strip() if data.email else None,
        blood_group=data.blood_group,
        address=data.address,
        city=data.city,
        emergency_contact_name=data.emergency_contact_name,
        emergency_contact_phone=data.emergency_contact_phone,
        emergency_contact_relationship=data.emergency_contact_relationship,
        allergies=data.allergies,
        medical_conditions=data.medical_conditions,
        created_by=current_user.id,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    record_audit(
        db,
        action="CREATE_PATIENT",
        user_id=current_user.id,
        entity_type="Patient",
        entity_id=new_patient.id,
    )

    notify_data_change("patient_updated", {"id": new_patient.id, "action": "created"})
    return _map_patient_response(new_patient)


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single patient details by ID."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _map_patient_response(patient)


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update patient information."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_dict = data.model_dump(exclude_unset=True)
    if "last_name" in update_dict and update_dict["last_name"] is not None:
        if update_dict["last_name"].strip() == ".":
            update_dict["last_name"] = ""
    for field, value in update_dict.items():
        if value is not None and hasattr(patient, field):
            setattr(patient, field, value)

    patient.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(patient)

    record_audit(
        db,
        action="UPDATE_PATIENT",
        user_id=current_user.id,
        entity_type="Patient",
        entity_id=patient.id,
    )

    notify_data_change("patient_updated", {"id": patient.id, "action": "updated"})
    return _map_patient_response(patient)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete patient by setting is_active to False."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.is_active = False
    db.commit()
    notify_data_change("patient_updated", {"id": patient.id, "action": "deleted"})

    record_audit(
        db,
        action="DEACTIVATE_PATIENT",
        user_id=current_user.id,
        entity_type="Patient",
        entity_id=patient.id,
    )


@router.get("/{patient_id}/history")
def get_patient_history(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch complete medical history of a patient (consultations, vitals, prescriptions, bills)."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    consultations = [
        {
            "id": c.id,
            "appointment_id": c.appointment_id,
            "doctor_name": c.doctor.user.full_name if c.doctor and c.doctor.user else "Unknown Doctor",
            "chief_complaint": c.chief_complaint,
            "clinical_notes": c.clinical_notes,
            "treatment_advice": c.treatment_advice,
            "status": c.status,
            "created_at": c.created_at,
            "symptoms": [{"name": s.name, "severity": s.severity, "duration": s.duration} for s in c.symptoms],
            "diagnoses": [{"code": d.code, "description": d.description, "type": d.diagnosis_type} for d in c.diagnoses],
        }
        for c in patient.consultations
    ]

    vitals = [
        {
            "id": v.id,
            "blood_pressure_systolic": v.blood_pressure_systolic,
            "blood_pressure_diastolic": v.blood_pressure_diastolic,
            "heart_rate": v.heart_rate,
            "temperature_celsius": v.temperature_celsius,
            "spO2": v.spO2,
            "respiratory_rate": v.respiratory_rate,
            "weight_kg": v.weight_kg,
            "height_cm": v.height_cm,
            "bmi": v.bmi,
            "blood_glucose": v.blood_glucose,
            "recorded_at": v.recorded_at,
        }
        for v in patient.vitals
    ]

    prescriptions = [
        {
            "id": rx.id,
            "rx_number": rx.rx_number,
            "doctor_name": rx.doctor.user.full_name if rx.doctor and rx.doctor.user else "Unknown Doctor",
            "status": rx.status,
            "created_at": rx.created_at,
            "items": [
                {
                    "medicine_name": item.medicine_name,
                    "strength": item.strength,
                    "dosage": item.dosage,
                    "frequency": item.frequency,
                    "duration": item.duration,
                    "instructions": item.instructions,
                }
                for item in rx.items
            ],
        }
        for rx in patient.prescriptions
    ]

    bills = [
        {
            "id": b.id,
            "bill_number": b.bill_number,
            "total": float(b.total),
            "paid_amount": float(b.paid_amount),
            "balance_amount": float(b.balance_amount),
            "status": b.status,
            "created_at": b.created_at,
        }
        for b in patient.bills
    ]

    return {
        "patient": _map_patient_response(patient),
        "consultations": consultations,
        "vitals": vitals,
        "prescriptions": prescriptions,
        "bills": bills,
    }
