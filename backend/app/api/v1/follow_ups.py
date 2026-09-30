from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, record_audit
from app.core.websocket import notify_data_change
from app.models.consultation import Consultation
from app.models.doctor import Doctor
from app.models.follow_up import FollowUp
from app.models.patient import Patient
from app.models.user import User
from app.schemas.follow_up import (
    FollowUpCreate,
    FollowUpListResponse,
    FollowUpResponse,
    FollowUpUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/follow-ups", tags=["Follow-ups"])


def _map_follow_up_response(f: FollowUp) -> FollowUpResponse:
    return FollowUpResponse(
        id=f.id,
        patient_id=f.patient_id,
        patient_name=f.patient.full_name if f.patient else None,
        patient_uhid=f.patient.uhid if f.patient else None,
        patient_phone=f.patient.phone if f.patient else None,
        doctor_id=f.doctor_id,
        doctor_name=f.doctor.user.full_name if (f.doctor and f.doctor.user) else None,
        consultation_id=f.consultation_id,
        follow_up_date=f.follow_up_date,
        notes=f.notes,
        status=f.status,
        created_by=f.created_by,
        created_at=f.created_at,
        updated_at=f.updated_at,
    )


@router.get("", response_model=FollowUpListResponse)
def list_follow_ups(
    patient_id: Optional[int] = Query(None),
    doctor_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List scheduled follow-ups."""
    query = db.query(FollowUp)

    if patient_id:
        query = query.filter(FollowUp.patient_id == patient_id)
    if doctor_id:
        query = query.filter(FollowUp.doctor_id == doctor_id)
    if status:
        query = query.filter(FollowUp.status == status.upper())

    total = query.count()
    items = query.order_by(FollowUp.follow_up_date.asc()).offset(skip).limit(limit).all()

    return FollowUpListResponse(
        total=total,
        follow_ups=[_map_follow_up_response(f) for f in items],
    )


@router.post("", response_model=FollowUpResponse, status_code=status.HTTP_201_CREATED)
def schedule_follow_up(
    data: FollowUpCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Schedule a patient follow-up."""
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Safely resolve consultation_id if provided
    valid_cons_id = None
    if data.consultation_id:
        cons = db.query(Consultation).filter(
            (Consultation.id == data.consultation_id) | (Consultation.appointment_id == data.consultation_id)
        ).first()
        if cons:
            valid_cons_id = cons.id
        else:
            logger.warning("Consultation %s not found; recording follow-up without consultation link", data.consultation_id)

    follow_up = FollowUp(
        patient_id=data.patient_id,
        doctor_id=data.doctor_id,
        consultation_id=valid_cons_id,
        follow_up_date=data.follow_up_date,
        notes=data.notes,
        status="SCHEDULED",
        created_by=current_user.id,
    )
    db.add(follow_up)
    db.commit()
    db.refresh(follow_up)

    record_audit(
        db,
        action="SCHEDULE_FOLLOW_UP",
        user_id=current_user.id,
        entity_type="FollowUp",
        entity_id=follow_up.id,
    )

    notify_data_change("follow_up_updated", {"id": follow_up.id, "action": "created"})
    return _map_follow_up_response(follow_up)


@router.put("/{follow_up_id}", response_model=FollowUpResponse)
def update_follow_up(
    follow_up_id: int,
    data: FollowUpUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update follow-up status or schedule."""
    follow_up = db.query(FollowUp).filter(FollowUp.id == follow_up_id).first()
    if not follow_up:
        raise HTTPException(status_code=404, detail="Follow-up not found")

    if data.follow_up_date:
        follow_up.follow_up_date = data.follow_up_date
    if data.notes is not None:
        follow_up.notes = data.notes
    if data.status:
        follow_up.status = data.status.upper()

    follow_up.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(follow_up)

    notify_data_change("follow_up_updated", {"id": follow_up.id, "action": "updated"})
    return _map_follow_up_response(follow_up)
