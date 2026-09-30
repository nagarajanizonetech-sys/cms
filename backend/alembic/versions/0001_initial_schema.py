"""Initial clinical schema migration

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. roles
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # 2. users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    # 3. doctors
    op.create_table(
        "doctors",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("doctor_code", sa.String(length=10), nullable=False),
        sa.Column("specialization", sa.String(length=200), nullable=False),
        sa.Column("department", sa.String(length=200), nullable=True),
        sa.Column("room", sa.String(length=100), nullable=True),
        sa.Column("consultation_fee", sa.Numeric(precision=10, scale=2), server_default="0", nullable=False),
        sa.Column("schedule_days", sa.Text(), nullable=True),
        sa.Column("schedule_start", sa.String(length=10), nullable=True),
        sa.Column("schedule_end", sa.String(length=10), nullable=True),
        sa.Column("slot_duration_mins", sa.Integer(), server_default="15", nullable=False),
        sa.Column("status", sa.String(length=30), server_default="Available", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("doctor_code"),
        sa.UniqueConstraint("user_id"),
    )

    # 4. patients
    op.create_table(
        "patients",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uhid", sa.String(length=30), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("gender", sa.String(length=10), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("blood_group", sa.String(length=10), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("emergency_contact_name", sa.String(length=200), nullable=True),
        sa.Column("emergency_contact_phone", sa.String(length=30), nullable=True),
        sa.Column("emergency_contact_relationship", sa.String(length=50), nullable=True),
        sa.Column("allergies", sa.Text(), nullable=True),
        sa.Column("medical_conditions", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_patients_uhid", "patients", ["uhid"], unique=True)
    op.create_index("ix_patients_phone", "patients", ["phone"], unique=False)

    # 5. appointments
    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("appointment_date", sa.Date(), nullable=False),
        sa.Column("appointment_time", sa.String(length=10), nullable=False),
        sa.Column("appointment_type", sa.String(length=20), server_default="CONSULTATION", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="SCHEDULED", nullable=False),
        sa.Column("token_number", sa.String(length=20), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"]),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_appointments_date", "appointments", ["appointment_date"])
    op.create_index("ix_appointments_doctor", "appointments", ["doctor_id"])
    op.create_index("ix_appointments_patient", "appointments", ["patient_id"])

    # 6. queue_entries
    op.create_table(
        "queue_entries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("appointment_id", sa.Integer(), nullable=True),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("queue_date", sa.Date(), nullable=False),
        sa.Column("token_number", sa.String(length=20), nullable=False),
        sa.Column("priority", sa.String(length=20), server_default="NORMAL", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="WAITING", nullable=False),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("called_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("engaged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"]),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"]),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_queue_entries_date", "queue_entries", ["queue_date"])

    # 7. vitals
    op.create_table(
        "vitals",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("appointment_id", sa.Integer(), nullable=True),
        sa.Column("recorded_by", sa.Integer(), nullable=True),
        sa.Column("height", sa.Float(), nullable=True),
        sa.Column("weight", sa.Float(), nullable=True),
        sa.Column("bmi", sa.Float(), nullable=True),
        sa.Column("blood_pressure_systolic", sa.Float(), nullable=True),
        sa.Column("blood_pressure_diastolic", sa.Float(), nullable=True),
        sa.Column("pulse", sa.Float(), nullable=True),
        sa.Column("spo2", sa.Float(), nullable=True),
        sa.Column("temperature", sa.Float(), nullable=True),
        sa.Column("respiratory_rate", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"]),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"]),
        sa.ForeignKeyConstraint(["recorded_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # 8. consultations
    op.create_table(
        "consultations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("appointment_id", sa.Integer(), nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("chief_complaint", sa.Text(), nullable=True),
        sa.Column("clinical_notes", sa.Text(), nullable=True),
        sa.Column("examination_notes", sa.Text(), nullable=True),
        sa.Column("treatment_advice", sa.Text(), nullable=True),
        sa.Column("doctor_notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="IN_PROGRESS", nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"]),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"]),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("appointment_id"),
    )

    # 9. symptoms
    op.create_table(
        "symptoms",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("consultation_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("duration", sa.String(length=100), nullable=True),
        sa.Column("severity", sa.String(length=50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["consultation_id"], ["consultations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # 10. diagnoses
    op.create_table(
        "diagnoses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("consultation_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=True),
        sa.Column("description", sa.String(length=300), nullable=False),
        sa.Column("diagnosis_type", sa.String(length=50), server_default="PRIMARY", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["consultation_id"], ["consultations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # 11. prescriptions & prescription_items
    op.create_table(
        "prescriptions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("rx_number", sa.String(length=30), nullable=False),
        sa.Column("consultation_id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="CREATED", nullable=False),
        sa.Column("general_advice", sa.Text(), nullable=True),
        sa.Column("diet_and_lifestyle", sa.Text(), nullable=True),
        sa.Column("follow_up_date", sa.String(length=20), nullable=True),
        sa.Column("follow_up_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["consultation_id"], ["consultations.id"]),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"]),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("rx_number"),
    )

    op.create_table(
        "prescription_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("prescription_id", sa.Integer(), nullable=False),
        sa.Column("medicine_name", sa.String(length=300), nullable=False),
        sa.Column("strength", sa.String(length=100), nullable=True),
        sa.Column("dosage", sa.String(length=100), nullable=True),
        sa.Column("frequency", sa.String(length=100), nullable=True),
        sa.Column("duration", sa.String(length=100), nullable=True),
        sa.Column("route", sa.String(length=50), nullable=True),
        sa.Column("timing", sa.String(length=100), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=True),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["prescription_id"], ["prescriptions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # 12. bills & bill_items
    op.create_table(
        "bills",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("bill_number", sa.String(length=30), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("appointment_id", sa.Integer(), nullable=True),
        sa.Column("subtotal", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("discount", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("tax", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("total", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("paid_amount", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("balance_amount", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="PENDING", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("appointment_id"),
        sa.UniqueConstraint("bill_number"),
    )

    op.create_table(
        "bill_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("bill_id", sa.Integer(), nullable=False),
        sa.Column("service_name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("quantity", sa.Integer(), server_default="1", nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("total", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.ForeignKeyConstraint(["bill_id"], ["bills.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # 13. payments
    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("bill_id", sa.Integer(), nullable=False),
        sa.Column("receipt_number", sa.String(length=30), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("payment_method", sa.String(length=20), nullable=False),
        sa.Column("transaction_reference", sa.String(length=200), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("received_by", sa.Integer(), nullable=True),
        sa.Column("payment_date", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["bill_id"], ["bills.id"]),
        sa.ForeignKeyConstraint(["received_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("receipt_number"),
    )

    # 14. follow_ups
    op.create_table(
        "follow_ups",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("consultation_id", sa.Integer(), nullable=True),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("follow_up_date", sa.String(length=20), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="SCHEDULED", nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["consultation_id"], ["consultations.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"]),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # 15. notifications
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("type", sa.String(length=30), server_default="INFO", nullable=False),
        sa.Column("is_read", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("link_route", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # 16. audit_logs
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("old_data", sa.Text(), nullable=True),
        sa.Column("new_data", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(length=60), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("notifications")
    op.drop_table("follow_ups")
    op.drop_table("payments")
    op.drop_table("bill_items")
    op.drop_table("bills")
    op.drop_table("prescription_items")
    op.drop_table("prescriptions")
    op.drop_table("diagnoses")
    op.drop_table("symptoms")
    op.drop_table("consultations")
    op.drop_table("vitals")
    op.drop_table("queue_entries")
    op.drop_table("appointments")
    op.drop_table("patients")
    op.drop_table("doctors")
    op.drop_table("users")
    op.drop_table("roles")
