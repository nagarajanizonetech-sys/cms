from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, record_audit
from app.core.websocket import notify_data_change
from app.core.notifications import create_system_notifications, get_staff_user_ids
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.queue import QueueEntry
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentListResponse,
    AppointmentResponse,
    AppointmentUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/appointments", tags=["Appointments"])


def _generate_token_number(db: Session, doctor_id: int, appt_date: date) -> str:
    """Generate sequential daily token for a doctor, e.g. T-01, T-02"""
    count = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == appt_date,
        )
        .count()
    ) + 1
    return f"T-{count:02d}"


def _map_appointment_response(a: Appointment) -> AppointmentResponse:
    return AppointmentResponse(
        id=a.id,
        patient_id=a.patient_id,
        patient_name=a.patient.full_name if a.patient else None,
        patient_uhid=a.patient.uhid if a.patient else None,
        patient_phone=a.patient.phone if a.patient else None,
        doctor_id=a.doctor_id,
        doctor_name=a.doctor.user.full_name if (a.doctor and a.doctor.user) else None,
        appointment_date=a.appointment_date,
        appointment_time=a.appointment_time,
        appointment_type=a.appointment_type,
        status=a.status,
        token_number=a.token_number,
        reason=a.reason,
        notes=a.notes,
        checked_in_at=a.checked_in_at,
        created_at=a.created_at,
        updated_at=a.updated_at,
    )


@router.get("", response_model=AppointmentListResponse)
def list_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    appointment_date: Optional[date] = Query(None),
    doctor_id: Optional[int] = Query(None),
    patient_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List appointments with optional date, doctor, patient, and status filters."""
    query = db.query(Appointment)

    if appointment_date:
        query = query.filter(Appointment.appointment_date == appointment_date)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if status:
        query = query.filter(Appointment.status == status.upper())

    total = query.count()
    appointments = (
        query.order_by(
            Appointment.appointment_date.desc(),
            Appointment.appointment_time.asc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    return AppointmentListResponse(
        total=total,
        appointments=[_map_appointment_response(a) for a in appointments],
    )


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Book a new appointment."""
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    token = _generate_token_number(db, data.doctor_id, data.appointment_date)

    appt = Appointment(
        patient_id=data.patient_id,
        doctor_id=data.doctor_id,
        appointment_date=data.appointment_date,
        appointment_time=data.appointment_time,
        appointment_type=data.appointment_type,
        status="SCHEDULED",
        token_number=token,
        reason=data.reason,
        notes=data.notes,
        created_by=current_user.id,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    record_audit(
        db,
        action="CREATE_APPOINTMENT",
        user_id=current_user.id,
        entity_type="Appointment",
        entity_id=appt.id,
    )

    notify_data_change("appointment_updated", {"id": appt.id, "action": "created"})

    # Send notifications to doctor and reception staff
    target_uids = get_staff_user_ids(db)
    if doctor and doctor.user_id:
        target_uids.append(doctor.user_id)
    doc_name = doctor.user.full_name if (doctor and doctor.user) else "Doctor"
    create_system_notifications(
        db=db,
        user_ids=target_uids,
        title="New Appointment Scheduled",
        message=f"{patient.full_name} scheduled with {doc_name} on {data.appointment_date} at {data.appointment_time}.",
        notif_type="APPOINTMENT",
        link_route="/doctor/appointments",
    )

    return _map_appointment_response(appt)


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get appointment by ID."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return _map_appointment_response(appt)


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update appointment details or status."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        if value is not None and hasattr(appt, field):
            setattr(appt, field, value)

    appt.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(appt)

    record_audit(
        db,
        action="UPDATE_APPOINTMENT",
        user_id=current_user.id,
        entity_type="Appointment",
        entity_id=appt.id,
    )

    notify_data_change("appointment_updated", {"id": appt.id, "action": "updated"})
    return _map_appointment_response(appt)


@router.post("/{appointment_id}/check-in", response_model=AppointmentResponse)
def check_in_appointment(
    appointment_id: int,
    fee: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check in patient for their appointment, automatically queuing them for consultation and generating initial bill."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    now = datetime.now(timezone.utc)
    appt.status = "CHECKED_IN"
    appt.checked_in_at = now

    # Check if queue entry exists or create new
    existing_queue = (
        db.query(QueueEntry)
        .filter(QueueEntry.appointment_id == appt.id)
        .first()
    )

    if not existing_queue:
        queue_entry = QueueEntry(
            appointment_id=appt.id,
            patient_id=appt.patient_id,
            doctor_id=appt.doctor_id,
            queue_date=appt.appointment_date,
            token_number=appt.token_number or "T-01",
            priority="NORMAL",
            status="WAITING",
            checked_in_at=now,
        )
        db.add(queue_entry)
    else:
        existing_queue.status = "WAITING"
        existing_queue.checked_in_at = now

    db.commit()
    db.refresh(appt)

    # Automatically generate consultation bill upon queue entry if none exists
    from app.api.v1.billing import auto_create_bill_for_appointment
    auto_create_bill_for_appointment(db, appt, current_user.id, fee)

    record_audit(
        db,
        action="CHECKIN_APPOINTMENT",
        user_id=current_user.id,
        entity_type="Appointment",
        entity_id=appt.id,
    )

    notify_data_change("appointment_updated", {"id": appt.id, "action": "check_in"})
    notify_data_change("queue_updated")

    # Send notifications on check-in
    target_uids = get_staff_user_ids(db)
    if appt.doctor and appt.doctor.user_id:
        target_uids.append(appt.doctor.user_id)
    p_name = appt.patient.full_name if appt.patient else "Patient"
    tok = appt.token_number or "Waiting"
    create_system_notifications(
        db=db,
        user_ids=target_uids,
        title="Patient Checked In",
        message=f"{p_name} arrived (Token {tok}). Added to waiting queue.",
        notif_type="QUEUE",
        link_route="/doctor/appointments",
    )

    return _map_appointment_response(appt)


@router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel an appointment and remove from queue if waiting."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.status = "CANCELLED"
    if reason:
        appt.notes = f"{appt.notes or ''} [Cancelled: {reason}]".strip()

    # Cancel associated queue entry if present
    queue_entry = db.query(QueueEntry).filter(QueueEntry.appointment_id == appt.id).first()
    if queue_entry:
        queue_entry.status = "NO_SHOW"

    db.commit()
    db.refresh(appt)

    record_audit(
        db,
        action="CANCEL_APPOINTMENT",
        user_id=current_user.id,
        entity_type="Appointment",
        entity_id=appt.id,
    )

    notify_data_change("appointment_updated", {"id": appt.id, "action": "cancelled"})
    notify_data_change("queue_updated")

    # Send cancellation notification
    target_uids = get_staff_user_ids(db)
    if appt.doctor and appt.doctor.user_id:
        target_uids.append(appt.doctor.user_id)
    p_name = appt.patient.full_name if appt.patient else "Patient"
    create_system_notifications(
        db=db,
        user_ids=target_uids,
        title="Appointment Cancelled",
        message=f"Appointment for {p_name} on {appt.appointment_date} was cancelled.",
        notif_type="WARNING",
        link_route="/doctor/appointments",
    )
