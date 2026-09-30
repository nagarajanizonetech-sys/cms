from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, record_audit
from app.core.websocket import notify_data_change
from app.core.notifications import create_system_notifications, get_staff_user_ids
from app.models.appointment import Appointment
from app.models.consultation import Consultation
from app.models.diagnosis import Diagnosis
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.queue import QueueEntry
from app.models.symptom import Symptom
from app.models.user import User
from app.models.vital import Vital
from app.schemas.consultation import (
    ConsultationChargeResponse,
    ConsultationCreate,
    ConsultationResponse,
    ConsultationUpdate,
    ConsultationVitalsInput,
    DiagnosisResponse,
    SymptomResponse,
)
from app.schemas.vital import VitalResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/consultations", tags=["Consultations"])


def _save_consultation_vitals(
    db: Session,
    patient_id: int,
    appointment_id: int,
    user_id: int,
    vitals_input: Optional[ConsultationVitalsInput],
) -> Optional[Vital]:
    if not vitals_input:
        return None

    # Check if a vital already exists for this appointment
    vital_record = db.query(Vital).filter(Vital.appointment_id == appointment_id).first()
    if not vital_record and patient_id:
        vital_record = db.query(Vital).filter(Vital.patient_id == patient_id, Vital.appointment_id == None).first()

    bmi = vitals_input.bmi
    if bmi is None and vitals_input.height and vitals_input.weight and vitals_input.height > 0:
        h_m = vitals_input.height / 100.0
        bmi = round(vitals_input.weight / (h_m * h_m), 1)

    if vital_record:
        if vitals_input.height is not None:
            vital_record.height = vitals_input.height
        if vitals_input.weight is not None:
            vital_record.weight = vitals_input.weight
        if bmi is not None:
            vital_record.bmi = bmi
        if vitals_input.blood_pressure_systolic is not None:
            vital_record.blood_pressure_systolic = vitals_input.blood_pressure_systolic
        if vitals_input.blood_pressure_diastolic is not None:
            vital_record.blood_pressure_diastolic = vitals_input.blood_pressure_diastolic
        if vitals_input.pulse is not None:
            vital_record.pulse = vitals_input.pulse
        if vitals_input.spo2 is not None:
            vital_record.spo2 = vitals_input.spo2
        if vitals_input.temperature is not None:
            vital_record.temperature = vitals_input.temperature
        if vitals_input.respiratory_rate is not None:
            vital_record.respiratory_rate = vitals_input.respiratory_rate
        if appointment_id:
            vital_record.appointment_id = appointment_id
    else:
        vital_record = Vital(
            patient_id=patient_id,
            appointment_id=appointment_id,
            recorded_by=user_id,
            height=vitals_input.height,
            weight=vitals_input.weight,
            bmi=bmi,
            blood_pressure_systolic=vitals_input.blood_pressure_systolic,
            blood_pressure_diastolic=vitals_input.blood_pressure_diastolic,
            pulse=vitals_input.pulse,
            spo2=vitals_input.spo2,
            temperature=vitals_input.temperature,
            respiratory_rate=vitals_input.respiratory_rate,
        )
        db.add(vital_record)

    return vital_record


def _map_consultation_response(c: Consultation) -> ConsultationResponse:
    vital_obj = None
    if c.appointment and c.appointment.vitals:
        vital_obj = sorted(c.appointment.vitals, key=lambda v: v.id or 0)[-1]
    elif c.patient and c.patient.vitals:
        vital_obj = sorted(c.patient.vitals, key=lambda v: v.id or 0)[-1]

    vital_resp = None
    if vital_obj:
        vital_resp = VitalResponse(
            id=vital_obj.id,
            patient_id=vital_obj.patient_id,
            appointment_id=vital_obj.appointment_id,
            recorded_by=vital_obj.recorded_by,
            height=vital_obj.height,
            weight=vital_obj.weight,
            bmi=vital_obj.bmi,
            blood_pressure_systolic=vital_obj.blood_pressure_systolic,
            blood_pressure_diastolic=vital_obj.blood_pressure_diastolic,
            pulse=vital_obj.pulse,
            spo2=vital_obj.spo2,
            temperature=vital_obj.temperature,
            respiratory_rate=vital_obj.respiratory_rate,
            created_at=vital_obj.created_at,
        )

    unique_symptoms = []
    seen_sym = set()
    for s in c.symptoms:
        key = (s.name or "").strip().lower()
        if key and key not in seen_sym:
            seen_sym.add(key)
            unique_symptoms.append(
                SymptomResponse(
                    id=s.id,
                    name=s.name,
                    duration=s.duration,
                    severity=s.severity,
                    notes=s.notes,
                )
            )

    unique_diagnoses = []
    seen_diag = set()
    for d in c.diagnoses:
        key = (d.description or "").strip().lower()
        if key and key not in seen_diag:
            seen_diag.add(key)
            unique_diagnoses.append(
                DiagnosisResponse(
                    id=d.id,
                    code=d.code,
                    description=d.description,
                    diagnosis_type=d.diagnosis_type,
                    notes=d.notes,
                    created_at=d.created_at,
                )
            )

    return ConsultationResponse(
        id=c.id,
        patient_id=c.patient_id,
        patient_name=c.patient.full_name if c.patient else None,
        patient_uhid=c.patient.uhid if c.patient else None,
        appointment_id=c.appointment_id,
        doctor_id=c.doctor_id,
        doctor_name=c.doctor.user.full_name if (c.doctor and c.doctor.user) else None,
        chief_complaint=c.chief_complaint,
        clinical_notes=c.clinical_notes,
        examination_notes=c.examination_notes,
        treatment_advice=c.treatment_advice,
        doctor_notes=c.doctor_notes,
        status=c.status,
        vitals=vital_resp,
        symptoms=unique_symptoms,
        diagnoses=unique_diagnoses,
        charges=[
            ConsultationChargeResponse(
                id=it.id,
                service_name=it.service_name,
                amount=float(it.total if it.total is not None else (it.quantity * it.unit_price)),
                original_amount=float(it.unit_price),
                notes=it.description,
            )
            for it in (c.appointment.bill.items if (c.appointment and c.appointment.bill and c.appointment.bill.items) else [])
        ],
        created_at=c.created_at,
        updated_at=c.updated_at,
        completed_at=c.completed_at,
    )


@router.get("", response_model=List[ConsultationResponse])
def list_consultations(
    patient_id: Optional[int] = Query(None),
    doctor_id: Optional[int] = Query(None),
    appointment_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List consultations with patient, doctor, appointment, and status filters."""
    query = db.query(Consultation)

    if patient_id:
        query = query.filter(Consultation.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Consultation.doctor_id == doctor_id)
    if appointment_id:
        query = query.filter(Consultation.appointment_id == appointment_id)
    if status:
        query = query.filter(Consultation.status == status.upper())

    consultations = (
        query.order_by(Consultation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_map_consultation_response(c) for c in consultations]


@router.post("", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
def create_consultation(
    data: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start/record a consultation session with symptoms and diagnoses."""
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    appt = db.query(Appointment).filter(Appointment.id == data.appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Update appointment and queue entry status
    appt.status = "IN_CONSULTATION"
    queue_entry = db.query(QueueEntry).filter(QueueEntry.appointment_id == appt.id).first()
    if queue_entry:
        queue_entry.status = "ENGAGED"
        if not queue_entry.engaged_at:
            queue_entry.engaged_at = datetime.now(timezone.utc)

    # Check if a consultation already exists for this appointment
    consultation = (
        db.query(Consultation)
        .filter(Consultation.appointment_id == data.appointment_id)
        .first()
    )

    if consultation:
        # Update existing consultation
        if data.chief_complaint:
            consultation.chief_complaint = data.chief_complaint
        if data.clinical_notes is not None:
            consultation.clinical_notes = data.clinical_notes
        if data.examination_notes is not None:
            consultation.examination_notes = data.examination_notes
        if data.treatment_advice is not None:
            consultation.treatment_advice = data.treatment_advice
        if data.doctor_notes is not None:
            consultation.doctor_notes = data.doctor_notes
        consultation.updated_at = datetime.now(timezone.utc)

    else:
        consultation = Consultation(
            patient_id=data.patient_id,
            appointment_id=data.appointment_id,
            doctor_id=data.doctor_id,
            chief_complaint=data.chief_complaint,
            clinical_notes=data.clinical_notes,
            examination_notes=data.examination_notes,
            treatment_advice=data.treatment_advice,
            doctor_notes=data.doctor_notes,
            status="IN_PROGRESS",
        )
        db.add(consultation)
        db.flush()

    # Update symptoms cleanly without duplicates
    if data.symptoms is not None:
        db.query(Symptom).filter(Symptom.consultation_id == consultation.id).delete()
        seen_symptoms = set()
        for sym_data in data.symptoms:
            sym_key = (sym_data.name or "").strip().lower()
            if sym_key and sym_key not in seen_symptoms:
                seen_symptoms.add(sym_key)
                db.add(Symptom(
                    consultation_id=consultation.id,
                    name=sym_data.name.strip(),
                    duration=sym_data.duration,
                    severity=sym_data.severity,
                    notes=sym_data.notes,
                ))

    # Update diagnoses cleanly without duplicates
    if data.diagnoses is not None:
        db.query(Diagnosis).filter(Diagnosis.consultation_id == consultation.id).delete()
        seen_diagnoses = set()
        for diag_data in data.diagnoses:
            diag_key = (diag_data.description or "").strip().lower()
            if diag_key and diag_key not in seen_diagnoses:
                seen_diagnoses.add(diag_key)
                db.add(Diagnosis(
                    consultation_id=consultation.id,
                    code=diag_data.code,
                    description=diag_data.description.strip(),
                    diagnosis_type=diag_data.diagnosis_type,
                    notes=diag_data.notes,
                ))

    # Save / update vitals if provided
    if data.vitals:
        _save_consultation_vitals(
            db=db,
            patient_id=data.patient_id,
            appointment_id=data.appointment_id,
            user_id=current_user.id,
            vitals_input=data.vitals,
        )

    db.commit()
    db.refresh(consultation)

    record_audit(
        db,
        action="START_CONSULTATION",
        user_id=current_user.id,
        entity_type="Consultation",
        entity_id=consultation.id,
    )

    notify_data_change("consultation_updated", {"id": consultation.id, "action": "started"})
    notify_data_change("queue_updated")
    return _map_consultation_response(consultation)


@router.get("/{consultation_id}", response_model=ConsultationResponse)
def get_consultation(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single consultation details."""
    consultation = (
        db.query(Consultation)
        .filter(Consultation.id == consultation_id)
        .first()
    )
    if not consultation:
        consultation = (
            db.query(Consultation)
            .filter(Consultation.appointment_id == consultation_id)
            .first()
        )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return _map_consultation_response(consultation)


@router.put("/{consultation_id}", response_model=ConsultationResponse)
def update_consultation(
    consultation_id: int,
    data: ConsultationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update consultation notes, treatment advice, symptoms, diagnoses, or vitals."""
    consultation = (
        db.query(Consultation)
        .filter(Consultation.id == consultation_id)
        .first()
    )
    if not consultation:
        consultation = (
            db.query(Consultation)
            .filter(Consultation.appointment_id == consultation_id)
            .first()
        )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    update_dict = data.model_dump(exclude_unset=True)
    for field in ["chief_complaint", "clinical_notes", "examination_notes", "treatment_advice", "doctor_notes"]:
        if field in update_dict and update_dict[field] is not None:
            setattr(consultation, field, update_dict[field])

    if data.symptoms is not None:
        db.query(Symptom).filter(Symptom.consultation_id == consultation.id).delete()
        seen_symptoms = set()
        for sym_data in data.symptoms:
            sym_key = (sym_data.name or "").strip().lower()
            if sym_key and sym_key not in seen_symptoms:
                seen_symptoms.add(sym_key)
                db.add(Symptom(
                    consultation_id=consultation.id,
                    name=sym_data.name.strip(),
                    duration=sym_data.duration,
                    severity=sym_data.severity,
                    notes=sym_data.notes,
                ))

    if data.diagnoses is not None:
        db.query(Diagnosis).filter(Diagnosis.consultation_id == consultation.id).delete()
        seen_diagnoses = set()
        for diag_data in data.diagnoses:
            diag_key = (diag_data.description or "").strip().lower()
            if diag_key and diag_key not in seen_diagnoses:
                seen_diagnoses.add(diag_key)
                db.add(Diagnosis(
                    consultation_id=consultation.id,
                    code=diag_data.code,
                    description=diag_data.description.strip(),
                    diagnosis_type=diag_data.diagnosis_type,
                    notes=diag_data.notes,
                ))

    if data.vitals is not None:
        _save_consultation_vitals(
            db=db,
            patient_id=consultation.patient_id,
            appointment_id=consultation.appointment_id,
            user_id=current_user.id,
            vitals_input=data.vitals,
        )

    consultation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(consultation)

    record_audit(
        db,
        action="UPDATE_CONSULTATION",
        user_id=current_user.id,
        entity_type="Consultation",
        entity_id=consultation.id,
    )

    notify_data_change("consultation_updated", {"id": consultation.id, "action": "updated"})
    return _map_consultation_response(consultation)


@router.post("/{consultation_id}/complete", response_model=ConsultationResponse)
def complete_consultation(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark consultation as completed; cascades completion to appointment and queue."""
    consultation = (
        db.query(Consultation)
        .filter(Consultation.id == consultation_id)
        .first()
    )
    if not consultation:
        # Check if consultation_id was passed as appointment_id
        consultation = (
            db.query(Consultation)
            .filter(Consultation.appointment_id == consultation_id)
            .first()
        )

    if not consultation:
        # Check if an appointment exists with this ID
        appt = db.query(Appointment).filter(Appointment.id == consultation_id).first()
        if appt:
            consultation = Consultation(
                patient_id=appt.patient_id,
                appointment_id=appt.id,
                doctor_id=appt.doctor_id,
                chief_complaint=appt.reason or "Clinical Consultation",
                status="IN_PROGRESS",
            )
            db.add(consultation)
            db.flush()
        else:
            raise HTTPException(status_code=404, detail="Consultation not found")

    now = datetime.now(timezone.utc)
    consultation.status = "COMPLETED"
    consultation.completed_at = now
    consultation.updated_at = now

    if consultation.appointment:
        consultation.appointment.status = "COMPLETED"

    queue_entry = (
        db.query(QueueEntry)
        .filter(QueueEntry.appointment_id == consultation.appointment_id)
        .first()
    )
    if queue_entry:
        queue_entry.status = "COMPLETED"
        queue_entry.completed_at = now

    db.commit()
    db.refresh(consultation)

    record_audit(
        db,
        action="COMPLETE_CONSULTATION",
        user_id=current_user.id,
        entity_type="Consultation",
        entity_id=consultation.id,
    )

    notify_data_change("consultation_updated", {"id": consultation.id, "action": "completed"})
    notify_data_change("queue_updated")
    notify_data_change("appointment_updated")

    # Send notification that consultation is complete
    target_uids = get_staff_user_ids(db)
    if consultation.doctor and consultation.doctor.user_id:
        target_uids.append(consultation.doctor.user_id)
    p_name = consultation.patient.full_name if consultation.patient else "Patient"
    create_system_notifications(
        db=db,
        user_ids=target_uids,
        title="Consultation Completed",
        message=f"Consultation for {p_name} completed. Ready for prescription & billing checkout.",
        notif_type="SUCCESS",
        link_route="/reception/billing",
    )

    return _map_consultation_response(consultation)
