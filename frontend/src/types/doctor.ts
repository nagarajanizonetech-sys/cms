import { PaymentMethod, ServiceChargeItem } from './reception';

export interface Vitals {
  height?: number; // cm
  weight?: number; // kg
  bmi?: number;
  bloodPressureSystolic?: number; // mmHg
  bloodPressureDiastolic?: number; // mmHg
  pulse?: number; // bpm
  spO2?: number; // %
  temperature?: number; // °C
  respiratoryRate?: number; // breaths/min
}

export interface SymptomItem {
  id: string;
  name: string;
  duration?: string; // e.g. "3 days", "1 week"
  severity?: 'Mild' | 'Moderate' | 'Severe';
  notes?: string;
}

export interface DiagnosisItem {
  id: string;
  code?: string;
  description: string;
  type: 'Primary' | 'Secondary' | 'Provisional';
  notes?: string;
}

export interface PrescriptionMedicine {
  id: string;
  name: string;
  strength: string; // e.g. "500 mg", "10 mg"
  dosage: string; // e.g. "1 tablet", "5 ml"
  frequency: string; // e.g. "1-0-1", "0-0-1", "1-1-1", "Once daily"
  duration: string; // e.g. "5 days", "10 days"
  route: string; // e.g. "Oral", "Topical", "Inhalation"
  timing: string; // e.g. "After food", "Before food", "At bedtime"
  quantity: number;
  instructions: string;
}

export interface Prescription {
  id: string;
  rxNumber: string; // e.g. "RX-2026-0814"
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorRoom: string;
  date: string; // YYYY-MM-DD
  diagnoses: string[];
  medicines: PrescriptionMedicine[];
  generalAdvice?: string;
  dietAndLifestyle?: string;
  followUpDate?: string;
  followUpNotes?: string;
  status: 'Created' | 'Printed' | 'Dispensed' | 'Cancelled';
  createdAt: string;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  doctorId: string;
  doctorName: string;
  date: string;
  startedAt: string;
  completedAt?: string;
  status: 'Draft' | 'In Progress' | 'Completed';
  vitals: Vitals;
  chiefComplaint: string;
  symptoms: SymptomItem[];
  physicalExamination: string;
  diagnoses: DiagnosisItem[];
  clinicalFindings: string;
  doctorNotes: string;
  treatmentAdvice: string;
  prescriptionId?: string;
  prescription?: Prescription;
  charges: ServiceChargeItem[];
  followUpRequired: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  collectedAtConsultation?: boolean;
  paymentMethod?: PaymentMethod;
  paymentAmount?: number;
}

export interface FollowUpRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  scheduledDate: string;
  reason: string;
  status: 'Scheduled' | 'Completed' | 'Overdue' | 'Cancelled';
  consultationId?: string;
  createdAt: string;
}
