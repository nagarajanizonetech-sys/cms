from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.patients import router as patients_router
from app.api.v1.doctors import router as doctors_router
from app.api.v1.appointments import router as appointments_router
from app.api.v1.queue import router as queue_router
from app.api.v1.vitals import router as vitals_router
from app.api.v1.consultations import router as consultations_router
from app.api.v1.prescriptions import router as prescriptions_router
from app.api.v1.billing import router as billing_router
from app.api.v1.follow_ups import router as follow_ups_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.reports import router as reports_router
from app.api.v1.audit_logs import router as audit_logs_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(users_router)
router.include_router(patients_router)
router.include_router(doctors_router)
router.include_router(appointments_router)
router.include_router(queue_router)
router.include_router(vitals_router)
router.include_router(consultations_router)
router.include_router(prescriptions_router)
router.include_router(billing_router)
router.include_router(follow_ups_router)
router.include_router(notifications_router)
router.include_router(reports_router)
router.include_router(audit_logs_router)
