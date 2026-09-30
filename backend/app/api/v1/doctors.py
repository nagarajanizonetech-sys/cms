from __future__ import annotations

import logging
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, record_audit
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.queue import QueueEntry
from app.models.user import User
from app.schemas.doctor import DoctorResponse, DoctorStatusUpdate, DoctorUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/doctors", tags=["Doctors"])


def _map_doctor_response(d: Doctor) -> DoctorResponse:
    return DoctorResponse(
        id=d.id,
        doctor_code=d.doctor_code,
        specialization=d.specialization,
        department=d.department,
        room=d.room,
        consultation_fee=float(d.consultation_fee),
        schedule_days=d.schedule_days,
        schedule_start=d.schedule_start,
        schedule_end=d.schedule_end,
        slot_duration_mins=d.slot_duration_mins,
        status=d.status,
        is_active=d.is_active,
        full_name=d.user.full_name if d.user else "Unknown Doctor",
        email=d.user.email if d.user else "",
        phone=d.user.phone if d.user else None,
        user_id=d.user_id,
    )


@router.get("", response_model=List[DoctorResponse])
def list_doctors(
    specialization: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all doctors with optional filtering."""
    query = db.query(Doctor).join(Doctor.user)

    if is_active is not None:
        query = query.filter(Doctor.is_active == is_active)
    if status:
        query = query.filter(Doctor.status.ilike(status))
    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (User.full_name.ilike(s)) | (Doctor.doctor_code.ilike(s)) | (Doctor.department.ilike(s))
        )

    doctors = query.order_by(Doctor.id.asc()).all()
    return [_map_doctor_response(d) for d in doctors]


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get doctor details by ID."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return _map_doctor_response(doctor)


@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int,
    data: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update doctor profile details."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        if value is not None and hasattr(doctor, field):
            setattr(doctor, field, value)

    db.commit()
    db.refresh(doctor)

    record_audit(
        db,
        action="UPDATE_DOCTOR",
        user_id=current_user.id,
        entity_type="Doctor",
        entity_id=doctor.id,
    )

    return _map_doctor_response(doctor)


@router.put("/{doctor_id}/status", response_model=DoctorResponse)
def update_doctor_status(
    doctor_id: int,
    data: DoctorStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update doctor's current operational status (Available / In Consultation / On Leave)."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doctor.status = data.status
    db.commit()
    db.refresh(doctor)

    record_audit(
        db,
        action="UPDATE_DOCTOR_STATUS",
        user_id=current_user.id,
        entity_type="Doctor",
        entity_id=doctor.id,
        new_data=f'{{"status": "{data.status}"}}',
    )

    return _map_doctor_response(doctor)


@router.get("/{doctor_id}/queue")
def get_doctor_active_queue(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get active patient queue for doctor for today."""
    today = date.today()
    entries = (
        db.query(QueueEntry)
        .filter(
            QueueEntry.doctor_id == doctor_id,
            QueueEntry.queue_date == today,
            QueueEntry.status.in_(["WAITING", "ENGAGED"]),
        )
        .order_by(
            QueueEntry.priority.desc(),
            QueueEntry.token_number.asc(),
        )
        .all()
    )

    return [
        {
            "id": q.id,
            "token_number": q.token_number,
            "patient_id": q.patient_id,
            "patient_name": q.patient.full_name if q.patient else "Unknown",
            "patient_uhid": q.patient.uhid if q.patient else None,
            "priority": q.priority,
            "status": q.status,
            "called_at": q.called_at,
            "engaged_at": q.engaged_at,
            "created_at": q.created_at,
        }
        for q in entries
    ]
