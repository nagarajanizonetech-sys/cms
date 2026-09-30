"""
Database Seed Script for AuraCMS Clinical Management System
Populates default roles, users, doctors, patients, appointments, queue, vitals,
consultations, prescriptions, billing, and notifications.
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone

from app.core.database import SessionLocal, create_all_tables
from app.core.security import hash_password
from app.models.appointment import Appointment
from app.models.billing import Bill, BillItem
from app.models.consultation import Consultation
from app.models.diagnosis import Diagnosis
from app.models.doctor import Doctor
from app.models.follow_up import FollowUp
from app.models.notification import Notification
from app.models.patient import Patient
from app.models.payment import Payment
from app.models.prescription import Prescription, PrescriptionItem
from app.models.queue import QueueEntry
from app.models.role import Role
from app.models.symptom import Symptom
from app.models.user import User
from app.models.vital import Vital

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")


def seed_database():
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

        # ── 2. Users ────────────────────────────────────────────────────────
        users_data = [
            (
                "admin",
                "admin@auracms.com",
                "admin123",
                "System Administrator",
                "+1-555-0100",
                "ADMIN",
            ),
            (
                "receptionist",
                "reception@auracms.com",
                "reception123",
                "Rachel Green",
                "+1-555-0101",
                "RECEPTIONIST",
            ),
            (
                "dr.sarah",
                "doctor.sarah@auracms.com",
                "doctor123",
                "Dr. Sarah Jenkins",
                "+1-555-0102",
                "DOCTOR",
            ),
            (
                "dr.marcus",
                "doctor.marcus@auracms.com",
                "doctor123",
                "Dr. Marcus Chen",
                "+1-555-0103",
                "DOCTOR",
            ),
            (
                "dr.elena",
                "doctor.elena@auracms.com",
                "doctor123",
                "Dr. Elena Rostova",
                "+1-555-0104",
                "DOCTOR",
            ),
            (
                "nurse",
                "nurse@auracms.com",
                "nurse123",
                "Emily Clark, RN",
                "+1-555-0105",
                "NURSE",
            ),
            (
                "pharmacist",
                "pharma@auracms.com",
                "pharma123",
                "David Kim, PharmD",
                "+1-555-0106",
                "PHARMACIST",
            ),
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

        # ── 3. Doctors ──────────────────────────────────────────────────────
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

        # ── 4. Patients ─────────────────────────────────────────────────────
        patients_data = [
            (
                "UHID-2026-0001",
                "James",
                "Wilson",
                "Male",
                date(1985, 4, 12),
                "+1-555-0201",
                "james.wilson@example.com",
                "O+",
                "124 Elm Street, Apt 4B",
                "Springfield",
                "Sarah Wilson",
                "+1-555-0202",
                "Spouse",
                "Penicillin",
                "Hypertension",
            ),
            (
                "UHID-2026-0002",
                "Maya",
                "Patel",
                "Female",
                date(1992, 9, 23),
                "+1-555-0203",
                "maya.patel@example.com",
                "A+",
                "45 Maple Avenue",
                "Springfield",
                "Raj Patel",
                "+1-555-0204",
                "Brother",
                "Sulfa drugs",
                "Asthma",
            ),
            (
                "UHID-2026-0003",
                "Robert",
                "Johnson",
                "Male",
                date(1978, 11, 5),
                "+1-555-0205",
                "robert.j@example.com",
                "B+",
                "789 Oak Lane",
                "Springfield",
                "Linda Johnson",
                "+1-555-0206",
                "Spouse",
                "None",
                "Type 2 Diabetes, Hyperlipidemia",
            ),
            (
                "UHID-2026-0004",
                "Emily",
                "Davis",
                "Female",
                date(2001, 2, 18),
                "+1-555-0207",
                "emily.d@example.com",
                "AB+",
                "321 Pine Road",
                "Springfield",
                "Karen Davis",
                "+1-555-0208",
                "Mother",
                "Latex",
                "None",
            ),
            (
                "UHID-2026-0005",
                "Liam",
                "Smith",
                "Male",
                date(2018, 6, 14),
                "+1-555-0209",
                "parent.smith@example.com",
                "O-",
                "56 Birch Street",
                "Springfield",
                "Jessica Smith",
                "+1-555-0210",
                "Mother",
                "Peanuts",
                "Seasonal allergies",
            ),
        ]
        patients_by_uhid = {}
        admin_user = users_by_email["admin@auracms.com"]
        for uhid, fn, ln, gen, dob, ph, em, bg, addr, city, ec_n, ec_p, ec_r, allg, cond in patients_data:
            p = db.query(Patient).filter(Patient.uhid == uhid).first()
            if not p:
                p = Patient(
                    uhid=uhid,
                    first_name=fn,
                    last_name=ln,
                    gender=gen,
                    date_of_birth=dob,
                    phone=ph,
                    email=em,
                    blood_group=bg,
                    address=addr,
                    city=city,
                    emergency_contact_name=ec_n,
                    emergency_contact_phone=ec_p,
                    emergency_contact_relationship=ec_r,
                    allergies=allg,
                    medical_conditions=cond,
                    created_by=admin_user.id,
                )
                db.add(p)
                db.flush()
                logger.info("Created patient: %s (%s %s)", uhid, fn, ln)
            patients_by_uhid[uhid] = p

        # ── 5. Appointments for Today ───────────────────────────────────────
        today = date.today()
        now = datetime.now(timezone.utc)
        doc1 = doctors_by_code["DOC-001"]
        doc2 = doctors_by_code["DOC-002"]
        doc3 = doctors_by_code["DOC-003"]

        p1 = patients_by_uhid["UHID-2026-0001"]
        p2 = patients_by_uhid["UHID-2026-0002"]
        p3 = patients_by_uhid["UHID-2026-0003"]
        p4 = patients_by_uhid["UHID-2026-0004"]
        p5 = patients_by_uhid["UHID-2026-0005"]

        appts_data = [
            (p1.id, doc1.id, today, "09:30", "CONSULTATION", "COMPLETED", "T-01", "Routine cardiac checkup"),
            (p2.id, doc3.id, today, "10:15", "CONSULTATION", "IN_CONSULTATION", "T-01", "Persistent dry cough"),
            (p3.id, doc1.id, today, "11:00", "FOLLOW_UP", "CHECKED_IN", "T-02", "BP medication evaluation"),
            (p4.id, doc3.id, today, "11:30", "WALK_IN", "CHECKED_IN", "T-02", "Migraine and dizziness"),
            (p5.id, doc2.id, today, "14:00", "CONSULTATION", "SCHEDULED", "T-01", "Annual pediatric wellness check"),
        ]

        created_appts = []
        for pat_id, doc_id, adate, atime, atype, astatus, atok, areason in appts_data:
            existing = (
                db.query(Appointment)
                .filter(
                    Appointment.patient_id == pat_id,
                    Appointment.doctor_id == doc_id,
                    Appointment.appointment_date == adate,
                )
                .first()
            )
            if not existing:
                appt = Appointment(
                    patient_id=pat_id,
                    doctor_id=doc_id,
                    appointment_date=adate,
                    appointment_time=atime,
                    appointment_type=atype,
                    status=astatus,
                    token_number=atok,
                    reason=areason,
                    created_by=admin_user.id,
                    checked_in_at=now if astatus in ["CHECKED_IN", "IN_CONSULTATION", "COMPLETED"] else None,
                )
                db.add(appt)
                db.flush()
                created_appts.append(appt)
            else:
                created_appts.append(existing)

        # ── 6. Queue Entries for Today ──────────────────────────────────────
        queue_data = [
            (created_appts[0], "NORMAL", "COMPLETED"),
            (created_appts[1], "URGENT", "ENGAGED"),
            (created_appts[2], "NORMAL", "WAITING"),
            (created_appts[3], "NORMAL", "WAITING"),
        ]
        for appt_obj, prio, qstatus in queue_data:
            q_exists = db.query(QueueEntry).filter(QueueEntry.appointment_id == appt_obj.id).first()
            if not q_exists:
                q = QueueEntry(
                    appointment_id=appt_obj.id,
                    patient_id=appt_obj.patient_id,
                    doctor_id=appt_obj.doctor_id,
                    queue_date=today,
                    token_number=appt_obj.token_number or "T-01",
                    priority=prio,
                    status=qstatus,
                    checked_in_at=now,
                    called_at=now if qstatus in ["ENGAGED", "COMPLETED"] else None,
                    engaged_at=now if qstatus in ["ENGAGED", "COMPLETED"] else None,
                    completed_at=now if qstatus == "COMPLETED" else None,
                )
                db.add(q)
                db.flush()

        # ── 7. Vitals ───────────────────────────────────────────────────────
        vitals_data = [
            (p1.id, created_appts[0].id, 178.0, 82.5, 26.0, 138.0, 88.0, 74.0, 98.0, 36.8, 16.0),
            (p2.id, created_appts[1].id, 162.0, 58.0, 22.1, 118.0, 76.0, 82.0, 97.0, 37.4, 18.0),
            (p3.id, created_appts[2].id, 175.0, 91.0, 29.7, 142.0, 92.0, 78.0, 98.0, 36.6, 16.0),
        ]
        for pid, aid, h, w, bmi, sys, dia, pulse, spo2, temp, rr in vitals_data:
            if not db.query(Vital).filter(Vital.patient_id == pid, Vital.appointment_id == aid).first():
                v = Vital(
                    patient_id=pid,
                    appointment_id=aid,
                    recorded_by=users_by_email["nurse@auracms.com"].id,
                    height=h,
                    weight=w,
                    bmi=bmi,
                    blood_pressure_systolic=sys,
                    blood_pressure_diastolic=dia,
                    pulse=pulse,
                    spo2=spo2,
                    temperature=temp,
                    respiratory_rate=rr,
                )
                db.add(v)
                db.flush()

        # ── 8. Consultation + Symptoms + Diagnosis ──────────────────────────
        c1_appt = created_appts[0]
        c1 = db.query(Consultation).filter(Consultation.appointment_id == c1_appt.id).first()
        if not c1:
            c1 = Consultation(
                patient_id=c1_appt.patient_id,
                appointment_id=c1_appt.id,
                doctor_id=c1_appt.doctor_id,
                chief_complaint="Occasional chest tightness and shortness of breath during exertion",
                clinical_notes="Patient reports mild palpitations over the past 3 weeks. No dizziness or syncope.",
                examination_notes="Heart sounds S1 S2 regular. No murmurs. Lungs clear to auscultation bilaterally.",
                treatment_advice="Reduce dietary sodium, engage in 30 mins light cardio daily, and start prescribed beta blocker.",
                doctor_notes="Schedule 3-week follow-up for 24-hr Holter review.",
                status="COMPLETED",
                completed_at=now,
            )
            db.add(c1)
            db.flush()

            db.add(Symptom(consultation_id=c1.id, name="Chest tightness", duration="3 weeks", severity="Moderate"))
            db.add(Symptom(consultation_id=c1.id, name="Exertional dyspnea", duration="2 weeks", severity="Mild"))
            db.add(Diagnosis(consultation_id=c1.id, code="I10", description="Essential Hypertension", diagnosis_type="PRIMARY"))
            db.flush()

        # ── 9. Prescription ─────────────────────────────────────────────────
        if c1 and not db.query(Prescription).filter(Prescription.consultation_id == c1.id).first():
            rx1 = Prescription(
                rx_number=f"RX-{today.strftime('%Y%m%d')}-00101",
                consultation_id=c1.id,
                patient_id=c1.patient_id,
                doctor_id=c1.doctor_id,
                status="CREATED",
                general_advice="Avoid excess salt and caffeine. Monitor blood pressure daily in morning.",
                diet_and_lifestyle="DASH diet, 30 min brisk walk 5 times a week.",
                follow_up_date=(today + timedelta(days=21)).strftime("%Y-%m-%d"),
                follow_up_notes="Bring BP tracking log for review.",
            )
            db.add(rx1)
            db.flush()

            items = [
                PrescriptionItem(
                    prescription_id=rx1.id,
                    medicine_name="Amlodipine Besylate",
                    strength="5 mg",
                    dosage="1 tablet",
                    frequency="Once daily",
                    duration="30 days",
                    route="Oral",
                    timing="Morning with water",
                    quantity=30,
                    instructions="Take at the same time each morning.",
                ),
                PrescriptionItem(
                    prescription_id=rx1.id,
                    medicine_name="Atorvastatin",
                    strength="10 mg",
                    dosage="1 tablet",
                    frequency="Once daily",
                    duration="30 days",
                    route="Oral",
                    timing="Bedtime",
                    quantity=30,
                    instructions="Take after dinner.",
                ),
            ]
            for it in items:
                db.add(it)
            db.flush()

        # ── 10. Billing and Payments ────────────────────────────────────────
        if c1_appt and not db.query(Bill).filter(Bill.appointment_id == c1_appt.id).first():
            bill1 = Bill(
                bill_number=f"INV-{today.strftime('%Y%m%d')}-00101",
                patient_id=c1_appt.patient_id,
                appointment_id=c1_appt.id,
                subtotal=115.00,
                discount=10.00,
                tax=0.00,
                total=105.00,
                paid_amount=105.00,
                balance_amount=0.00,
                status="PAID",
                notes="Cardiology consultation + 12-lead ECG",
                created_by=users_by_email["reception@auracms.com"].id,
            )
            db.add(bill1)
            db.flush()

            db.add(BillItem(bill_id=bill1.id, service_name="Specialist Consultation - Cardiology", quantity=1, unit_price=75.00, total=75.00))
            db.add(BillItem(bill_id=bill1.id, service_name="12-Lead Electrocardiogram (ECG)", quantity=1, unit_price=40.00, total=40.00))
            db.flush()

            pmt1 = Payment(
                bill_id=bill1.id,
                receipt_number=f"REC-{today.strftime('%Y%m%d')}-00101",
                amount=105.00,
                payment_method="CARD",
                transaction_reference="TXN-984210",
                note="Paid in full via Visa debit card",
                received_by=users_by_email["reception@auracms.com"].id,
            )
            db.add(pmt1)
            db.flush()

        # Also create a pending bill for patient 3
        if not db.query(Bill).filter(Bill.patient_id == p3.id).first():
            bill2 = Bill(
                bill_number=f"INV-{today.strftime('%Y%m%d')}-00102",
                patient_id=p3.id,
                appointment_id=created_appts[2].id,
                subtotal=75.00,
                discount=0.00,
                tax=0.00,
                total=75.00,
                paid_amount=0.00,
                balance_amount=75.00,
                status="PENDING",
                notes="Consultation fee pending",
                created_by=users_by_email["reception@auracms.com"].id,
            )
            db.add(bill2)
            db.flush()
            db.add(BillItem(bill_id=bill2.id, service_name="Consultation Fee", quantity=1, unit_price=75.00, total=75.00))
            db.flush()

        # ── 11. Follow-up ───────────────────────────────────────────────────
        if not db.query(FollowUp).filter(FollowUp.patient_id == p1.id).first():
            fu = FollowUp(
                patient_id=p1.id,
                consultation_id=c1.id if c1 else None,
                doctor_id=doc1.id,
                follow_up_date=(today + timedelta(days=21)).strftime("%Y-%m-%d"),
                notes="Cardiac review and blood pressure medication tolerance check.",
                status="SCHEDULED",
                created_by=users_by_email["doctor.sarah@auracms.com"].id,
            )
            db.add(fu)
            db.flush()

        # ── 12. Notifications ───────────────────────────────────────────────
        notifications = [
            (
                admin_user.id,
                "System Initialized",
                "AuraCMS clinical backend database seeded successfully.",
                "SUCCESS",
                "/reports",
            ),
            (
                users_by_email["doctor.sarah@auracms.com"].id,
                "New Patient Checked In",
                "Robert Johnson (UHID-2026-0003) is waiting in Room 102 queue.",
                "QUEUE",
                "/queue",
            ),
            (
                users_by_email["reception@auracms.com"].id,
                "Payment Received",
                "Invoice INV-20260926-00101 was paid in full (₹105.00).",
                "PAYMENT",
                "/billing",
            ),
        ]
        for uid, title, msg, ntype, route in notifications:
            if not db.query(Notification).filter(Notification.user_id == uid, Notification.title == title).first():
                db.add(
                    Notification(
                        user_id=uid,
                        title=title,
                        message=msg,
                        type=ntype,
                        link_route=route,
                        is_read=False,
                    )
                )

        db.commit()
        logger.info("✅ Database successfully seeded with initial clinical data!")

    except Exception as e:
        db.rollback()
        logger.error("❌ Seeding failed: %s", e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    if "--minimal" in sys.argv or "-m" in sys.argv:
        from app.seed_minimal import seed_minimal
        seed_minimal()
    else:
        seed_database()
