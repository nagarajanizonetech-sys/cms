from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.appointment import Appointment
from app.models.billing import Bill
from app.models.consultation import Consultation
from app.models.diagnosis import Diagnosis
from app.models.doctor import Doctor
from app.models.follow_up import FollowUp
from app.models.patient import Patient
from app.models.payment import Payment
from app.models.queue import QueueEntry
from app.models.user import User
from app.schemas.report import (
    AnalyticsResponse,
    AppointmentStatusBreakdown,
    DashboardStats,
    DiagnosisCount,
    DoctorStats,
    RevenueTrendPoint,
    OperationalReportResponse,
    DoctorReportResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get high-level summary KPIs for Reception and Doctor dashboards."""
    today = date.today()

    total_patients = db.query(Patient).filter(Patient.is_active == True).count()  # noqa: E712

    appointments_today = (
        db.query(Appointment)
        .filter(Appointment.appointment_date == today)
        .count()
    )

    waiting_in_queue = (
        db.query(QueueEntry)
        .filter(QueueEntry.queue_date == today, QueueEntry.status == "WAITING")
        .count()
    )

    # Consultations completed today
    start_of_day = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    completed_consultations = (
        db.query(Consultation)
        .filter(
            Consultation.status == "COMPLETED",
            Consultation.completed_at >= start_of_day,
        )
        .count()
    )

    # Revenue today
    today_revenue_res = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.payment_date >= start_of_day)
        .scalar()
    )
    revenue_today = float(today_revenue_res or 0)

    # Pending bills balance
    pending_bills_res = (
        db.query(func.coalesce(func.sum(Bill.balance_amount), 0))
        .filter(Bill.status != "PAID")
        .scalar()
    )
    pending_bills_amount = float(pending_bills_res or 0)

    active_doctors = (
        db.query(Doctor)
        .filter(Doctor.is_active == True, Doctor.status != "On Leave")  # noqa: E712
        .count()
    )

    return DashboardStats(
        total_patients=total_patients,
        appointments_today=appointments_today,
        waiting_in_queue=waiting_in_queue,
        completed_consultations_today=completed_consultations,
        revenue_today=revenue_today,
        pending_bills_amount=pending_bills_amount,
        active_doctors=active_doctors,
    )


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed charts and reporting analytics data."""
    today = date.today()
    dashboard_stats = get_dashboard_stats(db, current_user)

    # 1. Appointment breakdown
    status_counts = (
        db.query(Appointment.status, func.count(Appointment.id))
        .group_by(Appointment.status)
        .all()
    )
    appointment_breakdown = [
        AppointmentStatusBreakdown(status=s, count=c) for s, c in status_counts
    ]

    # 2. Doctor workloads
    doctors = db.query(Doctor).filter(Doctor.is_active == True).all()  # noqa: E712
    doctor_stats_list: List[DoctorStats] = []
    for d in doctors:
        seen = (
            db.query(QueueEntry)
            .filter(
                QueueEntry.doctor_id == d.id,
                QueueEntry.queue_date == today,
                QueueEntry.status == "COMPLETED",
            )
            .count()
        )
        waiting = (
            db.query(QueueEntry)
            .filter(
                QueueEntry.doctor_id == d.id,
                QueueEntry.queue_date == today,
                QueueEntry.status == "WAITING",
            )
            .count()
        )
        total_appts = (
            db.query(Appointment)
            .filter(
                Appointment.doctor_id == d.id,
                Appointment.appointment_date == today,
            )
            .count()
        )
        doctor_stats_list.append(
            DoctorStats(
                doctor_id=d.id,
                doctor_name=d.user.full_name if d.user else f"Doctor #{d.id}",
                specialization=d.specialization,
                patients_seen_today=seen,
                waiting_in_queue=waiting,
                total_appointments_today=total_appts,
            )
        )

    # 3. Revenue trend (past 7 days)
    revenue_trends: List[RevenueTrendPoint] = []
    for i in range(6, -1, -1):
        target_day = today - timedelta(days=i)
        start_dt = datetime.combine(target_day, datetime.min.time(), tzinfo=timezone.utc)
        end_dt = datetime.combine(target_day, datetime.max.time(), tzinfo=timezone.utc)

        rev_val = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(Payment.payment_date >= start_dt, Payment.payment_date <= end_dt)
            .scalar()
        )
        bills_c = (
            db.query(func.count(Bill.id))
            .filter(Bill.created_at >= start_dt, Bill.created_at <= end_dt)
            .scalar()
        )
        revenue_trends.append(
            RevenueTrendPoint(
                date=target_day.strftime("%b %d"),
                revenue=float(rev_val or 0),
                bills_count=int(bills_c or 0),
            )
        )

    # 4. Top diagnoses
    diag_rows = (
        db.query(Diagnosis.description, func.count(Diagnosis.id).label("cnt"))
        .group_by(Diagnosis.description)
        .order_by(func.count(Diagnosis.id).desc())
        .limit(6)
        .all()
    )
    top_diagnoses = [DiagnosisCount(diagnosis=desc, count=cnt) for desc, cnt in diag_rows]

    return AnalyticsResponse(
        stats=dashboard_stats,
        appointment_breakdown=appointment_breakdown,
        doctor_stats=doctor_stats_list,
        recent_revenue_trends=revenue_trends,
        top_diagnoses=top_diagnoses,
    )


@router.get("/operational", response_model=OperationalReportResponse)
def get_operational_report(
    period: str = Query("today"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get operational report aggregated directly from DB for given time period."""
    today = date.today()
    if period == "yesterday":
        start_date = today - timedelta(days=1)
        end_date = start_date
    elif period == "week":
        start_date = today - timedelta(days=today.weekday())
        end_date = today
    elif period == "month":
        start_date = today.replace(day=1)
        end_date = today
    else:  # today
        start_date = today
        end_date = today

    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = datetime.combine(end_date, datetime.max.time(), tzinfo=timezone.utc)

    # 1. Appointments in date range
    appts_q = db.query(Appointment).filter(
        Appointment.appointment_date >= start_date,
        Appointment.appointment_date <= end_date,
    )
    total_appointments = appts_q.count()
    completed_consultations = appts_q.filter(Appointment.status == "COMPLETED").count()
    waiting_appointments = appts_q.filter(Appointment.status.in_(["WAITING", "CHECKED_IN", "IN_CONSULTATION"])).count()

    # 2. Total Invoiced (bills created in period)
    invoiced_res = (
        db.query(func.coalesce(func.sum(Bill.total_amount), 0))
        .filter(Bill.created_at >= start_dt, Bill.created_at <= end_dt)
        .scalar()
    )
    total_invoiced = float(invoiced_res or 0)

    # 3. Total Collected (payments received in period)
    collected_res = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.payment_date >= start_dt, Payment.payment_date <= end_dt)
        .scalar()
    )
    total_collected = float(collected_res or 0)

    # 4. Total Pending balance
    pending_res = (
        db.query(func.coalesce(func.sum(Bill.balance_amount), 0))
        .filter(Bill.status != "PAID")
        .scalar()
    )
    total_pending = float(pending_res or 0)

    # 5. Method totals in period
    method_rows = (
        db.query(Payment.payment_method, func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.payment_date >= start_dt, Payment.payment_date <= end_dt)
        .group_by(Payment.payment_method)
        .all()
    )
    method_totals = {"Cash": 0.0, "UPI": 0.0, "Card": 0.0, "Other": 0.0}
    for m, val in method_rows:
        m_name = "Cash" if m == "CASH" else "UPI" if m == "UPI" else "Card" if m == "CARD" else "Other"
        method_totals[m_name] = method_totals.get(m_name, 0.0) + float(val or 0)

    # 6. Doctor-wise breakdown
    active_doctors = db.query(Doctor).filter(Doctor.is_active == True).all()  # noqa: E712
    doctor_stats = []
    for doc in active_doctors:
        doc_appts = db.query(Appointment).filter(
            Appointment.doctor_id == doc.id,
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_date,
        )
        total_visits = doc_appts.count()
        completed = doc_appts.filter(Appointment.status == "COMPLETED").count()

        doc_collections_res = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(
                Payment.received_by == doc.user_id,
                Payment.payment_date >= start_dt,
                Payment.payment_date <= end_dt,
            )
            .scalar()
        )
        collections = float(doc_collections_res or 0)
        if collections == 0:
            collections = float(completed * doc.consultation_fee)

        doctor_stats.append({
            "doctor": {
                "id": str(doc.id),
                "name": doc.user.full_name if doc.user else f"Doctor #{doc.id}",
                "specialization": doc.specialization,
                "room": doc.room,
                "consultationFee": float(doc.consultation_fee),
            },
            "totalVisits": total_visits,
            "completed": completed,
            "collections": collections,
        })

    return OperationalReportResponse(
        period=period,
        start_date=start_date.isoformat(),
        end_date=end_date.isoformat(),
        total_appointments=total_appointments,
        completed_consultations=completed_consultations,
        waiting_appointments=waiting_appointments,
        total_invoiced=total_invoiced,
        total_collected=total_collected,
        total_pending=total_pending,
        method_totals=method_totals,
        doctor_stats=doctor_stats,
    )


@router.get("/doctor", response_model=DoctorReportResponse)
def get_doctor_report(
    doctor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get doctor clinical throughput report directly from DB."""
    if doctor_id:
        doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    else:
        doc = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doc:
            doc = db.query(Doctor).filter(Doctor.is_active == True).first()  # noqa: E712

    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    total_consultations = db.query(Consultation).filter(Consultation.doctor_id == doc.id).count()
    appts = db.query(Appointment).filter(Appointment.doctor_id == doc.id)
    total_appts = appts.count()
    completed_appts = appts.filter(Appointment.status == "COMPLETED").count()
    completion_rate = int((completed_appts / total_appts * 100)) if total_appts > 0 else 100

    scheduled_follow_ups = db.query(FollowUp).filter(FollowUp.doctor_id == doc.id).count()

    collected_res = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.received_by == doc.user_id)
        .scalar()
    )
    total_collected = float(collected_res or 0)
    if total_collected == 0:
        total_collected = float(completed_appts * doc.consultation_fee)

    fu_count = appts.filter(Appointment.appointment_type.in_(["FOLLOW_UP", "REVIEW"])).count()
    new_count = appts.filter(Appointment.appointment_type == "CONSULTATION").count()
    walk_count = appts.filter(Appointment.appointment_type == "WALK_IN").count()

    case_distribution = [
        {"label": "Follow-up & Review", "count": fu_count, "color": "bg-emerald-500"},
        {"label": "New Clinical Consultations", "count": new_count, "color": "bg-[#F76762]"},
        {"label": "Walk-in Acute Intake", "count": walk_count, "color": "bg-amber-500"},
    ]

    return DoctorReportResponse(
        doctor_id=doc.id,
        doctor_name=doc.user.full_name if doc.user else f"Doctor #{doc.id}",
        doctor_code=doc.doctor_code,
        specialization=doc.specialization,
        room=doc.room,
        consultation_fee=float(doc.consultation_fee),
        schedule_start=doc.schedule_start or "09:00 AM",
        schedule_end=doc.schedule_end or "05:00 PM",
        slot_duration_mins=doc.slot_duration_mins or 20,
        total_consultations=total_consultations,
        total_appointments=total_appts,
        completed_appointments=completed_appts,
        completion_rate=completion_rate,
        scheduled_follow_ups=scheduled_follow_ups,
        total_collected=total_collected,
        case_distribution=case_distribution,
    )

