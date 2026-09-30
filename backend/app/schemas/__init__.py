# app/schemas/__init__.py

from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, MeResponse
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse, RoleResponse
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientListResponse
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorResponse, DoctorListResponse
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse, AppointmentListResponse
from app.schemas.queue import QueueEntryCreate, QueueStatusUpdate, QueuePriorityUpdate, QueueEntryResponse, QueueListResponse
from app.schemas.vital import VitalCreate, VitalUpdate, VitalResponse, VitalListResponse
from app.schemas.consultation import (
    SymptomCreate, SymptomResponse,
    DiagnosisCreate, DiagnosisResponse,
    ConsultationCreate, ConsultationUpdate, ConsultationResponse
)
from app.schemas.prescription import (
    PrescriptionItemCreate, PrescriptionItemResponse,
    PrescriptionCreate, PrescriptionUpdate, PrescriptionResponse, PrescriptionListResponse
)
from app.schemas.billing import (
    BillItemCreate, BillItemResponse,
    PaymentCreate, PaymentResponse,
    BillCreate, BillUpdate, BillResponse, BillListResponse
)
from app.schemas.follow_up import FollowUpCreate, FollowUpUpdate, FollowUpResponse, FollowUpListResponse
from app.schemas.notification import NotificationCreate, NotificationResponse, NotificationListResponse
from app.schemas.report import AnalyticsResponse, DashboardStats, DoctorStats, RevenueTrendPoint
from app.schemas.audit_log import AuditLogResponse, AuditLogListResponse
