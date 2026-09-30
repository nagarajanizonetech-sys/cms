# AuraCMS — Clinical Management System (HMS)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)

**AuraCMS** is a production-grade, full-stack Hospital & Clinical Management System designed specifically for outpatient polyclinics, private medical practices, and multi-specialty clinics. Built with a modern **React 19 + TypeScript + Vite** frontend and a robust **FastAPI + PostgreSQL + SQLAlchemy 2.x** backend.

---

## 🏥 Clinical Workspaces & Core Features

### 🩺 Doctor Workstation
* **Live Patient Queue & Triage**: Real-time waiting list with priority escalation (`Normal`, `Urgent`, `Emergency`) and 1-click **Call Next Patient** audio/visual alerts.
* **Clinical Consultation Workspace**:
  * Chief complaints, clinical findings, physical examinations, and doctor notes.
  * Structured symptom tracking with severity ratings and duration.
  * Clinical & ICD diagnoses categorised as *Primary*, *Secondary*, or *Provisional*.
* **Digital Prescription Engine (Rx)**: Standardized prescription issuance specifying drug name, strength, dosage, route, frequency, duration, and food/lifestyle instructions with printable A4 formatting.
* **Patient History & Vitals Timeline**: Complete medical records, longitudinal vitals charts (BP, Pulse, SpO2, Temperature, Respiratory Rate, and automated BMI).
* **Clinical Follow-ups**: Direct scheduling of patient revisits and follow-up consultation tracking.

### 📋 Reception Desk & Front-Office
* **Patient Directory & Automated UHID**: Master patient index with unique, zero-collision UHID generation (`UHID-YYYY-XXXX`).
* **Appointment Scheduling**: Dual-mode calendar and slot-list scheduling with doctor availability filters.
* **Live Patient Check-in & Routing**: Immediate triage queue assignment with token generation (`A-001`, `B-002`).
* **Point-of-Sale Billing & Invoicing**: Itemized clinical service charges, consultation fee billing, automated discounts/tax calculations, and support for multiple payment channels (Cash, UPI, Card, Net Banking).
* **Reception Metrics**: Real-time lounge counters, waiting times, and operational KPIs.

### 🔐 Security & Access Control (RBAC)
* **Granular Role-Based Access Control**: Strict privilege separation for `ADMIN`, `RECEPTIONIST`, `DOCTOR`, `NURSE`, and `PHARMACIST`.
* **JWT Authentication**: Secure Bearer tokens with access/refresh cycles and Passlib bcrypt password hashing.
* **Audit Trails**: Automated audit logging of clinical encounters, prescription updates, and billing operations.

---

## 🏗️ Monorepo Architecture

```
HMS-Clinic-main/
├── backend/                      # FastAPI Python Application
│   ├── alembic/                  # Database schema migrations
│   ├── app/
│   │   ├── api/v1/               # Modular REST endpoints (auth, patients, appointments, billing, etc.)
│   │   ├── core/                 # Config, database connection, JWT & security helpers
│   │   ├── models/               # SQLAlchemy 2.x relational ORM models
│   │   ├── schemas/              # Pydantic v2 data transfer schemas
│   │   ├── seed.py               # Database seeder with demo data
│   │   └── main.py               # FastAPI application entrypoint
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Backend container definition
│   └── run.py                    # Server runner script
│
├── frontend/                     # React 19 + TypeScript + Vite Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── doctor/           # Doctor portal views, queues, prescriptions, workspace
│   │   │   └── reception/        # Reception views, billing, registration, calendar
│   │   ├── context/              # Reception & Doctor state management
│   │   ├── services/             # Axios/Fetch API client integrations
│   │   └── types/                # TypeScript interfaces and domain models
│   ├── package.json              # Frontend scripts and dependencies
│   └── vite.config.ts            # Vite build configuration
│
├── docker-compose.yml            # Multi-container orchestration (PostgreSQL + Backend)
├── .gitignore                    # Root repository ignore rules
└── README.md                     # Project documentation
```

---

## ⚡ Quick Start

### Option A: Docker Compose (Recommended)

Run PostgreSQL, automated schema migrations, database seeding, and the FastAPI backend with a single command:

```bash
docker-compose up -d
```

Then start the frontend development server:

```bash
cd frontend
npm install
npm run dev
```

Access the applications:
* **Frontend Portal**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:8000](http://localhost:8000)
* **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### Option B: Local Manual Setup

#### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run database migrations & seed baseline data
alembic upgrade head
python -m app.seed

# Start FastAPI server
python run.py
# Or with uvicorn directly:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will run at [http://localhost:3000](http://localhost:3000).

---

## 🔑 Demo Staff Credentials

The database seeder pre-populates the system with realistic clinical staff accounts:

| Role | Name | Email | Password | Primary Workspace |
|---|---|---|---|---|
| **Admin** | Clinic Administrator | `admin@auracms.com` | `admin123` | Full System & Audit Access |
| **Receptionist** | Front Desk Lead | `reception@auracms.com` | `reception123` | Patient Registration & Billing |
| **Doctor (Cardiology)** | Dr. Sarah Jenkins | `doctor.sarah@auracms.com` | `doctor123` | Doctor Consultation Desk |
| **Doctor (Pediatrics)** | Dr. Marcus Chen | `doctor.marcus@auracms.com` | `doctor123` | Doctor Consultation Desk |
| **Doctor (General Med)** | Dr. Elena Rostova | `doctor.elena@auracms.com` | `doctor123` | Doctor Consultation Desk |
| **Nurse** | Clinical Nurse | `nurse@auracms.com` | `nurse123` | Vitals Entry & Triage Prep |
| **Pharmacist** | Lead Pharmacist | `pharma@auracms.com` | `pharma123` | Prescription & Dispensary |

*(For quick UI testing, the shorthand password `123` is also supported)*.

---

## 📡 REST API Overview

All backend endpoints are versioned under `/api/v1`:

| Router | Path Prefix | Highlights |
|---|---|---|
| **Auth** | `/api/v1/auth` | JWT login, token refresh, current user profile |
| **Patients** | `/api/v1/patients` | Search by UHID/phone, registration, medical background |
| **Appointments** | `/api/v1/appointments` | Scheduling, rescheduling, check-in, cancellations |
| **Live Queue** | `/api/v1/queue` | Real-time queue tokens, priority management, `call-next` |
| **Vitals** | `/api/v1/vitals` | Blood pressure, pulse, SpO2, temperature, BMI calculation |
| **Consultations** | `/api/v1/consultations` | Clinical examination, SOAP notes, symptoms, ICD diagnoses |
| **Prescriptions** | `/api/v1/prescriptions` | Digital prescription generation, printable A4 sheets |
| **Billing** | `/api/v1/billing` | Invoicing, payments (Cash, UPI, Card), receipts |
| **Follow-ups** | `/api/v1/follow-ups` | Revisit scheduling and reminders |
| **Reports** | `/api/v1/reports` | Daily revenues, patient counts, top diagnoses |
| **Audit Logs** | `/api/v1/audit-logs` | Compliance and action logging |

---

## 🛠️ Tech Stack Details

* **Frontend**:
  * [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
  * [Vite 8](https://vitejs.dev/) with React plugin
  * [Tailwind CSS 4](https://tailwindcss.com/)
  * [Lucide Icons](https://lucide.dev/)
  * [Motion](https://motion.dev/)
* **Backend**:
  * [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous ASGI framework)
  * [SQLAlchemy 2.x](https://www.sqlalchemy.org/) (Async-capable ORM)
  * [PostgreSQL 16](https://www.postgresql.org/) & [Alembic](https://alembic.sqlalchemy.org/)
  * [Pydantic v2](https://docs.pydantic.dev/) (Data validation)
  * [Passlib](https://passlib.readthedocs.io/) & [python-jose](https://python-jose.readthedocs.io/) (Security)
* **DevOps**:
  * Docker & Docker Compose
