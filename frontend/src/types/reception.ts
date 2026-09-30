export type Role = 'RECEPTIONIST' | 'DOCTOR' | 'PHARMACIST' | 'ADMIN';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface Patient {
  id: string;
  uhid: string; // e.g. "AUR-2026-0042"
  firstName?: string;
  lastName?: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  age: number;
  mobile: string;
  email?: string;
  bloodGroup?: string;
  address?: string;
  city?: string;
  emergencyContact: EmergencyContact;
  allergies?: string;
  medicalConditions?: string;
  registeredAt: string;
  lastVisit?: string;
}

export type DoctorStatus = 'Available' | 'In Consultation' | 'Not Available' | 'On Leave';

export interface DoctorSchedule {
  days: string[];
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "01:00 PM"
  slotDurationMins: number;
}

export interface Doctor {
  id: string;
  name: string;
  email?: string;
  code: string; // e.g. "A" or "B"
  specialization: string;
  room: string;
  status: DoctorStatus;
  schedule: DoctorSchedule;
  currentQueueToken?: string;
  waitingCount: number;
  consultationFee: number;
}

export type AppointmentType = 'New Consultation' | 'Follow-up' | 'Review' | 'Walk-in';

export type AppointmentStatus = 
  | 'Scheduled' 
  | 'Checked-in' 
  | 'Waiting' 
  | 'In Consultation' 
  | 'Completed' 
  | 'Cancelled' 
  | 'No-show';

export interface Appointment {
  id: string;
  token?: string; // e.g. "A-014"
  patientId: string;
  patientName: string;
  patientUhid: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  checkedInAt?: string;
  notes?: string;
}

export interface QueueItem {
  id: string;
  token: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  doctorId: string;
  doctorName: string;
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Skipped';
  assignedAt: string;
  calledAt?: string;
  priority?: 'Normal' | 'Urgent';
}

export type ClinicServiceName = 
  | 'Consultation' 
  | 'Injection' 
  | 'Dressing' 
  | 'Nebulization' 
  | 'ECG' 
  | 'IV Fluid' 
  | 'Suture Removal' 
  | 'Other Service';

export interface ServiceChargeItem {
  id: string;
  serviceName: string;
  amount: number;
  originalAmount: number;
  category?: string;
  notes?: string;
}

export type BillStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Refunded';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Other';

export interface PaymentRecord {
  id: string;
  receiptNumber: string; // e.g. "REC-2026-0881"
  billId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  collectedBy: 'Receptionist' | 'Doctor';
  collectorName: string;
  paidAt: string;
  note?: string;
}

export interface Bill {
  id: string;
  billNumber: string; // e.g. "INV-2026-0104"
  patientId: string;
  patientName: string;
  patientUhid: string;
  appointmentId?: string;
  charges: ServiceChargeItem[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  notes?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: BillStatus;
  createdBy: 'Doctor' | 'Reception';
  createdByName: string;
  createdAt: string;
  payments: PaymentRecord[];
}

export interface ClinicNotification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'queue' | 'payment' | 'doctor' | 'alert';
  timestamp: string;
  read: boolean;
  linkRoute?: string;
}

export type TimelineEventType =
  | 'Patient Registered'
  | 'Appointment Booked'
  | 'Checked-in'
  | 'In Consultation'
  | 'Consultation Completed'
  | 'Payment Received'
  | 'Prescription Created'
  | 'Follow-up Scheduled'
  | 'Fee Charged';

export interface PatientTimelineEvent {
  id: string;
  patientId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: string;
  actorName: string;
}
