from __future__ import annotations

from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_patients: int
    appointments_today: int
    waiting_in_queue: int
    completed_consultations_today: int
    revenue_today: float
    pending_bills_amount: float
    active_doctors: int


class DoctorStats(BaseModel):
    doctor_id: int
    doctor_name: str
    specialization: str
    patients_seen_today: int
    waiting_in_queue: int
    total_appointments_today: int


class RevenueTrendPoint(BaseModel):
    date: str
    revenue: float
    bills_count: int


class AppointmentStatusBreakdown(BaseModel):
    status: str
    count: int


class DiagnosisCount(BaseModel):
    diagnosis: str
    count: int


class AnalyticsResponse(BaseModel):
    stats: DashboardStats
    appointment_breakdown: List[AppointmentStatusBreakdown]
    doctor_stats: List[DoctorStats]
    recent_revenue_trends: List[RevenueTrendPoint]
    top_diagnoses: List[DiagnosisCount]


class OperationalReportResponse(BaseModel):
    period: str
    start_date: str
    end_date: str
    total_appointments: int
    completed_consultations: int
    waiting_appointments: int
    total_invoiced: float
    total_collected: float
    total_pending: float
    method_totals: Dict[str, float]
    doctor_stats: List[Dict[str, Any]]


class DoctorReportResponse(BaseModel):
    doctor_id: int
    doctor_name: str
    doctor_code: str
    specialization: str
    room: str
    consultation_fee: float
    schedule_start: str
    schedule_end: str
    slot_duration_mins: int
    total_consultations: int
    total_appointments: int
    completed_appointments: int
    completion_rate: int
    scheduled_follow_ups: int
    total_collected: float
    case_distribution: List[Dict[str, Any]]

