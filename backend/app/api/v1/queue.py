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
from app.schemas.queue import (
    CheckInRequest,
    QueueActionRequest,
    QueueEntryCreate,
    QueueEntryResponse,
    QueueListResponse,
    QueuePriorityUpdate,
    QueueStatusUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/queue", tags=["Queue"])


def _map_queue_response(q: QueueEntry) -> QueueEntryResponse:
    appt = q.appointment
    return QueueEntryResponse(
        id=q.id,
        appointment_id=q.appointment_id,
        patient_id=q.patient_id,
        patient_name=q.patient.full_name if q.patient else None,
        patient_uhid=q.patient.uhid if q.patient else None,
        doctor_id=q.doctor_id,
        doctor_name=q.doctor.user.full_name if (q.doctor and q.doctor.user) else None,
        token_number=q.token_number,
        priority=q.priority,
        status=q.status,
        check_in_time=q.checked_in_at,
        called_time=q.called_at,
        consultation_start_time=q.engaged_at,
        consultation_end_time=q.completed_at,
        created_at=q.created_at,
        updated_at=q.updated_at,
        appointment_type=appt.appointment_type if appt else "WALK_IN",
        reason=appt.reason if appt else None,
    )


@router.get("", response_model=QueueListResponse)
def list_queue(
    queue_date: Optional[date] = Query(None),
    doctor_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List queue entries for a given date (defaults to today)."""
    target_date = queue_date or date.today()
    query = db.query(QueueEntry).filter(QueueEntry.queue_date == target_date)

    if doctor_id:
        query = query.filter(QueueEntry.doctor_id == doctor_id)
    if status:
        query = query.filter(QueueEntry.status == status.upper())

    # Order priority EMERGENCY > URGENT > NORMAL, then token
    entries = (
        query.order_by(
            QueueEntry.status.asc(),
            QueueEntry.priority.desc(),
            QueueEntry.token_number.asc(),
        )
        .all()
    )

    return QueueListResponse(
        total=len(entries),
        entries=[_map_queue_response(e) for e in entries],
    )


@router.post("", response_model=QueueEntryResponse, status_code=status.HTTP_201_CREATED)
def add_to_queue(
    data: QueueEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually add patient to the queue (e.g. walk-in)."""
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    today = date.today()
    count = (
        db.query(QueueEntry)
        .filter(QueueEntry.doctor_id == data.doctor_id, QueueEntry.queue_date == today)
        .count()
    ) + 1
    token = f"Q-{count:02d}"

    entry = QueueEntry(
        appointment_id=data.appointment_id,
        patient_id=data.patient_id,
        doctor_id=data.doctor_id,
        queue_date=today,
        token_number=token,
        priority=data.priority.upper(),
        status="WAITING",
        checked_in_at=datetime.now(timezone.utc),
        notes=data.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    if data.appointment_id:
        appt = db.query(Appointment).filter(Appointment.id == data.appointment_id).first()
        if appt:
            from app.api.v1.billing import auto_create_bill_for_appointment
            auto_create_bill_for_appointment(db, appt, current_user.id)

    record_audit(
        db,
        action="ADD_TO_QUEUE",
        user_id=current_user.id,
        entity_type="QueueEntry",
        entity_id=entry.id,
    )

    notify_data_change("queue_updated", {"action": "added", "id": entry.id})
    return _map_queue_response(entry)


@router.post("/check-in", response_model=QueueEntryResponse)
def check_in_by_appointment(
    data: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check in patient by appointment ID to the active queue."""
    appt = db.query(Appointment).filter(Appointment.id == data.appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    now = datetime.now(timezone.utc)
    appt.status = "CHECKED_IN"
    appt.checked_in_at = now

    entry = db.query(QueueEntry).filter(QueueEntry.appointment_id == appt.id).first()
    if not entry:
        entry = QueueEntry(
            appointment_id=appt.id,
            patient_id=appt.patient_id,
            doctor_id=appt.doctor_id,
            queue_date=appt.appointment_date,
            token_number=appt.token_number or "T-01",
            priority=data.priority.upper(),
            status="WAITING",
            checked_in_at=now,
        )
        db.add(entry)
    else:
        entry.status = "WAITING"
        entry.priority = data.priority.upper()
        entry.checked_in_at = now

    db.commit()
    db.refresh(entry)

    # Automatically generate consultation bill upon queue entry if none exists
    from app.api.v1.billing import auto_create_bill_for_appointment
    auto_create_bill_for_appointment(db, appt, current_user.id, data.fee)

    notify_data_change("queue_updated", {"action": "check_in", "id": entry.id})
    notify_data_change("appointment_updated", {"id": appt.id})

    # Dispatch check-in notification
    target_uids = get_staff_user_ids(db)
    if appt.doctor and appt.doctor.user_id:
        target_uids.append(appt.doctor.user_id)
    p_name = appt.patient.full_name if appt.patient else "Patient"
    tok = entry.token_number or "Waiting"
    create_system_notifications(
        db=db,
        user_ids=target_uids,
        title="Patient Checked In",
        message=f"{p_name} arrived (Token {tok}). Added to queue.",
        notif_type="QUEUE",
        link_route="/doctor/appointments",
    )

    return _map_queue_response(entry)


@router.put("/{entry_id}/status", response_model=QueueEntryResponse)
def update_queue_status(
    entry_id: int,
    data: QueueStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update status of a queue entry (WAITING / ENGAGED / COMPLETED / NO_SHOW)."""
    entry = db.query(QueueEntry).filter(QueueEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")

    now = datetime.now(timezone.utc)
    new_status = data.status.upper()
    entry.status = new_status

    if new_status == "ENGAGED":
        entry.engaged_at = now
        if entry.appointment:
            entry.appointment.status = "IN_CONSULTATION"
    elif new_status == "COMPLETED":
        entry.completed_at = now
        if entry.appointment:
            entry.appointment.status = "COMPLETED"
    elif new_status == "NO_SHOW":
        if entry.appointment:
            entry.appointment.status = "NO_SHOW"

    db.commit()
    db.refresh(entry)

    record_audit(
        db,
        action="UPDATE_QUEUE_STATUS",
        user_id=current_user.id,
        entity_type="QueueEntry",
        entity_id=entry.id,
        new_data=f'{{"status": "{new_status}"}}',
    )

    notify_data_change("queue_updated", {"action": "status_update", "status": new_status, "id": entry.id})
    notify_data_change("appointment_updated")
    return _map_queue_response(entry)


@router.put("/{entry_id}/priority", response_model=QueueEntryResponse)
def update_queue_priority(
    entry_id: int,
    data: QueuePriorityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update priority of a queue entry (NORMAL / URGENT / EMERGENCY)."""
    entry = db.query(QueueEntry).filter(QueueEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")

    entry.priority = data.priority.upper()
    db.commit()
    db.refresh(entry)

    notify_data_change("queue_updated", {"action": "priority_update", "id": entry.id})
    return _map_queue_response(entry)


@router.post("/call-next/{doctor_id}", response_model=QueueEntryResponse)
def call_next_patient(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Automatically call the next waiting patient for a doctor."""
    today = date.today()
    next_entry = (
        db.query(QueueEntry)
        .filter(
            QueueEntry.doctor_id == doctor_id,
            QueueEntry.queue_date == today,
            QueueEntry.status == "WAITING",
        )
        .order_by(
            QueueEntry.priority.desc(),
            QueueEntry.token_number.asc(),
        )
        .first()
    )

    if not next_entry:
        raise HTTPException(status_code=404, detail="No waiting patients in queue for this doctor")

    now = datetime.now(timezone.utc)
    next_entry.status = "ENGAGED"
    next_entry.called_at = now
    next_entry.engaged_at = now

    if next_entry.appointment:
        next_entry.appointment.status = "IN_CONSULTATION"

    db.commit()
    db.refresh(next_entry)

    record_audit(
        db,
        action="CALL_NEXT_PATIENT",
        user_id=current_user.id,
        entity_type="QueueEntry",
        entity_id=next_entry.id,
    )

    notify_data_change("queue_updated", {"action": "called", "id": next_entry.id})
    notify_data_change("appointment_updated")

    # Send notification that patient was called into room
    target_uids = get_staff_user_ids(db)
    p_name = next_entry.patient.full_name if next_entry.patient else "Patient"
    create_system_notifications(
        db=db,
        user_ids=target_uids,
        title="Token Called to Room",
        message=f"Token {next_entry.token_number} ({p_name}) called into consultation suite.",
        notif_type="QUEUE",
        link_route="/reception/queue",
    )

    return _map_queue_response(next_entry)
