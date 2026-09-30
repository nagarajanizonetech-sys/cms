# app/models/__init__.py
# Import all models here so SQLAlchemy sees them for create_all / Alembic autogenerate

from app.models.role import Role  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.patient import Patient  # noqa: F401
from app.models.doctor import Doctor  # noqa: F401
from app.models.appointment import Appointment  # noqa: F401
from app.models.queue import QueueEntry  # noqa: F401
from app.models.vital import Vital  # noqa: F401
from app.models.consultation import Consultation  # noqa: F401
from app.models.symptom import Symptom  # noqa: F401
from app.models.diagnosis import Diagnosis  # noqa: F401
from app.models.prescription import Prescription, PrescriptionItem  # noqa: F401
from app.models.billing import Bill, BillItem  # noqa: F401
from app.models.payment import Payment  # noqa: F401
from app.models.follow_up import FollowUp  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
