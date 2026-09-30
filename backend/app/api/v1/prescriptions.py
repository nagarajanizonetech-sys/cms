from __future__ import annotations

import logging
import random
from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, record_audit
from app.core.websocket import notify_data_change
from app.models.appointment import Appointment
from app.models.consultation import Consultation
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.prescription import Prescription, PrescriptionItem
from app.models.user import User
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionItemCreate,
    PrescriptionItemResponse,
    PrescriptionListResponse,
    PrescriptionResponse,
    PrescriptionUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


def _generate_rx_number(db: Session) -> str:
    """Generate Rx number, e.g. RX-20260926-0042"""
    today_str = date.today().strftime("%Y%m%d")
    count = db.query(Prescription).count() + 1
    rand = random.randint(10, 99)
    rx_no = f"RX-{today_str}-{count:03d}{rand}"
    while db.query(Prescription).filter(Prescription.rx_number == rx_no).first():
        rand = random.randint(100, 999)
        rx_no = f"RX-{today_str}-{count:03d}{rand}"
    return rx_no


def _map_prescription_response(rx: Prescription) -> PrescriptionResponse:
    return PrescriptionResponse(
        id=rx.id,
        rx_number=rx.rx_number,
        consultation_id=rx.consultation_id,
        patient_id=rx.patient_id,
        patient_name=rx.patient.full_name if rx.patient else None,
        patient_uhid=rx.patient.uhid if rx.patient else None,
        doctor_id=rx.doctor_id,
        doctor_name=rx.doctor.user.full_name if (rx.doctor and rx.doctor.user) else None,
        status=rx.status,
        general_advice=rx.general_advice,
        diet_and_lifestyle=rx.diet_and_lifestyle,
        follow_up_date=rx.follow_up_date,
        follow_up_notes=rx.follow_up_notes,
        created_at=rx.created_at,
        updated_at=rx.updated_at,
        items=[
            PrescriptionItemResponse(
                id=item.id,
                prescription_id=item.prescription_id,
                medicine_name=item.medicine_name,
                strength=item.strength,
                dosage=item.dosage,
                frequency=item.frequency,
                duration=item.duration,
                route=item.route,
                timing=item.timing,
                quantity=item.quantity,
                instructions=item.instructions,
            )
            for item in rx.items
        ],
    )


@router.get("", response_model=PrescriptionListResponse)
def list_prescriptions(
    patient_id: Optional[int] = Query(None),
    doctor_id: Optional[int] = Query(None),
    consultation_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List prescriptions with filtering by patient, doctor, consultation, status."""
    query = db.query(Prescription)

    if patient_id:
        query = query.filter(Prescription.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Prescription.doctor_id == doctor_id)
    if consultation_id:
        query = query.filter(Prescription.consultation_id == consultation_id)
    if status:
        query = query.filter(Prescription.status == status.upper())

    total = query.count()
    prescriptions = (
        query.order_by(Prescription.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return PrescriptionListResponse(
        total=total,
        prescriptions=[_map_prescription_response(rx) for rx in prescriptions],
    )


@router.post("", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_prescription(
    data: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new prescription with medications."""
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    consultation = db.query(Consultation).filter(Consultation.id == data.consultation_id).first()
    if not consultation:
        # Check if consultation_id was provided as appointment_id
        consultation = db.query(Consultation).filter(Consultation.appointment_id == data.consultation_id).first()

    if not consultation:
        appt = db.query(Appointment).filter(Appointment.id == data.consultation_id).first()
        if not appt:
            appt = db.query(Appointment).filter(
                Appointment.patient_id == data.patient_id,
                Appointment.doctor_id == data.doctor_id,
            ).order_by(Appointment.created_at.desc()).first()

        consultation = Consultation(
            patient_id=data.patient_id,
            doctor_id=data.doctor_id,
            appointment_id=appt.id if appt else None,
            chief_complaint=appt.reason if appt else "Consultation prescription",
            status="IN_PROGRESS",
        )
        db.add(consultation)
        db.flush()

    rx_number = _generate_rx_number(db)

    prescription = Prescription(
        rx_number=rx_number,
        consultation_id=consultation.id,
        patient_id=data.patient_id,
        doctor_id=data.doctor_id,
        status="CREATED",
        general_advice=data.general_advice,
        diet_and_lifestyle=data.diet_and_lifestyle,
        follow_up_date=data.follow_up_date,
        follow_up_notes=data.follow_up_notes,
    )
    db.add(prescription)
    db.flush()

    for item_data in data.items:
        item = PrescriptionItem(
            prescription_id=prescription.id,
            medicine_name=item_data.medicine_name,
            strength=item_data.strength,
            dosage=item_data.dosage,
            frequency=item_data.frequency,
            duration=item_data.duration,
            route=item_data.route,
            timing=item_data.timing,
            quantity=item_data.quantity,
            instructions=item_data.instructions,
        )
        db.add(item)

    db.commit()
    db.refresh(prescription)

    record_audit(
        db,
        action="CREATE_PRESCRIPTION",
        user_id=current_user.id,
        entity_type="Prescription",
        entity_id=prescription.id,
    )

    notify_data_change("prescription_updated", {"id": prescription.id, "action": "created"})
    return _map_prescription_response(prescription)


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single prescription by ID."""
    rx = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return _map_prescription_response(rx)


@router.put("/{prescription_id}", response_model=PrescriptionResponse)
def update_prescription(
    prescription_id: int,
    data: PrescriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update prescription status or details."""
    rx = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if data.status:
        rx.status = data.status.upper()
    if data.general_advice is not None:
        rx.general_advice = data.general_advice
    if data.diet_and_lifestyle is not None:
        rx.diet_and_lifestyle = data.diet_and_lifestyle
    if data.follow_up_date is not None:
        rx.follow_up_date = data.follow_up_date
    if data.follow_up_notes is not None:
        rx.follow_up_notes = data.follow_up_notes

    if data.items is not None:
        db.query(PrescriptionItem).filter(PrescriptionItem.prescription_id == rx.id).delete()
        for item_data in data.items:
            item = PrescriptionItem(
                prescription_id=rx.id,
                medicine_name=item_data.medicine_name,
                strength=item_data.strength,
                dosage=item_data.dosage,
                frequency=item_data.frequency,
                duration=item_data.duration,
                route=item_data.route,
                timing=item_data.timing,
                quantity=item_data.quantity,
                instructions=item_data.instructions,
            )
            db.add(item)

    rx.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rx)

    record_audit(
        db,
        action="UPDATE_PRESCRIPTION",
        user_id=current_user.id,
        entity_type="Prescription",
        entity_id=rx.id,
    )

    notify_data_change("prescription_updated", {"id": rx.id, "action": "updated"})
    return _map_prescription_response(rx)
