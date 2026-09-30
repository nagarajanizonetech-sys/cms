"""
Minimal Database Seed Script for AuraCMS
Seeds ONLY the essential system foundation:
- Roles (ADMIN, RECEPTIONIST, DOCTOR, NURSE, PHARMACIST)
- Staff User Accounts
- Doctor Profiles

Leaves all clinical data (Patients, Appointments, Queue, Vitals,
Consultations, Prescriptions, Invoices, Payments) 100% EMPTY
so you can test the entire clinic workflow from scratch!
"""
from __future__ import annotations

import logging
from app.core.database import SessionLocal, create_all_tables
from app.core.security import hash_password
from app.models.doctor import Doctor
from app.models.role import Role
from app.models.user import User

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
            ("NURSE", "Nurse: vitals recording, patient preparation, and triage"),
            ("PHARMACIST", "Pharmacist: prescription viewing and medication dispensing"),
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

        # ── 2. Staff Users ──────────────────────────────────────────────────
        users_data = [
            ("admin", "admin@auracms.com", "admin123", "System Administrator", "+1-555-0100", "ADMIN"),
            ("receptionist", "reception@auracms.com", "reception123", "Rachel Green", "+1-555-0101", "RECEPTIONIST"),
            ("dr.sarah", "doctor.sarah@auracms.com", "doctor123", "Dr. Sarah Jenkins", "+1-555-0102", "DOCTOR"),
            ("dr.marcus", "doctor.marcus@auracms.com", "doctor123", "Dr. Marcus Chen", "+1-555-0103", "DOCTOR"),
            ("dr.elena", "doctor.elena@auracms.com", "doctor123", "Dr. Elena Rostova", "+1-555-0104", "DOCTOR"),
            ("nurse", "nurse@auracms.com", "nurse123", "Emily Clark, RN", "+1-555-0105", "NURSE"),
            ("pharmacist", "pharma@auracms.com", "pharma123", "David Kim, PharmD", "+1-555-0106", "PHARMACIST"),
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

        # ── 3. Doctor Profiles ──────────────────────────────────────────────
        doctors_data = [
            (
                "doctor.sarah@auracms.com",
                "DOC-001",
                "Cardiology",
                "Cardiovascular Health",
                "Room 102",
                75.00,
                '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
                "09:00",
                "17:00",
                20,
                "Available",
            ),
            (
                "doctor.marcus@auracms.com",
                "DOC-002",
                "Pediatrics",
                "Child Care",
                "Room 105",
                60.00,
                '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
                "09:00",
                "16:00",
                15,
                "Available",
            ),
            (
                "doctor.elena@auracms.com",
                "DOC-003",
                "General Medicine",
                "Internal Medicine",
                "Room 101",
                50.00,
                '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]',
                "08:30",
                "17:30",
                15,
                "Available",
            ),
        ]
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

        db.commit()
        logger.info("=" * 60)
        logger.info("✨ Minimal seed complete!")
        logger.info("✨ Only Roles, Staff Accounts, and Doctor Profiles created.")
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
