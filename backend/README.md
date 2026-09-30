# AuraCMS - Production FastAPI + PostgreSQL Clinical Management Backend

A production-grade, modular RESTful backend for **AuraCMS Clinical Management System**, built with **Python 3.10+**, **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.x**, **Alembic**, and **Pydantic v2**.

---

## 🏗️ Architecture & Features

- **FastAPI Core**: High performance, asynchronous request handling, automated OpenAPI 3.0 / Swagger documentation.
- **PostgreSQL + SQLAlchemy 2.x**: Strongly-typed Mapped columns, relational cascades, automated table initialization, and connection pooling.
- **Alembic Migrations**: Full database versioning with reproducible forward and backward migrations.
- **JWT Authentication & RBAC**: Secure bcrypt password hashing, access and refresh token flows, and granular Role-Based Access Control (`ADMIN`, `RECEPTIONIST`, `DOCTOR`, `NURSE`, `PHARMACIST`).
- **Complete Clinical Lifecycle**:
  - **Patients**: Master patient index, auto-generated UHID, demographics, medical background, and full patient history.
  - **Appointments**: Scheduling, token generation, slot checks, check-ins, reschedules, and cancellations.
  - **Live Queue**: Real-time triage status (`WAITING`, `ENGAGED`, `COMPLETED`, `NO_SHOW`), priority escalation (`NORMAL`, `URGENT`, `EMERGENCY`), and `call-next` doctor queue management.
  - **Vitals**: Automated BMI calculations, systolic/diastolic blood pressure, pulse, SpO2, temperature, and respiration tracking.
  - **Consultations**: Structured SOAP/clinical notes, chief complaint, symptoms with severity, and ICD/clinical diagnoses.
  - **Prescriptions**: Rx generation, medication dosage, route, frequency, duration, quantity, and dietary instructions.
  - **Billing & Payments**: Itemized invoices, automated taxes/discounts, partial/full payment tracking, and receipt generation.
  - **Follow-ups & Notifications**: Scheduled clinical revisits and in-app staff alerts.
  - **Analytics & Audit Logs**: Real-time reception and doctor KPI counters, revenue trends, top diagnoses, and compliance audit trail.

---

## 📁 Project Structure

```
backend/
├── alembic/                      # Database migrations
│   ├── versions/
│   │   └── 0001_initial_schema.py # Initial baseline migration
│   ├── env.py
│   └── script.py.mako
├── app/
│   ├── api/
│   │   └── v1/                   # API v1 Modular Routers
│   │       ├── __init__.py       # Router aggregator
│   │       ├── appointments.py   # Appointments booking, check-in, cancel
│   │       ├── audit_logs.py     # Compliance & activity logs
│   │       ├── auth.py           # JWT login, refresh, profile
│   │       ├── billing.py        # Bills, items, receipts, payments
│   │       ├── consultations.py  # Clinical sessions, symptoms, diagnoses
│   │       ├── doctors.py        # Profiles, fees, schedule, queues
│   │       ├── follow_ups.py     # Follow-up appointment scheduling
│   │       ├── notifications.py  # User notifications
│   │       ├── patients.py       # Patient registry, UHID, medical history
│   │       ├── prescriptions.py  # Rx and medication management
│   │       ├── queue.py          # Real-time queue, triage, call-next
│   │       ├── reports.py        # Dashboard stats, KPI metrics, charts
│   │       ├── users.py          # User management & roles
│   │       └── vitals.py         # Vital signs & BMI tracking
│   ├── core/
│   │   ├── config.py             # Pydantic Settings & environment variables
│   │   ├── database.py           # SQLAlchemy 2.x engine & session factory
│   │   ├── dependencies.py       # JWT verification & RBAC decorators
│   │   └── security.py           # Passlib bcrypt & JWT utilities
│   ├── models/                   # SQLAlchemy 2.x ORM models (16 tables)
│   ├── schemas/                  # Pydantic v2 validation models
│   ├── main.py                   # FastAPI app entry point & lifespan
│   └── seed.py                   # Database seeder with realistic test data
├── .env.example                  # Environment configuration template
├── .env                          # Local environment variables
├── alembic.ini                   # Alembic configuration
├── requirements.txt              # Production dependencies
└── run.py                        # Server launch script
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+** installed
- **PostgreSQL** running locally or on a remote host (or SQLite for quick zero-config local testing)

### 2. Environment Setup

Create and activate a virtual environment:
```bash
# Windows
cd backend
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
cd backend
python3 -m venv venv
source venv/bin/activate
```

Install the dependencies:
```bash
pip install -r requirements.txt
```

### 3. Database Configuration

Copy `.env.example` to `.env` (or modify `.env`):
```ini
APP_NAME=AuraCMS - Clinical Management System
ENVIRONMENT=development

# PostgreSQL connection string
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/clinical_management

# JWT settings
JWT_SECRET_KEY=change-this-to-a-long-random-secret-key-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Allowed CORS origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

LOG_LEVEL=INFO
```

> **Note for SQLite (zero-config fallback):**
> If you don't have PostgreSQL installed, set `DATABASE_URL=sqlite:///./clinical_management.db` in `.env`.

### 4. Database Migration & Seeding

Run Alembic migration:
```bash
alembic upgrade head
```

Seed the database with realistic clinical staff, doctors, patients, appointments, queue entries, vitals, prescriptions, and invoices:
```bash
python -m app.seed
```

### 5. Running the Backend Server

Start the FastAPI application with Uvicorn:
```bash
python run.py
```
Or directly with uvicorn:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The server will be available at:
- **API Base URL**: `http://localhost:8000/api/v1`
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **Alternative ReDoc UI**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

---

## 🔑 Pre-Seeded Default Accounts

The seed script creates the following staff accounts:

| Role | Email | Password | Full Name | Notes |
|---|---|---|---|---|
| **ADMIN** | `admin@auracms.com` | `admin123` | System Administrator | Full access to users, audit logs, clinic settings |
| **RECEPTIONIST** | `reception@auracms.com` | `reception123` | Rachel Green | Intake, appointments, queue, billing |
| **DOCTOR** | `doctor.sarah@auracms.com` | `doctor123` | Dr. Sarah Jenkins | Cardiology, Room 102 |
| **DOCTOR** | `doctor.marcus@auracms.com` | `doctor123` | Dr. Marcus Chen | Pediatrics, Room 105 |
| **DOCTOR** | `doctor.elena@auracms.com` | `doctor123` | Dr. Elena Rostova | General Medicine, Room 101 |
| **NURSE** | `nurse@auracms.com` | `nurse123` | Emily Clark, RN | Vitals entry, queue triage |
| **PHARMACIST** | `pharma@auracms.com` | `pharma123` | David Kim, PharmD | Rx fulfillment & dispensing |

---

## 📡 API Endpoints Overview

### Authentication (`/api/v1/auth`)
- `POST /login` - Sign in with email and password, returns access and refresh JWTs
- `POST /refresh` - Renew access token with refresh token
- `GET /me` - Get current user profile and role

### Users (`/api/v1/users`)
- `GET /` - List all users with search and role filters
- `POST /` - Register user (Admin only)
- `GET /{id}` - Get user details
- `PUT /{id}` - Update user profile / role / password
- `DELETE /{id}` - Deactivate user
- `GET /roles/list` - List available system roles

### Patients (`/api/v1/patients`)
- `GET /` - Search patients by name, phone, or UHID
- `POST /` - Register patient (auto-generates unique `UHID-YYYY-XXXX`)
- `GET /{id}` - View patient demographics and medical summary
- `PUT /{id}` - Update patient records
- `DELETE /{id}` - Soft delete / deactivate patient
- `GET /{id}/history` - Comprehensive history (consultations, vitals, prescriptions, bills)

### Doctors (`/api/v1/doctors`)
- `GET /` - List active doctors, filter by specialization or status
- `GET /{id}` - Get doctor details, schedule, room, fees
- `PUT /{id}` - Update doctor profile
- `PUT /{id}/status` - Update operational status (`Available`, `In Consultation`, `On Leave`)
- `GET /{id}/queue` - Get live queue for doctor

### Appointments (`/api/v1/appointments`)
- `GET /` - List appointments with filters for date, doctor, patient, status
- `POST /` - Book new appointment (auto-generates doctor daily token `T-01`, `T-02`)
- `GET /{id}` - Get appointment details
- `PUT /{id}` - Update appointment details or status
- `POST /{id}/check-in` - Check in patient; automatically queues them for consultation
- `POST /{id}/cancel` - Cancel appointment and remove from queue

### Queue (`/api/v1/queue`)
- `GET /` - Live queue entries by date, doctor, and status
- `POST /` - Add walk-in patient directly to queue
- `POST /check-in` - Check in appointment to queue
- `PUT /{id}/status` - Update queue status (`WAITING`, `ENGAGED`, `COMPLETED`, `NO_SHOW`)
- `PUT /{id}/priority` - Triage priority (`NORMAL`, `URGENT`, `EMERGENCY`)
- `POST /call-next/{doctor_id}` - Auto-call next waiting patient for doctor

### Vitals (`/api/v1/vitals`)
- `GET /patient/{patient_id}` - Get historical vitals for a patient
- `POST /` - Record vitals (BP, pulse, SpO2, temp, auto-calculates BMI from height/weight)
- `GET /{id}` - Get single vital sign record

### Consultations (`/api/v1/consultations`)
- `GET /` - List consultations with doctor/patient filters
- `POST /` - Start consultation session with symptoms & diagnoses
- `GET /{id}` - Get full consultation record
- `PUT /{id}` - Update notes, symptoms, diagnoses
- `POST /{id}/complete` - Complete consultation; cascades completion to appointment and queue

### Prescriptions (`/api/v1/prescriptions`)
- `GET /` - List prescriptions
- `POST /` - Create prescription with itemized medications (`RX-YYYYMMDD-XXXX`)
- `GET /{id}` - Get prescription with items
- `PUT /{id}` - Update prescription status (`CREATED`, `PRINTED`, `DISPENSED`, `CANCELLED`)

### Billing & Payments (`/api/v1/billing`)
- `GET /` - List bills and invoices
- `POST /` - Generate invoice with line items (`INV-YYYYMMDD-XXXX`)
- `GET /{id}` - Get bill with items and payment history
- `POST /{id}/payments` - Record payment (`CASH`, `UPI`, `CARD`), generate receipt (`REC-YYYYMMDD-XXXX`), auto-recalculate balance
- `GET /payments/all` - List recent payments

### Reports & Analytics (`/api/v1/reports`)
- `GET /dashboard` - Real-time clinic KPIs (total patients, appointments today, queue count, revenue today, pending balances)
- `GET /analytics` - Graphs data (appointment status breakdown, doctor workloads, 7-day revenue trend, top diagnoses)

### Audit Logs (`/api/v1/audit-logs`)
- `GET /` - System activity logs (Admin only) for compliance and security
