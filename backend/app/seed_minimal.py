"""
Minimal Database Seed Script for AuraCMS
Seeds ONLY the essential system foundation:
- Roles (ADMIN, RECEPTIONIST, DOCTOR)
- Staff User Accounts (Admin, 1 Receptionist, 1 Doctor)
- Doctor Profile (1 Doctor: Dr. Sarah Jenkins)

Leaves all clinical data (Patients, Appointments, Queue, Vitals,
Consultations, Prescriptions, Invoices, Payments) 100% EMPTY
so you can test the entire clinic workflow from scratch!
"""
from __future__ import annotations

import logging
from app.core.database import SessionLocal, create_all_tables
from app.core.security import hash_password
from app.models.appointment import Appointment
from app.models.billing import Bill
from app.models.consultation import Consultation
from app.models.doctor import Doctor
from app.models.follow_up import FollowUp
from app.models.notification import Notification
from app.models.payment import Payment
from app.models.queue import QueueEntry
from app.models.role import Role
from app.models.user import User
from app.models.vital import Vital

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_minimal")


def seed_minimal():
    logger.info("Initializing database tables...")
    create_all_tables()
    db = SessionLocal()

    try:
        # ── 1. Roles ────────────────────────────────────────────────────────
        roles_data = [
            ("ADMIN", "System administrator with full access"),
            ("RECEPTIONIST", "Receptionist: patient intake, appointments, queue, and billing"),
            ("DOCTOR", "Doctor: clinical consultations, diagnoses, and prescriptions"),
        ]
        roles_by_name = {}
        for name, desc in roles_data:
            role = db.query(Role).filter(Role.name == name).first()
            if not role:
                role = Role(name=name, description=desc)
                db.add(role)
                db.flush()
                logger.info("Created role: %s", name)
            roles_by_name[name] = role

        # ── 2. Staff Users (Admin, 1 Receptionist, 1 Doctor) ────────────────
        users_data = [
            ("admin", "admin@auracms.com", "admin123", "System Administrator", "+1-555-0100", "ADMIN"),
            ("receptionist", "reception@auracms.com", "reception123", "Rachel Green", "+1-555-0101", "RECEPTIONIST"),
            ("dr.sarah", "doctor.sarah@auracms.com", "doctor123", "Dr. Sarah Jenkins", "+1-555-0102", "DOCTOR"),
        ]
        users_by_email = {}
        for username, email, pwd, name, phone, role_name in users_data:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    username=username,
                    email=email,
                    password_hash=hash_password(pwd),
                    full_name=name,
                    phone=phone,
                    role_id=roles_by_name[role_name].id,
                    is_active=True,
                )
                db.add(user)
                db.flush()
                logger.info("Created user: %s (%s)", email, role_name)
            users_by_email[email] = user

        reception_user = users_by_email["reception@auracms.com"]

        # ── 3. Doctor Profile (1 Doctor: Dr. Sarah Jenkins) ─────────────────
        doctors_data = [
            (
                "doctor.sarah@auracms.com",
                "DOC-001",
                "Cardiology & General Medicine",
                "Cardiovascular Health",
                "Room 102",
                75.00,
                '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
                "09:00",
                "17:00",
                20,
                "Available",
            ),
        ]
        doctors_by_code = {}
        for email, code, spec, dept, room, fee, days, start, end, dur, st in doctors_data:
            user = users_by_email[email]
            doc = db.query(Doctor).filter(Doctor.doctor_code == code).first()
            if not doc:
                doc = Doctor(
                    user_id=user.id,
                    doctor_code=code,
                    specialization=spec,
                    department=dept,
                    room=room,
                    consultation_fee=fee,
                    schedule_days=days,
                    schedule_start=start,
                    schedule_end=end,
                    slot_duration_mins=dur,
                    status=st,
                    is_active=True,
                )
                db.add(doc)
                db.flush()
                logger.info("Created doctor: %s (%s)", code, spec)
            doctors_by_code[code] = doc

        doc1 = doctors_by_code["DOC-001"]

        # ── Clean up legacy extra doctors and extra staff users ──────────────
        legacy_doctor_codes = ["DOC-002", "DOC-003"]
        legacy_emails = [
            "doctor.marcus@auracms.com",
            "doctor.elena@auracms.com",
            "nurse@auracms.com",
            "pharma@auracms.com",
        ]

        extra_docs = db.query(Doctor).filter(Doctor.doctor_code.in_(legacy_doctor_codes)).all()
        for ed in extra_docs:
            db.query(Appointment).filter(Appointment.doctor_id == ed.id).update({Appointment.doctor_id: doc1.id})
            db.query(QueueEntry).filter(QueueEntry.doctor_id == ed.id).update({QueueEntry.doctor_id: doc1.id})
            db.query(Consultation).filter(Consultation.doctor_id == ed.id).update({Consultation.doctor_id: doc1.id})
            db.query(FollowUp).filter(FollowUp.doctor_id == ed.id).update({FollowUp.doctor_id: doc1.id})
            db.delete(ed)
        if extra_docs:
            db.flush()

        extra_users = db.query(User).filter(User.email.in_(legacy_emails)).all()
        for eu in extra_users:
            db.query(Vital).filter(Vital.recorded_by == eu.id).update({Vital.recorded_by: reception_user.id})
            db.query(Bill).filter(Bill.created_by == eu.id).update({Bill.created_by: reception_user.id})
            db.query(Payment).filter(Payment.received_by == eu.id).update({Payment.received_by: reception_user.id})
            db.query(Notification).filter(Notification.user_id == eu.id).delete()
            db.delete(eu)
        if extra_users:
            db.flush()

        db.commit()
        logger.info("=" * 60)
        logger.info("✨ Minimal seed complete!")
        logger.info("✨ Only Roles, Staff Accounts (Admin, Reception, Doctor), and 1 Doctor Profile created.")
        logger.info("✨ Zero Patients, Zero Appointments, Zero Bills.")
        logger.info("✨ Ready for fresh end-to-end testing from scratch!")
        logger.info("=" * 60)

    except Exception as e:
        db.rollback()
        logger.error("❌ Seeding failed: %s", e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_minimal()
