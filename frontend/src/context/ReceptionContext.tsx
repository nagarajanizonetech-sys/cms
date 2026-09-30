import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { realtimeSocket } from '../services/websocket';
import { 
  Patient, 
  Doctor, 
  Appointment, 
  QueueItem, 
  Bill, 
  BillStatus,
  PaymentRecord, 
  ClinicNotification, 
  PatientTimelineEvent,
  PaymentMethod,
  ServiceChargeItem,
  DoctorStatus
} from '../types/reception';
import {
  Consultation,
  Prescription,
  FollowUpRecord,
} from '../types/doctor';

// Helper to get today's date in YYYY-MM-DD
const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TODAY = getTodayDate();



// ─────────────────────────────────────────────────────────────────────────────
// BACKEND DATA MAPPERS
// ─────────────────────────────────────────────────────────────────────────────

function mapBackendDoctor(d: any): Doctor {
  let days: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  if (d.schedule_days) {
    try {
      days = typeof d.schedule_days === 'string' ? JSON.parse(d.schedule_days) : d.schedule_days;
    } catch {
      // ignore
    }
  }

  return {
    id: String(d.id),
    name: d.full_name || 'Dr. Attending Doctor',
    email: d.email || '',
    code: d.doctor_code || `DOC-${d.id}`,
    specialization: d.specialization || 'Clinical Medicine',
    room: d.room || 'Consultation Room',
    status: (d.status as DoctorStatus) || 'Available',
    schedule: {
      days: Array.isArray(days) ? days : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: d.schedule_start || '09:00 AM',
      endTime: d.schedule_end || '05:00 PM',
      slotDurationMins: d.slot_duration_mins || 20,
    },
    waitingCount: 0,
    consultationFee: typeof d.consultation_fee === 'number' ? d.consultation_fee : parseFloat(d.consultation_fee || '50'),
  };
}

function cleanPatientName(name?: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed === '.') return '';
  return trimmed.replace(/\s+\.$/, '').replace(/^\.\s+/, '').trim();
}

function mapBackendPatient(p: any): Patient {
  const birthYear = p.date_of_birth ? new Date(p.date_of_birth).getFullYear() : 1990;
  const currentYear = new Date().getFullYear();
  const calculatedAge = currentYear - birthYear;

  const rawLast = (p.last_name === '.' || !p.last_name) ? '' : p.last_name.trim();
  const rawFirst = (p.first_name || '').trim();
  const computedFullName = cleanPatientName(p.full_name) || `${rawFirst} ${rawLast}`.trim();

  return {
    id: String(p.id),
    uhid: p.uhid || `AUR-${p.id}`,
    firstName: rawFirst,
    lastName: rawLast,
    fullName: computedFullName || rawFirst || 'Unknown',
    gender: (p.gender as any) || 'Other',
    dob: p.date_of_birth ? String(p.date_of_birth) : '1990-01-01',
    age: calculatedAge > 0 ? calculatedAge : 30,
    mobile: p.phone || '',
    email: p.email || '',
    bloodGroup: p.blood_group || '',
    address: p.address || '',
    city: p.city || '',
    emergencyContact: {
      name: p.emergency_contact_name || 'N/A',
      phone: p.emergency_contact_phone || p.phone || '',
      relationship: p.emergency_contact_relationship || 'Contact',
    },
    allergies: p.allergies || 'None reported',
    medicalConditions: p.medical_conditions || 'None reported',
    registeredAt: p.created_at ? p.created_at.split('T')[0] : TODAY,
    lastVisit: p.updated_at ? p.updated_at.split('T')[0] : TODAY,
  };
}

function mapBackendAppointment(a: any): Appointment {
  const typeMap: Record<string, any> = {
    CONSULTATION: 'New Consultation',
    FOLLOW_UP: 'Follow-up',
    REVIEW: 'Review',
    WALK_IN: 'Walk-in',
  };
  const statusMap: Record<string, any> = {
    SCHEDULED: 'Scheduled',
    CHECKED_IN: 'Waiting',
    IN_CONSULTATION: 'In Consultation',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No-show',
  };

  return {
    id: String(a.id),
    token: a.token_number || undefined,
    patientId: String(a.patient_id),
    patientName: cleanPatientName(a.patient_name),
    patientUhid: a.patient_uhid || '',
    patientPhone: a.patient_phone || '',
    doctorId: String(a.doctor_id),
    doctorName: a.doctor_name || '',
    date: a.appointment_date ? String(a.appointment_date) : TODAY,
    time: a.appointment_time || '09:00',
    type: typeMap[a.appointment_type] || a.appointment_type || 'New Consultation',
    status: statusMap[a.status] || a.status || 'Scheduled',
    reason: a.reason || '',
    checkedInAt: a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    notes: a.notes || '',
  };
}

function mapBackendQueue(q: any): QueueItem {
  const statusMap: Record<string, any> = {
    WAITING: 'Waiting',
    ENGAGED: 'In Consultation',
    COMPLETED: 'Completed',
    NO_SHOW: 'Skipped',
    SKIPPED: 'Skipped',
  };

  return {
    id: String(q.id),
    token: q.token_number || '',
    appointmentId: q.appointment_id ? String(q.appointment_id) : '',
    patientId: String(q.patient_id),
    patientName: cleanPatientName(q.patient_name),
    patientUhid: q.patient_uhid || '',
    doctorId: String(q.doctor_id),
    doctorName: q.doctor_name || '',
    status: statusMap[q.status] || q.status || 'Waiting',
    assignedAt: q.check_in_time ? new Date(q.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
    calledAt: q.called_time ? new Date(q.called_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    priority: q.priority === 'URGENT' || q.priority === 'EMERGENCY' ? 'Urgent' : 'Normal',
  };
}

function mapBackendBill(b: any): Bill {
  const charges: ServiceChargeItem[] = (b.items || []).map((it: any) => ({
    id: String(it.id),
    serviceName: it.service_name || 'Consultation',
    amount: Number(it.total || it.unit_price || 0),
    originalAmount: Number(it.unit_price || 0),
    notes: it.description || '',
  }));

  const payments: PaymentRecord[] = (b.payments || []).map((pay: any) => {
    const isDoc = (pay.note && pay.note.toLowerCase().includes('doctor')) || 
                  (pay.receiver_name && (pay.receiver_name.toLowerCase().includes('dr') || pay.receiver_name.toLowerCase().includes('doctor')));
    return {
      id: String(pay.id),
      receiptNumber: pay.receipt_number || '',
      billId: String(b.id),
      amount: Number(pay.amount || 0),
      paymentMethod: (pay.payment_method === 'CASH' ? 'Cash' : pay.payment_method === 'UPI' ? 'UPI' : pay.payment_method === 'CARD' ? 'Card' : 'Other') as PaymentMethod,
      collectedBy: isDoc ? 'Doctor' : 'Receptionist',
      collectorName: pay.receiver_name || (isDoc ? 'Attending Doctor' : 'Reception Desk'),
      paidAt: pay.payment_date ? new Date(pay.payment_date).toLocaleString() : '',
      note: pay.note || '',
    };
  });

  const statusMap: Record<string, any> = {
    PENDING: 'Pending',
    PARTIALLY_PAID: 'Partially Paid',
    PAID: 'Paid',
    REFUNDED: 'Refunded',
    CANCELLED: 'Pending',
  };

  return {
    id: String(b.id),
    billNumber: b.bill_number || `INV-${b.id}`,
    patientId: String(b.patient_id),
    patientName: cleanPatientName(b.patient_name),
    patientUhid: b.patient_uhid || '',
    appointmentId: b.appointment_id ? String(b.appointment_id) : undefined,
    charges: charges.length > 0 ? charges : [
      {
        id: `ch-${b.id}`,
        serviceName: 'Consultation',
        amount: Number(b.total || 0),
        originalAmount: Number(b.total || 0),
        notes: b.notes || 'Clinical Services',
      }
    ],
    subtotal: Number(b.subtotal !== undefined ? b.subtotal : (b.total || 0)),
    discount: Number(b.discount || 0),
    tax: Number(b.tax || 0),
    notes: b.notes || '',
    totalAmount: Number(b.total || 0),
    paidAmount: Number(b.paid_amount || 0),
    balanceAmount: Number(b.balance_amount || 0),
    status: statusMap[b.status] || 'Pending',
    createdBy: 'Reception',
    createdByName: b.creator_name || 'Reception Desk',
    createdAt: b.created_at ? new Date(b.created_at).toLocaleString() : '',
    payments,
  };
}

function mapBackendConsultation(c: any): Consultation {
  const statusMap: Record<string, any> = {
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    DRAFT: 'Draft',
  };

  return {
    id: String(c.id),
    appointmentId: c.appointment_id ? String(c.appointment_id) : '',
    patientId: String(c.patient_id),
    patientName: cleanPatientName(c.patient_name),
    patientUhid: c.patient_uhid || '',
    doctorId: String(c.doctor_id),
    doctorName: c.doctor_name || '',
    date: c.created_at ? c.created_at.split('T')[0] : TODAY,
    startedAt: c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    completedAt: c.completed_at ? new Date(c.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    status: statusMap[c.status] || 'In Progress',
    vitals: c.vitals ? {
      height: c.vitals.height,
      weight: c.vitals.weight,
      bmi: c.vitals.bmi,
      bloodPressureSystolic: c.vitals.blood_pressure_systolic,
      bloodPressureDiastolic: c.vitals.blood_pressure_diastolic,
      pulse: c.vitals.pulse,
      spO2: c.vitals.spo2,
      temperature: c.vitals.temperature,
      respiratoryRate: c.vitals.respiratory_rate,
    } : (c.appointment?.vitals && c.appointment.vitals.length > 0 ? {
      height: c.appointment.vitals[0].height,
      weight: c.appointment.vitals[0].weight,
      bmi: c.appointment.vitals[0].bmi,
      bloodPressureSystolic: c.appointment.vitals[0].blood_pressure_systolic,
      bloodPressureDiastolic: c.appointment.vitals[0].blood_pressure_diastolic,
      pulse: c.appointment.vitals[0].pulse,
      spO2: c.appointment.vitals[0].spo2,
      temperature: c.appointment.vitals[0].temperature,
      respiratoryRate: c.appointment.vitals[0].respiratory_rate,
    } : {}),
    chiefComplaint: c.chief_complaint || '',
    symptoms: (() => {
      const seen = new Set<string>();
      return (c.symptoms || []).filter((s: any) => {
        const key = (s.name || '').trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map((s: any) => ({
        id: String(s.id),
        name: s.name,
        duration: s.duration || '',
        severity: s.severity || 'Mild',
        notes: s.notes || '',
      }));
    })(),
    physicalExamination: c.examination_notes || '',
    diagnoses: (() => {
      const seen = new Set<string>();
      return (c.diagnoses || []).filter((d: any) => {
        const key = (d.description || '').trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map((d: any) => ({
        id: String(d.id),
        code: d.code || '',
        description: d.description || '',
        type: d.diagnosis_type || 'Primary',
        notes: d.notes || '',
      }));
    })(),
    clinicalFindings: c.clinical_notes || '',
    doctorNotes: c.doctor_notes || '',
    treatmentAdvice: c.treatment_advice || '',
    charges: (c.charges || []).map((ch: any) => ({
      id: String(ch.id),
      serviceName: ch.service_name || ch.serviceName || 'Consultation',
      amount: Number(ch.amount || ch.total || ch.unit_price || 0),
      originalAmount: Number(ch.original_amount || ch.originalAmount || ch.unit_price || ch.amount || 0),
      notes: ch.notes || ch.description || '',
    })),
    followUpRequired: false,
  };
}

function mapBackendPrescription(p: any): Prescription {
  return {
    id: String(p.id),
    rxNumber: p.rx_number || `RX-${p.id}`,
    appointmentId: p.appointment_id ? String(p.appointment_id) : '',
    patientId: String(p.patient_id),
    patientName: cleanPatientName(p.patient_name),
    patientUhid: p.patient_uhid || '',
    patientAge: 35,
    patientGender: 'Adult',
    patientPhone: '',
    doctorId: String(p.doctor_id),
    doctorName: p.doctor_name || '',
    doctorSpecialization: 'Clinical Consultation',
    doctorRoom: 'Consultation Room',
    date: p.created_at ? p.created_at.split('T')[0] : TODAY,
    diagnoses: [],
    medicines: (p.items || []).map((m: any) => ({
      id: String(m.id),
      name: m.medicine_name || '',
      strength: m.dosage || '',
      dosage: m.dosage || '',
      frequency: m.frequency || '1-0-1',
      duration: m.duration || '5 days',
      route: m.route || 'Oral',
      timing: m.timing || 'After food',
      quantity: m.quantity || 1,
      instructions: m.instructions || '',
    })),
    generalAdvice: p.general_advice || '',
    dietAndLifestyle: p.diet_and_lifestyle || '',
    followUpDate: p.follow_up_date || undefined,
    followUpNotes: p.follow_up_notes || undefined,
    status: p.status === 'DISPENSED' ? 'Dispensed' : 'Created',
    createdAt: p.created_at ? new Date(p.created_at).toLocaleString() : '',
  };
}

function mapBackendFollowUp(f: any): FollowUpRecord {
  return {
    id: String(f.id),
    patientId: String(f.patient_id),
    patientName: cleanPatientName(f.patient_name),
    patientUhid: f.patient_uhid || '',
    patientPhone: f.patient_phone || '',
    doctorId: String(f.doctor_id),
    doctorName: f.doctor_name || '',
    scheduledDate: f.follow_up_date || TODAY,
    reason: f.notes || 'Routine follow-up consultation',
    status: f.status === 'COMPLETED' ? 'Completed' : 'Scheduled',
    consultationId: f.consultation_id ? String(f.consultation_id) : undefined,
    createdAt: f.created_at ? new Date(f.created_at).toLocaleString() : TODAY,
  };
}

function mapBackendNotification(n: any): ClinicNotification {
  const typeMap: Record<string, any> = {
    INFO: 'appointment',
    SUCCESS: 'payment',
    WARNING: 'queue',
    URGENT: 'alert',
    APPOINTMENT: 'appointment',
    QUEUE: 'queue',
    PAYMENT: 'payment',
    DOCTOR: 'doctor',
    ALERT: 'alert',
  };

  const rawType = String(n.type || '').toUpperCase();

  return {
    id: String(n.id),
    title: n.title,
    message: n.message,
    type: typeMap[rawType] || n.type || 'appointment',
    timestamp: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
    read: !!n.is_read,
    linkRoute: n.link_route || n.link || undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

interface ReceptionContextType {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  queues: QueueItem[];
  bills: Bill[];
  timeline: PatientTimelineEvent[];
  notifications: ClinicNotification[];
  // Clinical / Doctor Portal Data
  consultations: Consultation[];
  prescriptions: Prescription[];
  followUps: FollowUpRecord[];
  currentDoctorId: string;
  setCurrentDoctorId: (id: string) => void;
  pharmacyEnabled: boolean;
  setPharmacyEnabled: (val: boolean) => void;
  // Reception Actions
  registerPatient: (data: Omit<Patient, 'id' | 'uhid' | 'registeredAt'>) => Promise<{ success: boolean; message: string; patient?: Patient }>;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  bookAppointment: (data: { patientId: string; doctorId: string; date: string; time: string; type: Appointment['type']; reason: string }) => Promise<{ success: boolean; message: string; appointment?: Appointment }>;
  checkInAppointment: (appointmentId: string) => { success: boolean; token: string };
  cancelAppointment: (appointmentId: string, reason?: string) => void;
  rescheduleAppointment: (appointmentId: string, newDate: string, newTime: string) => void;
  createWalkIn: (params: {
    existingPatientId?: string;
    newPatient?: Omit<Patient, 'id' | 'uhid' | 'registeredAt'>;
    doctorId: string;
    reason: string;
  }) => Promise<{ success: boolean; token: string; message: string }>;
  updateQueueAction: (queueId: string, action: 'call_next' | 'skip' | 'recall' | 'mark_waiting' | 'complete') => void;
  collectPayment: (billId: string, amount: number, method: PaymentMethod, note?: string) => Promise<{ success: boolean; receipt?: PaymentRecord; message: string }>;
  defaultConsultationFee: number;
  setDefaultConsultationFee: (fee: number, applyToPending?: boolean) => Promise<{ success: boolean; updatedCount: number; message: string }>;
  updateBill: (billId: string, data: { items?: { service_name: string; unit_price: number; quantity: number; total?: number; description?: string }[]; discount?: number; tax?: number; notes?: string }) => Promise<{ success: boolean; message: string; bill?: Bill }>;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  searchPatients: (query: string) => Patient[];
  resetDemoData: () => void;
  // Doctor Portal Clinical Actions
  setDoctorAvailability: (doctorId: string, status: DoctorStatus) => void;
  startConsultation: (appointmentId: string, doctorId: string) => Consultation;
  callPatient: (token: string, appointmentId: string) => void;
  skipPatient: (queueItemId: string) => void;
  saveConsultationDraft: (consultation: Partial<Consultation> & { id: string }) => void;
  updateConsultationRecord: (consultationId: string, consultationData: Partial<Consultation>) => Promise<{ success: boolean; message: string }>;
  completeConsultation: (
    consultationData: Consultation,
    charges: ServiceChargeItem[],
    prescriptionData?: Partial<Prescription>,
    followUpData?: { required: boolean; date?: string; notes?: string },
    paymentAction?: { collectNow: boolean; paymentMethod?: PaymentMethod }
  ) => Promise<{ success: boolean; message: string }>;
  printPrescription: (prescriptionId: string) => void;
  updatePrescriptionStatus: (prescriptionId: string, status: Prescription['status']) => void;
  updateFollowUpStatus: (followUpId: string | number, status: 'Scheduled' | 'Completed' | 'Cancelled') => Promise<void>;
  refreshFollowUps: () => Promise<void>;
}

const DEFAULT_FALLBACK_DOCTORS: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Khan',
    email: 'sarah.khan@auracms.com',
    code: 'DOC-1',
    specialization: 'General Medicine & Family Practice',
    room: 'Room 101',
    status: 'Available',
    schedule: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      slotDurationMins: 20,
    },
    waitingCount: 0,
    consultationFee: 50,
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@auracms.com',
    code: 'DOC-2',
    specialization: 'Cardiology & Internal Medicine',
    room: 'Room 102',
    status: 'Available',
    schedule: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      slotDurationMins: 20,
    },
    waitingCount: 0,
    consultationFee: 60,
  },
  {
    id: '3',
    name: 'Dr. Emily Taylor',
    email: 'emily.taylor@auracms.com',
    code: 'DOC-3',
    specialization: 'Pediatrics & Adolescent Care',
    room: 'Room 103',
    status: 'Available',
    schedule: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      slotDurationMins: 20,
    },
    waitingCount: 0,
    consultationFee: 50,
  },
];

export const ReceptionContext = createContext<ReceptionContextType | undefined>(undefined);

export const ReceptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear legacy mock localStorage items once so app tests completely clean from database
  useEffect(() => {
    const legacyKeys = [
      'auracms_patients_v1',
      'auracms_doctors_v1',
      'auracms_appointments_v1',
      'auracms_queues_v1',
      'auracms_bills_v1',
      'auracms_timeline_v1',
      'auracms_notifications_v1',
      'auracms_consultations_v1',
      'auracms_prescriptions_v1',
      'auracms_followups_v1',
    ];
    legacyKeys.forEach(k => localStorage.removeItem(k));
  }, []);

  // Real database-backed states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>(DEFAULT_FALLBACK_DOCTORS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [defaultConsultationFee, setDefaultConsultationFeeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('auracms_default_fee');
      return saved ? parseFloat(saved) : 500;
    } catch {
      return 500;
    }
  });
  const [timeline, setTimeline] = useState<PatientTimelineEvent[]>([]);
  const [notifications, setNotifications] = useState<ClinicNotification[]>(() => {
    try {
      const saved = localStorage.getItem('auracms_notifications_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save notifications to local cache whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('auracms_notifications_cache', JSON.stringify(notifications.slice(0, 50)));
    } catch {
      // ignore
    }
  }, [notifications]);

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);

  const [currentDoctorId, setCurrentDoctorIdState] = useState<string>(() => {
    const saved = localStorage.getItem('auracms_doctor_id');
    return saved ? saved.replace('doc-', '') : '1';
  });

  const setCurrentDoctorId = (id: string) => {
    const cleanId = id.replace('doc-', '');
    setCurrentDoctorIdState(cleanId);
    localStorage.setItem('auracms_doctor_id', cleanId);
  };

  const [pharmacyEnabled, setPharmacyEnabledState] = useState<boolean>(() => {
    const cached = localStorage.getItem('auracms_pharmacy_enabled');
    return cached !== null ? JSON.parse(cached) : true;
  });

  const setPharmacyEnabled = (val: boolean) => {
    setPharmacyEnabledState(val);
    localStorage.setItem('auracms_pharmacy_enabled', JSON.stringify(val));
  };

  // Helper to add timeline event
  const logTimeline = (patientId: string, type: PatientTimelineEvent['type'], title: string, description: string, actorName = 'Reception Desk') => {
    const newEvent: PatientTimelineEvent = {
      id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      type,
      title,
      description,
      timestamp: `${TODAY} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      actorName,
    };
    setTimeline(prev => [newEvent, ...prev]);
  };

  // Helper to add notification
  const notify = (title: string, message: string, type: ClinicNotification['type'], linkRoute?: string) => {
    const newNotif: ClinicNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      timestamp: 'Just now',
      read: false,
      linkRoute,
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Dispatch asynchronous backend persistence
    api.createNotification({
      title,
      message,
      type: type.toUpperCase(),
      link_route: linkRoute,
    }).catch(err => console.debug('Async notification sync notice:', err));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // BACKEND SYNC (LOAD REAL DATA)
  // ─────────────────────────────────────────────────────────────────────────────

  const refreshData = useCallback(async () => {
    try {
      // 1. Fetch doctors
      const docsRes = await api.listDoctors().catch(() => null);
      if (Array.isArray(docsRes) && docsRes.length > 0) {
        const mappedDocs = docsRes.map(mapBackendDoctor);
        setDoctors(mappedDocs);
      }

      // 2. Fetch patients
      const ptsRes = await api.listPatients({ limit: 500 }).catch(() => null);
      if (ptsRes && Array.isArray(ptsRes.patients)) {
        setPatients(ptsRes.patients.map(mapBackendPatient));
      }

      // 3. Fetch appointments
      const apptsRes = await api.listAppointments({ limit: 500 }).catch(() => null);
      if (apptsRes && Array.isArray(apptsRes.appointments)) {
        setAppointments(apptsRes.appointments.map(mapBackendAppointment));
      }

      // 4. Fetch active queue
      const queueRes = await api.listQueue({}).catch(() => null);
      if (queueRes && Array.isArray(queueRes.entries)) {
        setQueues(queueRes.entries.map(mapBackendQueue));
      }

      // 5. Fetch bills
      const billsRes = await api.listBills({ limit: 500 }).catch(() => null);
      if (billsRes && Array.isArray(billsRes.bills)) {
        setBills(billsRes.bills.map(mapBackendBill));
      }

      // 6. Fetch consultations
      const consRes = await api.listConsultations({ limit: 500 }).catch(() => null);
      if (Array.isArray(consRes)) {
        setConsultations(consRes.map(mapBackendConsultation));
      }

      // 7. Fetch prescriptions
      const rxRes = await api.listPrescriptions({ limit: 500 }).catch(() => null);
      if (rxRes && Array.isArray(rxRes.prescriptions)) {
        setPrescriptions(rxRes.prescriptions.map(mapBackendPrescription));
      }

      // 8. Fetch follow-ups
      const fuRes = await api.listFollowUps({ limit: 500 }).catch(() => null);
      if (fuRes && Array.isArray(fuRes.follow_ups)) {
        setFollowUps(fuRes.follow_ups.map(mapBackendFollowUp));
      }

      // 9. Fetch notifications
      const notifsRes = await api.listNotifications().catch(() => null);
      const notifsList = Array.isArray(notifsRes)
        ? notifsRes
        : (notifsRes && Array.isArray(notifsRes.notifications) ? notifsRes.notifications : null);
      if (notifsList) {
        const mapped = notifsList.map(mapBackendNotification);
        setNotifications(prev => {
          const backendIds = new Set(mapped.map(m => m.id));
          const localOnly = prev.filter(p => !backendIds.has(p.id) && p.id.startsWith('notif-'));
          return [...mapped, ...localOnly];
        });
      }
    } catch (err) {
      console.warn('Backend sync caught error:', err);
    }
  }, []);

  // Granular live refresh handlers triggered by WebSocket events
  const refreshQueue = useCallback(async () => {
    const queueRes = await api.listQueue({}).catch(() => null);
    if (queueRes && Array.isArray(queueRes.entries)) {
      setQueues(queueRes.entries.map(mapBackendQueue));
    }
  }, []);

  const refreshAppointments = useCallback(async () => {
    const apptsRes = await api.listAppointments({}).catch(() => null);
    if (apptsRes && Array.isArray(apptsRes.appointments)) {
      setAppointments(apptsRes.appointments.map(mapBackendAppointment));
    }
  }, []);

  const refreshPatients = useCallback(async () => {
    const ptsRes = await api.listPatients({ limit: 200 }).catch(() => null);
    if (ptsRes && Array.isArray(ptsRes.patients)) {
      setPatients(ptsRes.patients.map(mapBackendPatient));
    }
  }, []);

  const refreshBills = useCallback(async () => {
    const billsRes = await api.listBills({}).catch(() => null);
    if (billsRes && Array.isArray(billsRes.bills)) {
      setBills(billsRes.bills.map(mapBackendBill));
    }
  }, []);

  const refreshConsultations = useCallback(async () => {
    const consRes = await api.listConsultations({}).catch(() => null);
    if (Array.isArray(consRes)) {
      setConsultations(consRes.map(mapBackendConsultation));
    }
  }, []);

  const refreshPrescriptions = useCallback(async () => {
    const rxRes = await api.listPrescriptions({}).catch(() => null);
    if (rxRes && Array.isArray(rxRes.prescriptions)) {
      setPrescriptions(rxRes.prescriptions.map(mapBackendPrescription));
    }
  }, []);

  const refreshFollowUps = useCallback(async () => {
    const fuRes = await api.listFollowUps({}).catch(() => null);
    if (fuRes && Array.isArray(fuRes.follow_ups)) {
      setFollowUps(fuRes.follow_ups.map(mapBackendFollowUp));
    }
  }, []);

  const updateFollowUpStatus = useCallback(async (followUpId: string | number, status: 'Scheduled' | 'Completed' | 'Cancelled') => {
    try {
      const numericId = typeof followUpId === 'string' ? parseInt(followUpId.replace(/\D/g, '') || followUpId, 10) : followUpId;
      const res = await api.updateFollowUp(numericId, { status: status.toUpperCase() });
      if (res) {
        setFollowUps(prev => prev.map(f => String(f.id) === String(followUpId) ? mapBackendFollowUp(res) : f));
      }
    } catch (e) {
      console.warn('Backend updateFollowUp failed, updating local state:', e);
      setFollowUps(prev => prev.map(f => String(f.id) === String(followUpId) ? { ...f, status } : f));
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    const notifsRes = await api.listNotifications().catch(() => null);
    const notifsList = Array.isArray(notifsRes)
      ? notifsRes
      : (notifsRes && Array.isArray(notifsRes.notifications) ? notifsRes.notifications : null);
    if (notifsList) {
      const mapped = notifsList.map(mapBackendNotification);
      setNotifications(prev => {
        const backendIds = new Set(mapped.map(m => m.id));
        const localOnly = prev.filter(p => !backendIds.has(p.id) && p.id.startsWith('notif-'));
        return [...mapped, ...localOnly];
      });
    }
  }, []);

  // Real-time synchronization via WebSocket (replaces aggressive 8s polling)
  useEffect(() => {
    // 1. Initial snapshot load on mount
    refreshData();

    // 2. Subscribe to backend WebSocket push events
    const unsubscribe = realtimeSocket.subscribe((event) => {
      switch (event) {
        case 'queue_updated':
          refreshQueue();
          refreshAppointments();
          break;
        case 'appointment_updated':
          refreshAppointments();
          refreshQueue();
          break;
        case 'patient_updated':
          refreshPatients();
          break;
        case 'billing_updated':
          refreshBills();
          break;
        case 'consultation_updated':
          refreshConsultations();
          refreshQueue();
          break;
        case 'prescription_updated':
          refreshPrescriptions();
          break;
        case 'follow_up_updated':
          refreshFollowUps();
          break;
        case 'notification_updated':
          refreshNotifications();
          break;
        case 'all':
          refreshData();
          break;
        default:
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [
    refreshData,
    refreshQueue,
    refreshAppointments,
    refreshPatients,
    refreshBills,
    refreshConsultations,
    refreshPrescriptions,
    refreshFollowUps,
    refreshNotifications,
  ]);

  // Doctor Token generator helper
  const generateDoctorToken = (doctorCode: string): string => {
    const existingDoctorTokens = queues
      .filter(q => q.token.startsWith(`${doctorCode}-`))
      .map(q => parseInt(q.token.split('-')[1], 10))
      .filter(n => !isNaN(n));
    
    const nextNum = existingDoctorTokens.length > 0 ? Math.max(...existingDoctorTokens) + 1 : 1;
    return `${doctorCode}-${String(nextNum).padStart(3, '0')}`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RECEPTION ACTIONS (WIRED TO FASTAPI BACKEND)
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. Register Patient
  const registerPatient = async (data: Omit<Patient, 'id' | 'uhid' | 'registeredAt'>) => {
    try {
      let firstName = data.firstName?.trim() || '';
      let lastName = data.lastName !== undefined ? data.lastName.trim() : '';

      if (!firstName && data.fullName) {
        const nameParts = data.fullName.trim().split(/\s+/);
        firstName = nameParts[0] || 'Unknown';
        lastName = nameParts.slice(1).join(' ').trim();
      }

      if (lastName === '.') lastName = '';

      const payload = {
        first_name: firstName || 'Unknown',
        last_name: lastName || '',
        gender: data.gender === 'Male' || data.gender === 'Female' ? data.gender : 'Other',
        date_of_birth: data.dob || '1990-01-01',
        phone: data.mobile,
        email: data.email || null,
        blood_group: data.bloodGroup || null,
        address: data.address || null,
        city: data.city || null,
        emergency_contact_name: data.emergencyContact?.name || null,
        emergency_contact_phone: data.emergencyContact?.phone || null,
        emergency_contact_relationship: data.emergencyContact?.relationship || null,
        allergies: data.allergies || null,
        medical_conditions: data.medicalConditions || null,
      };

      const backendPatient = await api.createPatient(payload);
      const mappedPatient = mapBackendPatient(backendPatient);

      setPatients(prev => [mappedPatient, ...prev.filter(p => p.id !== mappedPatient.id)]);
      logTimeline(mappedPatient.id, 'Patient Registered', `Patient Registered at Front Desk`, `Registered with UHID ${mappedPatient.uhid}. Mobile: ${data.mobile}.`);
      notify('New Patient Registered', `${mappedPatient.fullName} registered with UHID ${mappedPatient.uhid}.`, 'appointment', `/reception/patients`);

      return {
        success: true,
        message: `Patient registered successfully with UHID ${mappedPatient.uhid}.`,
        patient: mappedPatient,
      };
    } catch (err: any) {
      console.error('Failed to register patient:', err);
      return {
        success: false,
        message: err.message || 'Failed to register patient in database.',
      };
    }
  };

  // 2. Update Patient
  const updatePatient = async (id: string, data: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    const numericId = parseInt(id.replace(/\D/g, '') || id, 10);
    if (!numericId) return;

    try {
      const payload: any = {};
      if (data.firstName !== undefined || data.lastName !== undefined) {
        if (data.firstName !== undefined) payload.first_name = data.firstName.trim();
        if (data.lastName !== undefined) {
          const l = data.lastName.trim();
          payload.last_name = l === '.' ? '' : l;
        }
      } else if (data.fullName) {
        const parts = data.fullName.trim().split(/\s+/);
        payload.first_name = parts[0] || 'Unknown';
        const parsedLast = parts.slice(1).join(' ').trim();
        payload.last_name = parsedLast === '.' ? '' : parsedLast;
      }
      if (data.mobile) payload.phone = data.mobile;
      if (data.email) payload.email = data.email;
      if (data.bloodGroup) payload.blood_group = data.bloodGroup;
      if (data.address) payload.address = data.address;
      if (data.city) payload.city = data.city;
      if (data.emergencyContact?.name) payload.emergency_contact_name = data.emergencyContact.name;
      if (data.emergencyContact?.phone) payload.emergency_contact_phone = data.emergencyContact.phone;
      if (data.emergencyContact?.relationship) payload.emergency_contact_relationship = data.emergencyContact.relationship;
      if (data.allergies) payload.allergies = data.allergies;
      if (data.medicalConditions) payload.medical_conditions = data.medicalConditions;

      await api.updatePatient(numericId, payload);
    } catch (err) {
      console.warn('Update patient backend sync error:', err);
    }
  };

  // 3. Book Appointment
  const bookAppointment = async (data: { patientId: string; doctorId: string; date: string; time: string; type: Appointment['type']; reason: string }) => {
    const cleanDocId = data.doctorId.replace('doc-', '');
    const patient = patients.find(p => p.id === data.patientId);
    const doctor = doctors.find(d => d.id === cleanDocId || d.id === data.doctorId);

    if (!patient || !doctor) {
      return { success: false, message: 'Invalid patient or doctor selected.' };
    }

    const typeEnumMap: Record<string, string> = {
      'New Consultation': 'CONSULTATION',
      'Follow-up': 'FOLLOW_UP',
      'Review': 'REVIEW',
      'Walk-in': 'WALK_IN',
    };

    try {
      const numericPatientId = parseInt(patient.id.replace(/\D/g, '') || patient.id, 10);
      const numericDoctorId = parseInt(cleanDocId.replace(/\D/g, '') || cleanDocId, 10);

      // Convert time "09:00 AM" or "14:30" to "HH:MM"
      let formattedTime = data.time;
      if (formattedTime.includes('AM') || formattedTime.includes('PM')) {
        const [timePart, modifier] = formattedTime.split(' ');
        let [hours, minutes] = timePart.split(':');
        if (modifier === 'PM' && hours !== '12') hours = String(parseInt(hours, 10) + 12);
        if (modifier === 'AM' && hours === '12') hours = '00';
        formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }

      const payload = {
        patient_id: numericPatientId,
        doctor_id: numericDoctorId,
        appointment_date: data.date,
        appointment_time: formattedTime,
        appointment_type: typeEnumMap[data.type] || 'CONSULTATION',
        reason: data.reason || null,
      };

      const backendAppt = await api.createAppointment(payload);
      const mappedAppt = mapBackendAppointment(backendAppt);

      setAppointments(prev => [mappedAppt, ...prev.filter(a => a.id !== mappedAppt.id)]);
      logTimeline(patient.id, 'Appointment Booked', `Appointment Booked (${data.type})`, `Scheduled with ${doctor.name} on ${data.date} at ${data.time} for "${data.reason}".`);
      notify('New Appointment Booked', `${patient.fullName} scheduled with ${doctor.name} at ${data.time}.`, 'appointment', `/reception/appointments`);

      return { success: true, message: 'Appointment booked successfully.', appointment: mappedAppt };
    } catch (err: any) {
      console.error('Failed to book appointment with backend:', err);
      return { success: false, message: err.message || 'Failed to book appointment with backend.' };
    }
  };

  // 4. Check-in Workflow (Generates token & moves to queue)
  const checkInAppointment = (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return { success: false, token: '' };

    const cleanDocId = apt.doctorId.replace('doc-', '');
    const doctor = doctors.find(d => d.id === cleanDocId || d.id === apt.doctorId);
    const doctorCode = doctor ? doctor.code : 'A';
    const assignedToken = apt.token || generateDoctorToken(doctorCode);
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Optimistic state updates for appointment
    setAppointments(prev => prev.map(a => a.id === appointmentId ? {
      ...a,
      status: 'Waiting',
      token: assignedToken,
      checkedInAt: timeNow,
    } : a));

    // 2. Put into active queue
    const existingQueue = queues.find(q => q.appointmentId === appointmentId);
    if (!existingQueue) {
      const newQueueItem: QueueItem = {
        id: `q-${appointmentId}`,
        token: assignedToken,
        appointmentId,
        patientId: apt.patientId,
        patientName: apt.patientName,
        patientUhid: apt.patientUhid,
        doctorId: apt.doctorId,
        doctorName: apt.doctorName,
        status: 'Waiting',
        assignedAt: timeNow,
      };
      setQueues(prev => [...prev, newQueueItem]);
    }

    setDoctors(prev => prev.map(d => (d.id === cleanDocId || d.id === apt.doctorId) ? {
      ...d,
      waitingCount: d.waitingCount + 1,
    } : d));

    // 3. Automatically allocate price based on Default Patient Fee Settings & generate bill
    const numericApptId = parseInt(appointmentId.replace(/\D/g, '') || appointmentId, 10);
    const numericPatientId = parseInt(apt.patientId.replace(/\D/g, '') || apt.patientId, 10);
    const feeToAllocate = defaultConsultationFee > 0 ? defaultConsultationFee : (doctor?.consultationFee || 500);

    const existingBill = bills.find(b => 
      b.appointmentId === appointmentId || (numericApptId && b.appointmentId === String(numericApptId))
    );

    let tempBillId: string | undefined;
    if (!existingBill) {
      tempBillId = `bill-temp-${appointmentId}-${Date.now()}`;
      const optimisticBill: Bill = {
        id: tempBillId,
        billNumber: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-PND`,
        patientId: apt.patientId,
        patientName: apt.patientName,
        patientUhid: apt.patientUhid,
        appointmentId: appointmentId,
        charges: [
          {
            id: `ch-${tempBillId}`,
            serviceName: 'Consultation',
            amount: feeToAllocate,
            originalAmount: feeToAllocate,
            notes: `Consultation with ${apt.doctorName || 'Doctor'}`,
          }
        ],
        subtotal: feeToAllocate,
        discount: 0,
        tax: 0,
        totalAmount: feeToAllocate,
        paidAmount: 0,
        balanceAmount: feeToAllocate,
        status: 'Pending',
        createdBy: 'Reception',
        createdByName: 'Reception Desk',
        createdAt: new Date().toLocaleString(),
        payments: [],
      };
      setBills(prev => [optimisticBill, ...prev.filter(b => b.appointmentId !== appointmentId && b.appointmentId !== String(numericApptId))]);

      logTimeline(
        apt.patientId, 
        'Fee Charged', 
        `Consultation Bill Generated · ₹${feeToAllocate.toFixed(2)}`, 
        `Price allocated based on Default Patient Fee Settings for Token ${assignedToken}.`
      );
      notify(
        'Invoice Generated', 
        `Consultation bill of ₹${feeToAllocate.toFixed(2)} generated for ${apt.patientName}.`, 
        'payment', 
        '/reception/payments'
      );
    }

    logTimeline(apt.patientId, 'Checked-in', `Patient Checked In · Token ${assignedToken}`, `Assigned to ${apt.doctorName}.`);
    notify('Patient Checked In', `${apt.patientName} assigned Token ${assignedToken} for ${apt.doctorName}.`, 'queue', `/reception/queue`);

    // 4. Async backend check-in call (passes fee to backend) & ensure bill is created
    if (numericApptId) {
      api.checkInAppointment(numericApptId, feeToAllocate)
        .catch(() => api.checkInToQueue(numericApptId, 'NORMAL', feeToAllocate))
        .then(async (qRes) => {
          if (qRes && qRes.token_number) {
            const mappedQ = mapBackendQueue(qRes);
            setQueues(prev => [...prev.filter(q => q.appointmentId !== appointmentId), mappedQ]);
          }
          if (!existingBill && numericPatientId) {
            api.createBill({
              patient_id: numericPatientId,
              appointment_id: numericApptId,
              items: [
                {
                  service_name: 'Consultation',
                  description: `Consultation with ${apt.doctorName || 'Doctor'}`,
                  quantity: 1,
                  unit_price: feeToAllocate,
                  total: feeToAllocate,
                }
              ]
            }).then(billRes => {
              if (billRes && billRes.id) {
                const mappedBill = mapBackendBill(billRes);
                setBills(prev => [
                  mappedBill,
                  ...prev.filter(b => b.id !== tempBillId && b.id !== mappedBill.id)
                ]);
              }
            }).catch(bErr => {
              console.warn('Auto bill backend sync notice:', bErr);
            });
          }
        })
        .catch(err => console.warn('Backend check-in sync caught:', err));
    }

    return { success: true, token: assignedToken };
  };

  // 5. Cancel Appointment
  const cancelAppointment = (appointmentId: string, reason = 'Cancelled by receptionist') => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (apt) {
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: 'Cancelled' } : a));
      setQueues(prev => prev.filter(q => q.appointmentId !== appointmentId));
      logTimeline(apt.patientId, 'Appointment Booked', `Appointment Cancelled`, `Cancelled reason: ${reason}.`);
      notify('Appointment Cancelled', `Appointment for ${apt.patientName} was cancelled.`, 'alert');

      const numericId = parseInt(appointmentId.replace(/\D/g, '') || appointmentId, 10);
      if (numericId) {
        api.cancelAppointment(numericId, reason).catch(err => console.warn('Backend cancel error:', err));
      }
    }
  };

  // 6. Reschedule Appointment
  const rescheduleAppointment = (appointmentId: string, newDate: string, newTime: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (apt) {
      setAppointments(prev => prev.map(a => a.id === appointmentId ? {
        ...a,
        date: newDate,
        time: newTime,
        status: 'Scheduled',
        token: undefined,
      } : a));
      setQueues(prev => prev.filter(q => q.appointmentId !== appointmentId));
      logTimeline(apt.patientId, 'Appointment Booked', `Appointment Rescheduled`, `Moved to ${newDate} at ${newTime}.`);
      notify('Appointment Rescheduled', `${apt.patientName} rescheduled to ${newDate} at ${newTime}.`, 'appointment');
    }
  };

  // 7. Fast Walk-in Registration Workflow
  const createWalkIn = async (params: {
    existingPatientId?: string;
    newPatient?: Omit<Patient, 'id' | 'uhid' | 'registeredAt'>;
    doctorId: string;
    reason: string;
  }) => {
    let patient: Patient | undefined;

    if (params.existingPatientId) {
      patient = patients.find(p => p.id === params.existingPatientId);
    } else if (params.newPatient) {
      const reg = await registerPatient(params.newPatient);
      if (!reg.success || !reg.patient) {
        return { success: false, token: '', message: reg.message };
      }
      patient = reg.patient;
    }

    if (!patient) {
      return { success: false, token: '', message: 'Patient information is required for walk-in.' };
    }

    const cleanDocId = params.doctorId.replace('doc-', '');
    const doctor = doctors.find(d => d.id === cleanDocId || d.id === params.doctorId);
    if (!doctor) {
      return { success: false, token: '', message: 'Please select a valid consulting doctor.' };
    }

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const numericPatientId = parseInt(patient.id.replace(/\D/g, '') || patient.id, 10);
      const numericDoctorId = parseInt(cleanDocId.replace(/\D/g, '') || cleanDocId, 10);

      // 1. Create walk-in appointment in backend
      const apptRes = await api.createAppointment({
        patient_id: numericPatientId,
        doctor_id: numericDoctorId,
        appointment_date: TODAY,
        appointment_time: new Date().toTimeString().slice(0, 5),
        appointment_type: 'WALK_IN',
        reason: params.reason || 'General walk-in consultation',
      });
      const mappedAppt = mapBackendAppointment(apptRes);
      setAppointments(prev => [mappedAppt, ...prev.filter(a => a.id !== mappedAppt.id)]);

      // 2. Check in to queue
      const qRes = await api.checkInAppointment(apptRes.id).catch(() => api.checkInToQueue(apptRes.id));
      const mappedQ = mapBackendQueue(qRes);
      setQueues(prev => [...prev.filter(q => q.id !== mappedQ.id), mappedQ]);

      // 3. Create initial consultation bill in backend with price from Default Patient Fee Settings
      const feeToAllocate = defaultConsultationFee > 0 ? defaultConsultationFee : (doctor.consultationFee || 500);
      try {
        const billRes = await api.createBill({
          patient_id: numericPatientId,
          appointment_id: apptRes.id,
          items: [
            {
              service_name: 'Consultation',
              description: `Walk-in Consultation with ${doctor.name}`,
              quantity: 1,
              unit_price: feeToAllocate,
              total: feeToAllocate,
            }
          ]
        });
        const mappedBill = mapBackendBill(billRes);
        setBills(prev => [mappedBill, ...prev.filter(b => b.id !== mappedBill.id)]);
      } catch (bErr) {
        console.warn('Bill creation notice:', bErr);
      }

      setDoctors(prev => prev.map(d => (d.id === cleanDocId || d.id === doctor.id) ? {
        ...d,
        waitingCount: d.waitingCount + 1,
      } : d));

      logTimeline(patient.id, 'Checked-in', `Walk-in Registered · Token ${mappedQ.token}`, `Assigned to ${doctor.name} (${doctor.room}). Consultation fee ₹${feeToAllocate.toFixed(2)} allocated based on Default Patient Fee Settings.`);
      notify('Walk-in Patient Added', `${patient.fullName} added to ${doctor.name}'s queue with Token ${mappedQ.token}.`, 'queue', `/reception/queue`);

      return {
        success: true,
        token: mappedQ.token,
        message: `Walk-in patient registered. Token ${mappedQ.token} assigned to ${doctor.name}'s queue.`,
      };
    } catch (err: any) {
      console.error('Walk-in failed:', err);
      return {
        success: false,
        token: '',
        message: err.message || 'Failed to register walk-in.',
      };
    }
  };

  // 8. Manage Queue Actions (Call next, skip, recall, complete)
  const updateQueueAction = (queueId: string, action: 'call_next' | 'skip' | 'recall' | 'mark_waiting' | 'complete') => {
    const queueItem = queues.find(q => q.id === queueId);
    if (!queueItem) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setQueues(prev => prev.map(q => {
      if (q.id !== queueId) return q;
      if (action === 'call_next') return { ...q, status: 'In Consultation', calledAt: timeNow };
      if (action === 'skip') return { ...q, status: 'Skipped' };
      if (action === 'recall' || action === 'mark_waiting') return { ...q, status: 'Waiting' };
      if (action === 'complete') return { ...q, status: 'Completed' };
      return q;
    }));

    if (queueItem.appointmentId) {
      setAppointments(prev => prev.map(a => {
        if (a.id !== queueItem.appointmentId) return a;
        if (action === 'call_next') return { ...a, status: 'In Consultation' };
        if (action === 'complete') return { ...a, status: 'Completed' };
        if (action === 'skip') return { ...a, status: 'Waiting' };
        return a;
      }));
    }

    if (action === 'call_next') {
      const cleanDocId = queueItem.doctorId.replace('doc-', '');
      setDoctors(prev => prev.map(d => (d.id === cleanDocId || d.id === queueItem.doctorId) ? {
        ...d,
        currentQueueToken: queueItem.token,
        status: 'In Consultation',
      } : d));
      logTimeline(queueItem.patientId, 'In Consultation', `Patient Called into Consultation`, `Called by ${queueItem.doctorName} with Token ${queueItem.token}.`);
      notify('Queue Updated', `Token ${queueItem.token} called into ${queueItem.doctorName}'s room.`, 'queue');
    }

    // Call backend API
    const numericQueueId = parseInt(queueId.replace(/\D/g, '') || queueId, 10);
    const statusMap: Record<string, string> = {
      call_next: 'ENGAGED',
      skip: 'NO_SHOW',
      recall: 'WAITING',
      mark_waiting: 'WAITING',
      complete: 'COMPLETED',
    };
    if (numericQueueId && statusMap[action]) {
      api.updateQueueStatus(numericQueueId, statusMap[action]).catch(err => console.warn('Queue update API warning:', err));
    }
  };

  // 9. Collect Payment
  const collectPayment = async (billId: string, amount: number, method: PaymentMethod, note = '') => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return { success: false, message: 'Bill not found.' };

    if (amount <= 0) {
      return { success: false, message: 'Please enter a valid payment amount greater than zero.' };
    }

    try {
      const numericBillId = parseInt(billId.replace(/\D/g, '') || billId, 10);
      const backendPayment = await api.recordPayment(numericBillId, {
        amount,
        payment_method: method.toUpperCase(),
        note: note || undefined,
      });

      // Fetch fresh bill from backend
      const refreshedBillRes = await api.getBill(numericBillId);
      const mappedBill = mapBackendBill(refreshedBillRes);
      setBills(prev => prev.map(b => b.id === billId ? mappedBill : b));

      const paymentRecord: PaymentRecord = {
        id: String(backendPayment.id),
        receiptNumber: backendPayment.receipt_number,
        billId,
        amount,
        paymentMethod: method,
        collectedBy: 'Receptionist',
        collectorName: backendPayment.receiver_name || 'Reception Desk',
        paidAt: new Date(backendPayment.payment_date).toLocaleString(),
        note,
      };

      logTimeline(
        bill.patientId,
        'Payment Received',
        `Payment Collected (₹${amount.toFixed(2)})`,
        `Receipt ${backendPayment.receipt_number} issued via ${method}. Remaining balance: ₹${mappedBill.balanceAmount.toFixed(2)}.`
      );

      notify(
        'Payment Collected',
        `₹${amount.toFixed(2)} collected from ${bill.patientName} via ${method}. Receipt: ${backendPayment.receipt_number}.`,
        'payment',
        '/reception/payments'
      );

      return {
        success: true,
        receipt: paymentRecord,
        message: `Payment of ₹${amount.toFixed(2)} received successfully. Receipt: ${backendPayment.receipt_number}.`,
      };
    } catch (err: any) {
      console.error('Failed to collect payment:', err);
      return {
        success: false,
        message: err.message || 'Payment processing failed on backend.',
      };
    }
  };

  // 9b. Set Default Consultation Fee
  const setDefaultConsultationFee = async (fee: number, applyToPending = false) => {
    setDefaultConsultationFeeState(fee);
    try {
      localStorage.setItem('auracms_default_fee', String(fee));
    } catch {
      // ignore
    }

    // Also synchronize doctor consultation fees
    setDoctors(prev => prev.map(d => ({ ...d, consultationFee: fee })));

    let updatedCount = 0;
    if (applyToPending) {
      const pendingBills = bills.filter(b => b.status !== 'Paid');
      for (const b of pendingBills) {
        const updatedItems = b.charges.map(c => {
          if (c.serviceName.toLowerCase().includes('consultation')) {
            return {
              service_name: c.serviceName,
              description: c.notes,
              quantity: 1,
              unit_price: fee,
              total: fee,
            };
          }
          return {
            service_name: c.serviceName,
            description: c.notes,
            quantity: 1,
            unit_price: c.amount,
            total: c.amount,
          };
        });

        const hasConsultation = b.charges.some(c => c.serviceName.toLowerCase().includes('consultation'));
        if (!hasConsultation && updatedItems.length > 0) {
          updatedItems[0].unit_price = fee;
          updatedItems[0].total = fee;
        }

        const numericBillId = parseInt(b.id.replace(/\D/g, '') || b.id, 10);
        try {
          const res = await api.updateBill(numericBillId, {
            items: updatedItems,
            discount: b.discount ?? 0,
            tax: b.tax ?? 0,
          });
          const mapped = mapBackendBill(res);
          setBills(prev => prev.map(curr => curr.id === b.id ? mapped : curr));
          updatedCount++;
        } catch {
          const newSubtotal = updatedItems.reduce((acc, curr) => acc + curr.total, 0);
          const newTotal = Math.max(0, newSubtotal - (b.discount ?? 0) + (b.tax ?? 0));
          const newBalance = Math.max(0, newTotal - b.paidAmount);
          const newStatus: BillStatus = newBalance <= 0 ? 'Paid' : (b.paidAmount > 0 ? 'Partially Paid' : 'Pending');
          setBills(prev => prev.map(curr => curr.id === b.id ? {
            ...curr,
            charges: updatedItems.map((uc, idx) => ({
              id: `${b.id}-ch-${idx}`,
              serviceName: uc.service_name,
              amount: uc.total,
              originalAmount: uc.total,
              category: 'Consultation',
              notes: uc.description,
            })),
            subtotal: newSubtotal,
            discount: b.discount ?? 0,
            tax: b.tax ?? 0,
            totalAmount: newTotal,
            balanceAmount: newBalance,
            status: newStatus,
          } : curr));
          updatedCount++;
        }
      }
    }

    notify(
      'Default Fee Configured',
      `Default consultation fee updated to ₹${fee.toFixed(2)}${applyToPending ? ` and applied to ${updatedCount} pending invoice(s).` : '.'}`,
      'payment',
      '/reception/payments'
    );

    return {
      success: true,
      updatedCount,
      message: `Default consultation fee set to ₹${fee.toFixed(2)}${applyToPending ? ` and applied to ${updatedCount} pending invoice(s).` : '.'}`,
    };
  };

  // 9c. Update Bill / Payment Amount for Patient
  const updateBill = async (
    billId: string, 
    data: { 
      items?: { service_name: string; unit_price: number; quantity: number; total?: number; description?: string }[]; 
      discount?: number; 
      tax?: number; 
      notes?: string; 
    }
  ) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return { success: false, message: 'Bill not found' };

    try {
      const numericBillId = parseInt(billId.replace(/\D/g, '') || billId, 10);
      const res = await api.updateBill(numericBillId, data);
      const mapped = mapBackendBill(res);
      setBills(prev => prev.map(b => b.id === billId ? mapped : b));

      logTimeline(
        bill.patientId,
        'Payment Received',
        `Invoice Updated (${bill.billNumber})`,
        `Fee adjusted: Total ₹${mapped.totalAmount.toFixed(2)}, Due ₹${mapped.balanceAmount.toFixed(2)}. Status: ${mapped.status}.`
      );

      notify(
        'Invoice Updated',
        `Invoice ${bill.billNumber} for ${bill.patientName} updated: Total ₹${mapped.totalAmount.toFixed(2)}, Due ₹${mapped.balanceAmount.toFixed(2)}.`,
        'payment',
        '/reception/payments'
      );

      return { success: true, message: 'Invoice updated successfully', bill: mapped };
    } catch (err: any) {
      console.warn('API updateBill failed, using fallback update:', err);

      const items = data.items || bill.charges.map(c => ({
        service_name: c.serviceName,
        unit_price: c.amount,
        quantity: 1,
        total: c.amount,
        description: c.notes,
      }));
      const discount = data.discount !== undefined ? data.discount : (bill.discount ?? 0);
      const tax = data.tax !== undefined ? data.tax : (bill.tax ?? 0);
      const subtotal = items.reduce((acc, it) => acc + (it.total !== undefined ? it.total : it.quantity * it.unit_price), 0);
      const total = Math.max(0, Math.round((subtotal - discount + tax) * 100) / 100);
      const balance = Math.max(0, Math.round((total - bill.paidAmount) * 100) / 100);
      const status: BillStatus = balance <= 0 ? 'Paid' : (bill.paidAmount > 0 ? 'Partially Paid' : 'Pending');

      const updatedBill: Bill = {
        ...bill,
        subtotal,
        discount,
        tax,
        totalAmount: total,
        balanceAmount: balance,
        status,
        notes: data.notes !== undefined ? data.notes : bill.notes,
        charges: items.map((it, idx) => ({
          id: `${bill.id}-charge-${idx}`,
          serviceName: it.service_name || 'Consultation',
          amount: it.total !== undefined ? it.total : it.quantity * it.unit_price,
          originalAmount: it.total !== undefined ? it.total : it.quantity * it.unit_price,
          category: 'Consultation',
          notes: it.description,
        })),
      };

      setBills(prev => prev.map(b => b.id === billId ? updatedBill : b));

      logTimeline(
        bill.patientId,
        'Payment Received',
        `Invoice Updated (${bill.billNumber})`,
        `Fee adjusted: Total ₹${total.toFixed(2)}, Due ₹${balance.toFixed(2)}. Status: ${status}.`
      );

      notify(
        'Invoice Updated',
        `Invoice ${bill.billNumber} for ${bill.patientName} updated: Total ₹${total.toFixed(2)}, Due ₹${balance.toFixed(2)}.`,
        'payment',
        '/reception/payments'
      );

      return { success: true, message: 'Invoice updated locally', bill: updatedBill };
    }
  };

  // 10. Patient Search
  const searchPatients = (query: string): Patient[] => {
    if (!query.trim()) return patients;
    const q = query.toLowerCase().trim();
    return patients.filter(p => 
      p.fullName.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.mobile.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    );
  };

  // 11. Notification handlers
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const numericId = parseInt(id.replace(/\D/g, '') || id, 10);
    if (numericId) {
      api.markNotificationRead(numericId).catch(() => {});
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    api.markAllNotificationsRead().catch(() => {});
  };

  // 12. Clinical & Doctor Portal Actions
  const setDoctorAvailability = (doctorId: string, status: DoctorStatus) => {
    const cleanDocId = doctorId.replace('doc-', '');
    setDoctors(prev => prev.map(doc => (doc.id === cleanDocId || doc.id === doctorId) ? { ...doc, status } : doc));
    const numericId = parseInt(cleanDocId.replace(/\D/g, '') || cleanDocId, 10);
    if (numericId) {
      api.updateDoctorStatus(numericId, status).catch(err => console.warn('Doctor status update error:', err));
    }
  };

  const startConsultation = (appointmentId: string, doctorId: string): Consultation => {
    const cleanDocId = doctorId.replace('doc-', '');
    const apt = appointments.find(a => a.id === appointmentId);
    const doctor = doctors.find(d => d.id === cleanDocId || d.id === doctorId) || doctors[0];
    
    // Update appointment status to 'In Consultation'
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: 'In Consultation' } : a));
    
    // Update doctor status and token
    if (doctor && apt) {
      setDoctors(prev => prev.map(d => (d.id === cleanDocId || d.id === doctorId) ? {
        ...d,
        status: 'In Consultation',
        currentQueueToken: apt.token || d.currentQueueToken
      } : d));
    }

    // Update queue status
    setQueues(prev => prev.map(q => q.appointmentId === appointmentId ? { ...q, status: 'In Consultation' } : q));

    // Check if consultation draft exists
    const existing = consultations.find(c => c.appointmentId === appointmentId);
    if (existing) {
      return existing;
    }

    // Create new consultation draft
    const newConsultation: Consultation = {
      id: `cons-${Date.now()}`,
      appointmentId,
      patientId: apt?.patientId || '',
      patientName: apt?.patientName || '',
      patientUhid: apt?.patientUhid || '',
      doctorId: cleanDocId,
      doctorName: doctor?.name || 'Attending Physician',
      date: TODAY,
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'In Progress',
      vitals: {},
      chiefComplaint: apt?.reason || '',
      symptoms: [],
      physicalExamination: '',
      diagnoses: [],
      clinicalFindings: '',
      doctorNotes: '',
      treatmentAdvice: '',
      charges: doctor ? [
        {
          id: `ch-${Date.now()}`,
          serviceName: 'Consultation',
          amount: doctor.consultationFee,
          originalAmount: doctor.consultationFee,
          notes: `${doctor.specialization} consultation`
        }
      ] : [],
      followUpRequired: false,
    };

    setConsultations(prev => {
      const already = prev.find(c => c.appointmentId === appointmentId);
      if (already) return prev;
      return [newConsultation, ...prev];
    });

    // Dispatch backend creation
    if (apt) {
      const numericPatientId = parseInt(apt.patientId.replace(/\D/g, '') || apt.patientId, 10);
      const cleanDocId = doctorId.replace('doc-', '');
      const numericDoctorId = parseInt(cleanDocId.replace(/\D/g, '') || cleanDocId, 10);
      const numericApptId = parseInt(appointmentId.replace(/\D/g, '') || appointmentId, 10);

      if (numericPatientId && numericDoctorId && numericApptId) {
        api.createConsultation({
          patient_id: numericPatientId,
          doctor_id: numericDoctorId,
          appointment_id: numericApptId,
          chief_complaint: apt.reason || 'General examination',
          clinical_notes: '',
          examination_notes: '',
          treatment_advice: '',
          doctor_notes: '',
          symptoms: [],
          diagnoses: [],
        }).then(backendCons => {
          if (backendCons && backendCons.id) {
            setConsultations(prev => prev.map(c => c.id === newConsultation.id ? { ...c, id: String(backendCons.id) } : c));
          }
        }).catch(err => console.warn('Backend start consultation notice:', err));
      }
    }

    return newConsultation;
  };

  const callPatient = (token: string, appointmentId: string) => {
    setQueues(prev => prev.map(q => {
      if (q.appointmentId === appointmentId || q.token === token) {
        return {
          ...q,
          status: 'Waiting',
          calledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return q;
    }));

    notify('Token Called to Room', `Doctor called Token ${token} into the consultation suite.`, 'queue', '/doctor/appointments');
  };

  const skipPatient = (queueItemId: string) => {
    updateQueueAction(queueItemId, 'skip');
  };

  const saveConsultationDraft = (consultation: Partial<Consultation> & { id: string }) => {
    setConsultations(prev => {
      const idx = prev.findIndex(c => c.id === consultation.id || (consultation.appointmentId && c.appointmentId === consultation.appointmentId));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...consultation };
        return updated;
      }
      return [consultation as Consultation, ...prev];
    });

    if (consultation.appointmentId && consultation.patientId && consultation.doctorId) {
      const numericPatientId = parseInt(consultation.patientId.replace(/\D/g, '') || consultation.patientId, 10);
      const cleanDoc = consultation.doctorId.replace('doc-', '');
      const numericDoctorId = parseInt(cleanDoc.replace(/\D/g, '') || cleanDoc, 10);
      const numericApptId = parseInt(consultation.appointmentId.replace(/\D/g, '') || consultation.appointmentId, 10);

      const vitalsPayload = consultation.vitals ? {
        patient_id: numericPatientId,
        appointment_id: numericApptId,
        height: consultation.vitals.height,
        weight: consultation.vitals.weight,
        bmi: consultation.vitals.bmi,
        blood_pressure_systolic: consultation.vitals.bloodPressureSystolic,
        blood_pressure_diastolic: consultation.vitals.bloodPressureDiastolic,
        pulse: consultation.vitals.pulse,
        spo2: consultation.vitals.spO2,
        temperature: consultation.vitals.temperature,
        respiratory_rate: consultation.vitals.respiratoryRate,
      } : undefined;

      if (numericPatientId && numericDoctorId && numericApptId) {
        // Cleanly deduplicate symptoms before dispatching
        const seenSym = new Set<string>();
        const uniqueSymptoms = (consultation.symptoms || []).filter(s => {
          const key = (s.name || '').trim().toLowerCase();
          if (!key || seenSym.has(key)) return false;
          seenSym.add(key);
          return true;
        }).map(s => ({
          name: s.name.trim(),
          duration: s.duration || '',
          severity: s.severity || 'Mild',
          notes: s.notes || '',
        }));

        // Cleanly deduplicate diagnoses before dispatching
        const seenDiag = new Set<string>();
        const uniqueDiagnoses = (consultation.diagnoses || []).filter(d => {
          const key = (d.description || '').trim().toLowerCase();
          if (!key || seenDiag.has(key)) return false;
          seenDiag.add(key);
          return true;
        }).map(d => ({
          code: d.code || 'GEN-01',
          description: d.description.trim(),
          diagnosis_type: d.type || 'Primary',
          notes: d.notes || '',
        }));

        api.createConsultation({
          patient_id: numericPatientId,
          doctor_id: numericDoctorId,
          appointment_id: numericApptId,
          chief_complaint: consultation.chiefComplaint || 'Consultation Draft',
          clinical_notes: consultation.clinicalFindings || '',
          examination_notes: consultation.physicalExamination || '',
          treatment_advice: consultation.treatmentAdvice || '',
          doctor_notes: consultation.doctorNotes || '',
          symptoms: uniqueSymptoms,
          diagnoses: uniqueDiagnoses,
          vitals: vitalsPayload,
        }).then(res => {
          if (res && res.id) {
            setConsultations(prev => prev.map(c => 
              (c.id === consultation.id || c.appointmentId === consultation.appointmentId) 
                ? { ...c, id: String(res.id) } 
                : c
            ));
          }
        }).catch(err => console.warn('Draft sync notice:', err));
      }
    }
  };

  const updateConsultationRecord = async (
    consultationId: string,
    consultationData: Partial<Consultation>
  ): Promise<{ success: boolean; message: string }> => {
    // 1. Update local state
    setConsultations(prev => prev.map(c => 
      (c.id === consultationId || (consultationData.appointmentId && c.appointmentId === consultationData.appointmentId))
        ? { ...c, ...consultationData }
        : c
    ));

    const numericConsId = parseInt(consultationId.replace(/\D/g, '') || consultationId, 10);
    const numericApptId = consultationData.appointmentId ? parseInt(consultationData.appointmentId.replace(/\D/g, '') || consultationData.appointmentId, 10) : undefined;
    const numericPatientId = consultationData.patientId ? parseInt(consultationData.patientId.replace(/\D/g, '') || consultationData.patientId, 10) : undefined;

    const vitalsPayload = consultationData.vitals ? {
      patient_id: numericPatientId,
      appointment_id: numericApptId,
      height: consultationData.vitals.height,
      weight: consultationData.vitals.weight,
      bmi: consultationData.vitals.bmi,
      blood_pressure_systolic: consultationData.vitals.bloodPressureSystolic,
      blood_pressure_diastolic: consultationData.vitals.bloodPressureDiastolic,
      pulse: consultationData.vitals.pulse,
      spo2: consultationData.vitals.spO2,
      temperature: consultationData.vitals.temperature,
      respiratory_rate: consultationData.vitals.respiratoryRate,
    } : undefined;

    const targetId = numericConsId || numericApptId;
    if (targetId) {
      try {
        await api.updateConsultation(targetId, {
          chief_complaint: consultationData.chiefComplaint,
          clinical_notes: consultationData.clinicalFindings,
          examination_notes: consultationData.physicalExamination,
          treatment_advice: consultationData.treatmentAdvice,
          doctor_notes: consultationData.doctorNotes,
          symptoms: consultationData.symptoms?.map(s => ({
            name: s.name,
            duration: s.duration,
            severity: s.severity,
          })),
          diagnoses: consultationData.diagnoses?.map(d => ({
            code: d.code || 'GEN-01',
            description: d.description,
            diagnosis_type: d.type || 'Primary',
          })),
          vitals: vitalsPayload,
        });

        if (vitalsPayload) {
          await api.recordVitals(vitalsPayload).catch(e => console.warn('Vitals update record notice:', e));
        }

        notify('Consultation Updated', 'Patient consultation notes and vitals updated successfully.', 'appointment', '/doctor/consultations');
        return { success: true, message: 'Consultation updated successfully.' };
      } catch (err: any) {
        console.warn('Update consultation backend notice:', err);
        return { success: true, message: 'Consultation updated locally.' };
      }
    }
    return { success: true, message: 'Consultation updated.' };
  };

  const completeConsultation = async (
    consultationData: Consultation,
    charges: ServiceChargeItem[],
    prescriptionData?: Partial<Prescription>,
    followUpData?: { required: boolean; date?: string; notes?: string },
    paymentAction?: { collectNow: boolean; paymentMethod?: PaymentMethod }
  ): Promise<{ success: boolean; message: string }> => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cleanDocId = consultationData.doctorId.replace('doc-', '');
    const doctor = doctors.find(d => d.id === cleanDocId || d.id === consultationData.doctorId) || doctors[0];

    const numericPatientId = parseInt(consultationData.patientId.replace(/\D/g, '') || consultationData.patientId, 10);
    const numericDoctorId = parseInt(cleanDocId.replace(/\D/g, '') || cleanDocId, 10);
    const numericApptId = parseInt(consultationData.appointmentId.replace(/\D/g, '') || consultationData.appointmentId, 10);

    const vitalsPayload = consultationData.vitals ? {
      patient_id: numericPatientId,
      appointment_id: numericApptId,
      height: consultationData.vitals.height,
      weight: consultationData.vitals.weight,
      bmi: consultationData.vitals.bmi,
      blood_pressure_systolic: consultationData.vitals.bloodPressureSystolic,
      blood_pressure_diastolic: consultationData.vitals.bloodPressureDiastolic,
      pulse: consultationData.vitals.pulse,
      spo2: consultationData.vitals.spO2,
      temperature: consultationData.vitals.temperature,
      respiratory_rate: consultationData.vitals.respiratoryRate,
    } : undefined;

    // 1. Resolve or Create the Consultation in Backend
    let numericConsId: number | undefined = undefined;

    // Check if consultationData.id is a real numeric DB ID (does not start with 'cons-')
    if (consultationData.id && !consultationData.id.startsWith('cons-')) {
      const parsed = parseInt(consultationData.id, 10);
      if (!isNaN(parsed) && parsed > 0) {
        numericConsId = parsed;
      }
    }

    // Check if local state has a synced consultation with numeric DB ID
    if (!numericConsId) {
      const found = consultations.find(c => c.appointmentId === consultationData.appointmentId && !c.id.startsWith('cons-'));
      if (found) {
        const parsed = parseInt(found.id, 10);
        if (!isNaN(parsed) && parsed > 0) {
          numericConsId = parsed;
        }
      }
    }

    // Ensure the consultation exists in backend DB
    if (numericPatientId && numericDoctorId && numericApptId) {
      try {
        const consRes = await api.createConsultation({
          patient_id: numericPatientId,
          doctor_id: numericDoctorId,
          appointment_id: numericApptId,
          chief_complaint: consultationData.chiefComplaint || 'Clinical Consultation',
          clinical_notes: consultationData.clinicalFindings || '',
          examination_notes: consultationData.physicalExamination || '',
          treatment_advice: consultationData.treatmentAdvice || '',
          doctor_notes: consultationData.doctorNotes || '',
          symptoms: (consultationData.symptoms || []).map(s => ({
            name: s.name,
            duration: s.duration,
            severity: s.severity,
            notes: '',
          })),
          diagnoses: (consultationData.diagnoses || []).map(d => ({
            code: d.code || 'GEN-01',
            description: d.description,
            diagnosis_type: d.type || 'Primary',
            notes: '',
          })),
          vitals: vitalsPayload,
        });
        if (consRes && consRes.id) {
          numericConsId = consRes.id;
        }
      } catch (err) {
        console.warn('Consultation create/sync notice:', err);
      }
    }

    if (vitalsPayload) {
      api.recordVitals(vitalsPayload).catch(e => console.warn('Vitals completion record notice:', e));
    }

    const consIdToUse = numericConsId || numericApptId;

    let createdPrescriptionId: string | undefined = consultationData.prescriptionId;

    // 2. Create/update prescription if medicines added
    if (prescriptionData && prescriptionData.medicines && prescriptionData.medicines.length > 0) {
      const rxNum = prescriptionData.rxNumber || `RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      createdPrescriptionId = prescriptionData.id || `rx-${Date.now()}`;
      
      const newRx: Prescription = {
        id: createdPrescriptionId,
        rxNumber: rxNum,
        appointmentId: consultationData.appointmentId,
        patientId: consultationData.patientId,
        patientName: consultationData.patientName,
        patientUhid: consultationData.patientUhid,
        patientAge: prescriptionData.patientAge || 35,
        patientGender: prescriptionData.patientGender || 'Adult',
        patientPhone: prescriptionData.patientPhone || '',
        doctorId: cleanDocId,
        doctorName: consultationData.doctorName,
        doctorSpecialization: doctor?.specialization || 'Clinical Consultation',
        doctorRoom: doctor?.room || 'Consultation Room',
        date: TODAY,
        diagnoses: consultationData.diagnoses.map(d => d.description),
        medicines: prescriptionData.medicines,
        generalAdvice: consultationData.treatmentAdvice,
        dietAndLifestyle: prescriptionData.dietAndLifestyle,
        followUpDate: followUpData?.date,
        followUpNotes: followUpData?.notes,
        status: 'Created',
        createdAt: `${TODAY} ${nowTime}`,
      };

      setPrescriptions(prev => [newRx, ...prev.filter(p => p.id !== newRx.id)]);

      // Save prescription to backend
      try {
        const createdRx = await api.createPrescription({
          consultation_id: consIdToUse,
          patient_id: numericPatientId,
          doctor_id: numericDoctorId,
          general_advice: consultationData.treatmentAdvice || null,
          diet_and_lifestyle: prescriptionData.dietAndLifestyle || null,
          follow_up_date: followUpData?.date || null,
          follow_up_notes: followUpData?.notes || null,
          items: prescriptionData.medicines.map(m => ({
            medicine_name: m.name,
            dosage: m.strength || m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            route: m.route || 'Oral',
            timing: m.timing || 'After meals',
            quantity: m.quantity || 1,
            instructions: m.instructions || '',
          })),
        });
        if (createdRx && createdRx.id) {
          createdPrescriptionId = String(createdRx.id);
        }
      } catch (err) {
        console.warn('Backend prescription error:', err);
      }
    }

    // 3. Mark consultation complete in backend
    if (consIdToUse) {
      try {
        await api.completeConsultation(consIdToUse);
      } catch (err) {
        console.warn('Backend complete consultation error:', err);
      }
    }

    // Update local consultation state
    const updatedConsultation: Consultation = {
      ...consultationData,
      id: numericConsId ? String(numericConsId) : consultationData.id,
      status: 'Completed',
      completedAt: nowTime,
      charges,
      prescriptionId: createdPrescriptionId,
      followUpRequired: !!followUpData?.required,
      followUpDate: followUpData?.date,
      followUpNotes: followUpData?.notes,
      collectedAtConsultation: paymentAction?.collectNow,
      paymentMethod: paymentAction?.paymentMethod,
    };

    setConsultations(prev => [
      updatedConsultation,
      ...prev.filter(c => c.id !== updatedConsultation.id && c.appointmentId !== consultationData.appointmentId)
    ]);

    // 4. Update Appointment & Queue
    setAppointments(prev => prev.map(a => a.id === consultationData.appointmentId ? { ...a, status: 'Completed' } : a));
    setQueues(prev => prev.map(q => q.appointmentId === consultationData.appointmentId ? { ...q, status: 'Completed' } : q));

    if (doctor) {
      setDoctors(prev => prev.map(d => (d.id === cleanDocId || d.id === doctor.id) ? {
        ...d,
        status: 'Available',
        waitingCount: Math.max(0, d.waitingCount - 1),
        currentQueueToken: undefined,
      } : d));
    }

    // 5. Handle Billing and Charges
    const totalChargeAmount = charges.reduce((sum, ch) => sum + ch.amount, 0);
    if (totalChargeAmount > 0) {
      const isCollected = !!paymentAction?.collectNow;
      const existingApptBill = bills.find(b => 
        b.appointmentId === consultationData.appointmentId || 
        (numericApptId && b.appointmentId === String(numericApptId))
      );

      const itemsPayload = charges.map(ch => ({
        service_name: ch.serviceName,
        description: ch.notes || undefined,
        quantity: 1,
        unit_price: ch.amount,
        total: ch.amount,
      }));

      try {
        let billIdToPay: number | undefined;
        let mappedBillObj: Bill | undefined;

        if (existingApptBill && !existingApptBill.id.startsWith('bill-temp-')) {
          const numBillId = parseInt(existingApptBill.id.replace(/\D/g, '') || existingApptBill.id, 10);
          const updatedBillRes = await api.updateBill(numBillId, {
            items: itemsPayload,
          });
          mappedBillObj = mapBackendBill(updatedBillRes);
          billIdToPay = numBillId;
          setBills(prev => [mappedBillObj!, ...prev.filter(b => b.id !== existingApptBill.id && b.id !== String(numBillId))]);
        } else {
          const newBillRes = await api.createBill({
            patient_id: numericPatientId,
            appointment_id: numericApptId || undefined,
            items: itemsPayload,
          });
          if (newBillRes) {
            mappedBillObj = mapBackendBill(newBillRes);
            billIdToPay = newBillRes.id;
            setBills(prev => [mappedBillObj!, ...prev.filter(b => b.id !== String(newBillRes.id))]);
          }
        }

        if (billIdToPay && isCollected) {
          await api.recordPayment(billIdToPay, {
            amount: totalChargeAmount,
            payment_method: (paymentAction?.paymentMethod || 'CASH').toUpperCase(),
            note: `Paid directly to ${doctor?.name || 'Doctor'} at consultation completion`,
          });
          const refreshedBill = await api.getBill(billIdToPay);
          setBills(prev => [mapBackendBill(refreshedBill), ...prev.filter(b => b.id !== String(billIdToPay))]);
        }
      } catch (err) {
        console.warn('Backend billing error:', err);
      }
    }

    // 6. Follow-up Record
    if (followUpData?.required && followUpData.date) {
      try {
        const backendFu = await api.createFollowUp({
          patient_id: numericPatientId,
          doctor_id: numericDoctorId,
          consultation_id: consIdToUse || undefined,
          follow_up_date: followUpData.date,
          notes: followUpData.notes || 'Routine follow-up review',
        });
        if (backendFu) {
          setFollowUps(prev => [mapBackendFollowUp(backendFu), ...prev]);
        }
      } catch (err) {
        console.warn('Backend follow-up error:', err);
      }
    }

    logTimeline(
      consultationData.patientId,
      'Consultation Completed',
      `Consultation Completed by ${doctor?.name || 'Doctor'}`,
      `Primary diagnosis: ${consultationData.diagnoses.map(d => d.description).join(', ') || 'Clinical consultation recorded.'}`
    );

    notify(
      'Consultation Completed',
      `Consultation for ${consultationData.patientName} completed by ${doctor?.name || 'Doctor'}.`,
      'doctor',
      '/reception/billing'
    );

    return { success: true, message: 'Consultation completed successfully.' };
  };

  const printPrescription = (prescriptionId: string) => {
    setPrescriptions(prev => prev.map(p => p.id === prescriptionId ? { ...p, status: 'Printed' } : p));
  };

  const updatePrescriptionStatus = (prescriptionId: string, status: Prescription['status']) => {
    setPrescriptions(prev => prev.map(p => p.id === prescriptionId ? { ...p, status } : p));
    const numericRxId = parseInt(prescriptionId.replace(/\D/g, '') || prescriptionId, 10);
    if (numericRxId) {
      if (status === 'Dispensed') {
        api.dispensePrescription(numericRxId).catch(() => api.updatePrescription(numericRxId, { status: 'DISPENSED' }));
      } else {
        api.updatePrescription(numericRxId, { status: status.toUpperCase() }).catch(() => {});
      }
    }
  };

  // 13. Reset / Refresh Data
  const resetDemoData = () => {
    refreshData();
  };

  return (
    <ReceptionContext.Provider
      value={{
        patients,
        doctors,
        appointments,
        queues,
        bills,
        timeline,
        notifications,
        consultations,
        prescriptions,
        followUps,
        currentDoctorId,
        setCurrentDoctorId,
        pharmacyEnabled,
        setPharmacyEnabled,
        registerPatient,
        updatePatient,
        bookAppointment,
        checkInAppointment,
        cancelAppointment,
        rescheduleAppointment,
        createWalkIn,
        updateQueueAction,
        collectPayment,
        defaultConsultationFee,
        setDefaultConsultationFee,
        updateBill,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        searchPatients,
        resetDemoData,
        setDoctorAvailability,
        startConsultation,
        callPatient,
        skipPatient,
        saveConsultationDraft,
        updateConsultationRecord,
        completeConsultation,
        printPrescription,
        updatePrescriptionStatus,
        updateFollowUpStatus,
        refreshFollowUps,
      }}
    >
      {children}
    </ReceptionContext.Provider>
  );
};

export const useReception = () => {
  const context = useContext(ReceptionContext);
  if (!context) {
    throw new Error('useReception must be used within a ReceptionProvider');
  }
  return context;
};
