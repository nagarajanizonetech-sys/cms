import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Stethoscope, 
  AlertTriangle, 
  Heart, 
  Activity, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  Plus, 
  Trash2, 
  Check, 
  X,
  Printer, 
  Save, 
  CreditCard, 
  ChevronRight, 
  Sparkles, 
  Pill, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  History,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { 
  Consultation, 
  Vitals, 
  SymptomItem, 
  DiagnosisItem, 
  PrescriptionMedicine, 
  Prescription 
} from '../../../types/doctor';
import { ServiceChargeItem, PaymentMethod, ClinicServiceName } from '../../../types/reception';
import { PrescriptionA4Modal } from '../modals/PrescriptionA4Modal';

interface ConsultationWorkspaceProps {
  appointmentId: string;
  onNavigate: (route: string) => void;
}

const COMMON_SYMPTOMS = [
  'Fever', 'Dry Cough', 'Productive Cough', 'Sore Throat', 'Headache', 
  'Fatigue', 'Chest Pain', 'Shortness of Breath', 'Abdominal Pain', 
  'Nausea', 'Vomiting', 'Dizziness', 'Joint Pain', 'Back Pain', 'Skin Rash'
];

const CLINIC_SERVICES_MASTER: { serviceName: ClinicServiceName; price: number; description: string }[] = [
  { serviceName: 'Consultation', price: 500, description: 'Physician clinical consultation & evaluation' },
  { serviceName: 'Injection', price: 150, description: 'Intramuscular / Subcutaneous injection administration' },
  { serviceName: 'Nebulization', price: 200, description: 'Bronchodilator / Saline nebulizer therapy' },
  { serviceName: 'Dressing', price: 250, description: 'Sterile wound dressing and antiseptic care' },
  { serviceName: 'ECG', price: 350, description: '12-lead clinical electrocardiogram' },
  { serviceName: 'IV Fluid', price: 450, description: 'Intravenous rehydration infusion' },
  { serviceName: 'Suture Removal', price: 300, description: 'Suture removal & post-closure inspection' },
  { serviceName: 'Other Service', price: 500, description: 'Minor clinical procedure or treatment' },
];

export const ConsultationWorkspace: React.FC<ConsultationWorkspaceProps> = ({
  appointmentId,
  onNavigate,
}) => {
  const { 
    appointments, 
    patients, 
    doctors, 
    currentDoctorId, 
    consultations, 
    prescriptions,
    bills,
    startConsultation,
    saveConsultationDraft,
    updateConsultationRecord,
    completeConsultation,
  } = useReception();

  const appointment = appointments.find((a) => a.id === appointmentId);
  const patient = patients.find((p) => p.id === appointment?.patientId);
  const currentDoctor = doctors.find((d) => d.id === currentDoctorId || d.id === `doc-${currentDoctorId}`) || doctors[0] || {
    id: '1',
    name: 'Dr. Sarah Khan',
    room: 'Room 101',
    specialization: 'General Medicine',
    consultationFee: 40,
  };
  const cleanDocId = (currentDoctor?.id || '1').replace('doc-', '');

  // Doctor Isolation Guard: Doctor can only access their own consultations!
  const isAuthorizedDoctor = !appointment || appointment.doctorId === currentDoctor.id || appointment.doctorId === cleanDocId || !appointment.doctorId;

  const existingConsultation = consultations.find((c) => c.appointmentId === appointmentId);
  const isAlreadyCompleted = existingConsultation?.status === 'Completed';

  // Filter patient's previous consultations (excluding currently open session)
  const patientPreviousConsultations = consultations.filter((c) => {
    const isPatientMatch = 
      (appointment && c.patientId === appointment.patientId) ||
      (patient && (c.patientId === patient.id || (c.patientUhid && c.patientUhid === patient.uhid)));
    const isCurrent = c.appointmentId === appointmentId || c.id === `cons-${appointmentId}`;
    return isPatientMatch && !isCurrent;
  }).sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  // Local Consultation Form State: Default to empty object, showing only manually entered data
  const [vitals, setVitals] = useState<Vitals>(() => {
    const existing = consultations.find((c) => c.appointmentId === appointmentId);
    if (existing?.vitals && Object.keys(existing.vitals).length > 0) {
      return existing.vitals;
    }
    return {};
  });

  const [chiefComplaint, setChiefComplaint] = useState(appointment?.reason || '');
  const [symptoms, setSymptoms] = useState<SymptomItem[]>([]);
  const [newSymptomName, setNewSymptomName] = useState('');

  const [physicalExamination, setPhysicalExamination] = useState(
    'Conscious, cooperative. Chest: clear to auscultation bilaterally. CVS: S1 S2 normal, no murmurs. Abdomen: soft, non-tender.'
  );

  const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>([]);
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [treatmentAdvice, setTreatmentAdvice] = useState(
    'Adequate rest and plenty of oral fluids. Avoid strenuous activities for 48 hours. Review if symptoms worsen.'
  );

  // Charges Section State
  const [charges, setCharges] = useState<ServiceChargeItem[]>(() => {
    const existing = consultations.find((c) => c.appointmentId === appointmentId);
    if (existing?.charges && existing.charges.length > 0) return existing.charges;
    const apptBill = bills.find((b) => b.appointmentId === appointmentId);
    if (apptBill?.charges && apptBill.charges.length > 0) return apptBill.charges;
    return [
      {
        id: `ch-${Date.now()}`,
        serviceName: 'Consultation',
        amount: currentDoctor?.consultationFee || 40,
        originalAmount: currentDoctor?.consultationFee || 40,
        notes: `${currentDoctor?.specialization || 'Clinical'} Consultation`,
      },
    ];
  });
  const [selectedServiceToAdd, setSelectedServiceToAdd] = useState<string>('Nebulization');
  const [collectNow, setCollectNow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');

  // Prescription Builder State
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([]);
  const [medName, setMedName] = useState('');
  const [medStrength, setMedStrength] = useState('500 mg');
  const [medDosage, setMedDosage] = useState('1 tablet');
  const [medFrequency, setMedFrequency] = useState('1-0-1');
  const [medDuration, setMedDuration] = useState('5 days');
  const [medTiming, setMedTiming] = useState('After food');
  const [medInstructions, setMedInstructions] = useState('');

  // Follow-up State
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [followUpNotes, setFollowUpNotes] = useState('Review progress and check response to medication.');

  // UI feedback & modals
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [activePrescriptionForPrint, setActivePrescriptionForPrint] = useState<Prescription | null>(null);

  // Track initialization per appointment to avoid overwriting active doctor inputs during background updates
  const initializedApptRef = useRef<string | null>(null);

  // Load existing draft if available or initialize draft
  useEffect(() => {
    if (initializedApptRef.current === appointmentId) {
      return;
    }

    const existing = consultations.find((c) => c.appointmentId === appointmentId);
    if (existing) {
      initializedApptRef.current = appointmentId;
      if (existing.vitals && Object.keys(existing.vitals).length > 0) {
        setVitals(existing.vitals);
      }
      if (existing.chiefComplaint) setChiefComplaint(existing.chiefComplaint);
      if (existing.symptoms && existing.symptoms.length > 0) {
        const seen = new Set<string>();
        const unique = existing.symptoms.filter((s) => {
          const key = (s.name || '').trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setSymptoms(unique);
      }
      if (existing.physicalExamination) setPhysicalExamination(existing.physicalExamination);
      if (existing.diagnoses && existing.diagnoses.length > 0) {
        const seen = new Set<string>();
        const unique = existing.diagnoses.filter((d) => {
          const key = (d.description || '').trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setDiagnoses(unique);
      }
      if (existing.clinicalFindings) setClinicalFindings(existing.clinicalFindings);
      if (existing.doctorNotes) setDoctorNotes(existing.doctorNotes);
      if (existing.treatmentAdvice) setTreatmentAdvice(existing.treatmentAdvice);
      if (existing.charges && existing.charges.length > 0) {
        setCharges(existing.charges);
      } else {
        const apptBill = bills.find((b) => b.appointmentId === appointmentId);
        if (apptBill && apptBill.charges && apptBill.charges.length > 0) {
          setCharges(apptBill.charges);
        }
      }
      if (existing.followUpRequired) {
        setFollowUpRequired(true);
        if (existing.followUpDate) setFollowUpDate(existing.followUpDate);
        if (existing.followUpNotes) setFollowUpNotes(existing.followUpNotes);
      }
    } else if (appointment && currentDoctor) {
      startConsultation(appointmentId, currentDoctor.id);
      initializedApptRef.current = appointmentId;
    }

    // Load existing prescription if exists for this consultation
    const existingRx = prescriptions.find((p) => p.appointmentId === appointmentId);
    if (existingRx && existingRx.medicines && existingRx.medicines.length > 0) {
      setMedicines(existingRx.medicines);
    }
  }, [appointmentId, consultations, appointment, currentDoctor, prescriptions]);

  // Recalculate BMI when height/weight change or clear when removed
  const handleVitalsChange = (field: keyof Vitals, rawVal: string) => {
    const trimmed = rawVal.trim();
    const val = trimmed === '' ? undefined : parseFloat(trimmed);
    const updated: Vitals = {
      ...vitals,
      [field]: val !== undefined && !isNaN(val) ? val : undefined,
    };
    if (updated.height && updated.weight) {
      const hMeters = updated.height / 100;
      updated.bmi = parseFloat((updated.weight / (hMeters * hMeters)).toFixed(1));
    } else {
      delete updated.bmi;
    }
    setVitals(updated);
  };

  // Add Symptom
  const handleAddSymptom = (nameToAdd?: string) => {
    const sym = (nameToAdd || newSymptomName).trim();
    if (!sym) return;
    if (symptoms.some((s) => s.name.toLowerCase() === sym.toLowerCase())) return;

    setSymptoms([
      ...symptoms,
      {
        id: `sym-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: sym,
      },
    ]);
    setNewSymptomName('');
  };

  const handleRemoveSymptom = (id: string) => {
    setSymptoms(symptoms.filter((s) => s.id !== id));
  };

  // Add Service Charge
  const handleAddServiceCharge = () => {
    const master = CLINIC_SERVICES_MASTER.find((s) => s.serviceName === selectedServiceToAdd);
    if (!master) return;

    const newCharge: ServiceChargeItem = {
      id: `ch-${Date.now()}-${Math.random()}`,
      serviceName: master.serviceName,
      amount: master.price,
      originalAmount: master.price,
      notes: master.description,
    };
    setCharges([...charges, newCharge]);
  };

  const handleRemoveCharge = (id: string) => {
    setCharges(charges.filter((c) => c.id !== id));
  };

  // Add Medicine to Prescription
  const handleAddMedicine = () => {
    if (!medName.trim()) return;

    const newMed: PrescriptionMedicine = {
      id: `med-${Date.now()}`,
      name: medName.trim(),
      strength: medStrength,
      dosage: medDosage,
      frequency: medFrequency,
      duration: medDuration,
      route: 'Oral',
      timing: medTiming,
      quantity: 10,
      instructions: medInstructions || 'Take as instructed after meals',
    };

    setMedicines([...medicines, newMed]);
    setMedName('');
    setMedInstructions('');
  };

  const handleRemoveMedicine = (id: string) => {
    setMedicines(medicines.filter((m) => m.id !== id));
  };

  // Total Charges
  const totalChargesAmount = charges.reduce((sum, c) => sum + c.amount, 0);

  // Save Draft Handler
  const handleSaveDraft = async () => {
    if (!appointment || isSavingDraft) return;

    setIsSavingDraft(true);
    try {
      const existing = consultations.find((c) => c.appointmentId === appointmentId);
      const consId = existing?.id || `cons-${appointmentId}`;

      // Deduplicate symptoms & diagnoses before saving
      const seenSym = new Set<string>();
      const cleanSymptoms = symptoms.filter((s) => {
        const key = (s.name || '').trim().toLowerCase();
        if (!key || seenSym.has(key)) return false;
        seenSym.add(key);
        return true;
      });

      const seenDiag = new Set<string>();
      const cleanDiagnoses = diagnoses.filter((d) => {
        const key = (d.description || '').trim().toLowerCase();
        if (!key || seenDiag.has(key)) return false;
        seenDiag.add(key);
        return true;
      });

      const cleanVitals: Vitals = Object.fromEntries(
        Object.entries(vitals).filter(([_, v]) => typeof v === 'number' && !isNaN(v))
      );

      const draftData: Partial<Consultation> & { id: string } = {
        id: consId,
        appointmentId,
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        patientUhid: appointment.patientUhid,
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        date: appointment.date,
        startedAt: existing?.startedAt || '09:00 AM',
        status: existing?.status === 'Completed' ? 'Completed' : 'In Progress',
        vitals: cleanVitals,
        chiefComplaint,
        symptoms: cleanSymptoms,
        physicalExamination,
        diagnoses: cleanDiagnoses,
        clinicalFindings,
        doctorNotes,
        treatmentAdvice,
        charges,
        followUpRequired,
        followUpDate: followUpRequired ? followUpDate : undefined,
        followUpNotes: followUpRequired ? followUpNotes : undefined,
      };

      saveConsultationDraft(draftData);
      setDraftSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } finally {
      setTimeout(() => setIsSavingDraft(false), 300);
    }
  };

  // Update Consultation Handler (for already completed consultations)
  const handleUpdateConsultation = async () => {
    if (!appointment || isCompleting) return;
    const existing = consultations.find((c) => c.appointmentId === appointmentId);
    const consId = existing?.id || `cons-${appointmentId}`;

    const cleanVitals: Vitals = Object.fromEntries(
      Object.entries(vitals).filter(([_, v]) => typeof v === 'number' && !isNaN(v))
    );

    const consultationRecord: Consultation = {
      id: consId,
      appointmentId,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      patientUhid: appointment.patientUhid,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      date: appointment.date,
      startedAt: existing?.startedAt || '09:00 AM',
      completedAt: existing?.completedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Completed',
      vitals: cleanVitals,
      chiefComplaint,
      symptoms,
      physicalExamination,
      diagnoses,
      clinicalFindings,
      doctorNotes,
      treatmentAdvice,
      charges,
      followUpRequired,
      followUpDate: followUpRequired ? followUpDate : undefined,
      followUpNotes: followUpRequired ? followUpNotes : undefined,
    };

    setIsCompleting(true);
    try {
      await updateConsultationRecord(consId, consultationRecord);
      setDraftSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } finally {
      setIsCompleting(false);
    }
  };

  // Complete Consultation Handler
  const handleCompleteConsultation = async () => {
    if (!appointment || isCompleting) return;

    const existing = consultations.find((c) => c.appointmentId === appointmentId);
    const consId = existing?.id || `cons-${appointmentId}`;

    const cleanVitals: Vitals = Object.fromEntries(
      Object.entries(vitals).filter(([_, v]) => typeof v === 'number' && !isNaN(v))
    );

    const consultationRecord: Consultation = {
      id: consId,
      appointmentId,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      patientUhid: appointment.patientUhid,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      date: appointment.date,
      startedAt: '09:00 AM',
      status: 'Completed',
      vitals: cleanVitals,
      chiefComplaint,
      symptoms,
      physicalExamination,
      diagnoses,
      clinicalFindings,
      doctorNotes,
      treatmentAdvice,
      charges,
      followUpRequired,
      followUpDate: followUpRequired ? followUpDate : undefined,
      followUpNotes: followUpRequired ? followUpNotes : undefined,
    };

    const prescriptionPayload = medicines.length > 0 ? {
      patientAge: patient?.age || 35,
      patientGender: patient?.gender || 'Adult',
      patientPhone: patient?.mobile || '',
      medicines,
      dietAndLifestyle: 'Low salt, adequate water intake, avoid allergens',
    } : undefined;

    setIsCompleting(true);
    try {
      await completeConsultation(
        consultationRecord,
        charges,
        prescriptionPayload,
        followUpRequired ? { required: true, date: followUpDate, notes: followUpNotes } : undefined,
        { collectNow, paymentMethod }
      );
    } finally {
      setIsCompleting(false);
      setShowCompleteModal(false);
      onNavigate('/doctor/appointments');
    }
  };

  // Preview A4 Prescription
  const handleOpenPrescriptionPreview = () => {
    if (!appointment) return;

    const tempRx: Prescription = {
      id: `temp-rx-${Date.now()}`,
      rxNumber: `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      patientUhid: appointment.patientUhid,
      patientAge: patient?.age || 35,
      patientGender: patient?.gender || 'Adult',
      patientPhone: patient?.mobile || '',
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      doctorSpecialization: currentDoctor?.specialization || 'General Medicine',
      doctorRoom: currentDoctor?.room || 'Room 101',
      date: appointment.date,
      diagnoses: diagnoses.map((d) => d.description),
      medicines,
      generalAdvice: treatmentAdvice,
      followUpDate: followUpRequired ? followUpDate : undefined,
      followUpNotes: followUpRequired ? followUpNotes : undefined,
      status: 'Created',
      createdAt: `${appointment.date} Just now`,
    };

    setActivePrescriptionForPrint(tempRx);
    setIsPrescriptionModalOpen(true);
  };

  // Authorization Protection Screen
  if (!isAuthorizedDoctor) {
    return (
      <div className="bg-white rounded-3xl border border-[#F1E4E1] p-8 text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#18212F]">
          Doctor Authorization Restriction
        </h2>
        <p className="text-xs text-[#667085] leading-relaxed">
          This consultation is assigned to another attending physician. Under strict clinic patient-doctor isolation protocols, physicians can only view and document their own active patient consultations.
        </p>
        <button
          onClick={() => onNavigate('/doctor/appointments')}
          className="px-5 py-2.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs"
        >
          Return to Appointments
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      
      {/* 1. Top Bar Navigation & Autosave Status */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('/doctor/appointments')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#18212F] py-1.5 px-3 rounded-xl hover:bg-white border border-transparent hover:border-[#F1E4E1] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Appointments</span>
        </button>

        <div className="flex items-center gap-3">
          {draftSavedTime && (
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Draft saved at {draftSavedTime}</span>
            </span>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#18212F] bg-white border border-[#F1E4E1] hover:bg-[#FFF9F7] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-[#667085]" />
            <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
          </button>
        </div>
      </div>

      {/* 2. Patient Header Banner */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0">
              {patient?.fullName.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-[#18212F]">
                  {patient?.fullName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#F76762]/10 text-[#F76762]">
                  {appointment?.token || 'Token'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {appointment?.type || 'Consultation'}
                </span>
                {isAlreadyCompleted && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>Completed Visit (Edit Mode)</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-[#667085] mt-1 flex-wrap">
                <span className="font-mono font-semibold text-[#18212F]">{patient?.uhid}</span>
                <span>·</span>
                <span>{patient?.age} Years · {patient?.gender}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#667085]" />
                  <span>{patient?.mobile}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Consultation Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {isAlreadyCompleted ? (
              <button
                type="button"
                onClick={handleUpdateConsultation}
                disabled={isCompleting}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isCompleting ? 'Saving...' : 'Update Consultation'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="px-3 py-1.5 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
              </button>
            )}
            <button
              onClick={() => onNavigate(patient ? `/doctor/history/${patient.id}` : '/doctor/history')}
              className="px-3 py-1.5 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl transition-colors cursor-pointer"
            >
              Full Profile & History
            </button>
            <button
              onClick={handleOpenPrescriptionPreview}
              className="px-3 py-1.5 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#F76762] border border-[#F1E4E1] rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Preview Rx</span>
            </button>
          </div>

        </div>

        {/* Allergy & Existing Condition Warnings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[#F1E4E1]">
          <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-200/80 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-red-900 block">Known Allergies:</span>
              <span className="text-red-700 font-semibold">{patient?.allergies || 'No documented drug allergies'}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
            <Heart className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-900 block">Existing Medical Conditions:</span>
              <span className="text-amber-800">{patient?.medicalConditions || 'None reported'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Two-Column Clinical Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Col 4): Patient Clinical Context & Vitals */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Vitals Recording Panel */}
          <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#F76762]" />
                <h3 className="text-xs font-bold text-[#18212F] uppercase tracking-wider">
                  Patient Vitals
                </h3>
              </div>
              {Object.values(vitals).some((v) => v !== undefined && v !== null && v !== '') ? (
                <button
                  type="button"
                  onClick={() => setVitals({})}
                  className="text-[10px] text-red-500 hover:text-red-700 cursor-pointer font-medium hover:underline"
                >
                  Clear Vitals
                </button>
              ) : (
                <span className="text-[10px] text-[#667085] font-semibold">Standard Units</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* BP */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#667085]">Blood Pressure</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={vitals.bloodPressureSystolic !== undefined ? vitals.bloodPressureSystolic : ''}
                    onChange={(e) => handleVitalsChange('bloodPressureSystolic', e.target.value)}
                    placeholder="e.g. 120"
                    className="w-full px-2.5 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-lg text-xs font-mono font-semibold text-[#18212F] focus:outline-none focus:border-[#F76762]"
                  />
                  <span className="text-[#667085]">/</span>
                  <input
                    type="number"
                    value={vitals.bloodPressureDiastolic !== undefined ? vitals.bloodPressureDiastolic : ''}
                    onChange={(e) => handleVitalsChange('bloodPressureDiastolic', e.target.value)}
                    placeholder="e.g. 80"
                    className="w-full px-2.5 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-lg text-xs font-mono font-semibold text-[#18212F] focus:outline-none focus:border-[#F76762]"
                  />
                </div>
                <span className="text-[10px] text-[#667085]">mmHg</span>
              </div>

              {/* Pulse */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#667085]">Pulse Rate</label>
                <input
                  type="number"
                  value={vitals.pulse !== undefined ? vitals.pulse : ''}
                  onChange={(e) => handleVitalsChange('pulse', e.target.value)}
                  placeholder="e.g. 72"
                  className="w-full px-2.5 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-lg text-xs font-mono font-semibold text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
                <span className="text-[10px] text-[#667085]">bpm</span>
              </div>

              {/* SpO2 */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#667085]">Oxygen (SpO2)</label>
                <input
                  type="number"
                  value={vitals.spO2 !== undefined ? vitals.spO2 : ''}
                  onChange={(e) => handleVitalsChange('spO2', e.target.value)}
                  placeholder="e.g. 98"
                  className="w-full px-2.5 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-lg text-xs font-mono font-semibold text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
                <span className="text-[10px] text-[#667085]">%</span>
              </div>

              {/* Temperature */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#667085]">Temperature</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temperature !== undefined ? vitals.temperature : ''}
                  onChange={(e) => handleVitalsChange('temperature', e.target.value)}
                  placeholder="e.g. 37.0"
                  className="w-full px-2.5 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-lg text-xs font-mono font-semibold text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
                <span className="text-[10px] text-[#667085]">°C</span>
              </div>

              {/* Height */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#667085]">Height</label>
                <input
                  type="number"
                  value={vitals.height !== undefined ? vitals.height : ''}
                  onChange={(e) => handleVitalsChange('height', e.target.value)}
                  placeholder="e.g. 170"
                  className="w-full px-2.5 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-lg text-xs font-mono text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
                <span className="text-[10px] text-[#667085]">cm</span>
              </div>

              {/* Weight & BMI */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-[#667085]">Weight</label>
                  {vitals.bmi ? (
                    <span className="text-[10px] font-bold text-[#F76762]">BMI: {vitals.bmi}</span>
                  ) : null}
                </div>
                <input
                  type="number"
                  value={vitals.weight !== undefined ? vitals.weight : ''}
                  onChange={(e) => handleVitalsChange('weight', e.target.value)}
                  placeholder="e.g. 70"
                  className="w-full px-2.5 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-lg text-xs font-mono text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
                <span className="text-[10px] text-[#667085]">kg</span>
              </div>
            </div>
          </div>

          {/* Patient Previous History Tabular Card */}
          <div className="bg-white rounded-2xl border border-[#F1E4E1] p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#F76762]" />
                <h3 className="text-xs font-bold text-[#18212F] uppercase tracking-wider">
                  Patient Previous History
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-[#667085] bg-[#FFF9F7] px-2 py-0.5 rounded-full border border-[#F1E4E1]">
                {patientPreviousConsultations.length > 0 ? `${patientPreviousConsultations.length} Visits` : 'No Prior Visits'}
              </span>
            </div>

            {patientPreviousConsultations.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-[#F1E4E1]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FFF9F7] border-b border-[#F1E4E1] text-[10px] font-bold text-[#667085] uppercase tracking-wider">
                      <th className="py-2.5 px-3 whitespace-nowrap">Appointment</th>
                      <th className="py-2.5 px-3">Causes (Symptoms)</th>
                      <th className="py-2.5 px-3">Prescription</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1E4E1]/80 bg-white">
                    {patientPreviousConsultations.map((prevCons) => {
                      const prevRx = prescriptions.find(
                        (p) =>
                          (prevCons.appointmentId && p.appointmentId === prevCons.appointmentId) ||
                          (p.patientId === prevCons.patientId && p.date === prevCons.date)
                      );

                      // Extract causes / symptoms
                      const symptomsList = prevCons.symptoms && prevCons.symptoms.length > 0 
                        ? prevCons.symptoms 
                        : [];
                      const chiefComplaintText = prevCons.chiefComplaint;

                      return (
                        <tr key={prevCons.id} className="hover:bg-[#FFF9F7]/50 transition-colors align-top">
                          {/* Column 1: Appointment History */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-semibold text-[#18212F] flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#F76762] shrink-0" />
                              <span>{prevCons.date}</span>
                            </div>
                            <div className="text-[10px] text-[#667085] mt-0.5">
                              {prevCons.doctorName ? `Dr. ${prevCons.doctorName.replace(/^Dr\.\s*/i, '')}` : 'Doctor Visit'}
                            </div>
                            <span className={`inline-block px-1.5 py-0.5 mt-1 rounded text-[9px] font-bold ${
                              prevCons.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {prevCons.status}
                            </span>
                            {prevCons.appointmentId && (
                              <div className="mt-1">
                                <button
                                  type="button"
                                  onClick={() => onNavigate(`/doctor/consultation/${prevCons.appointmentId}`)}
                                  className="text-[10px] font-bold text-[#F76762] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>Review</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Column 2: Causes (Symptoms like fever, cough) */}
                          <td className="py-2.5 px-3">
                            {symptomsList.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {symptomsList.map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FFF4F2] text-[#D94F4A] border border-[#FADCD8]"
                                  >
                                    {s.name}
                                    {s.duration ? ` (${s.duration})` : ''}
                                  </span>
                                ))}
                              </div>
                            ) : chiefComplaintText ? (
                              <span className="text-[11px] text-[#18212F] font-medium">
                                {chiefComplaintText}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#98A2B3] italic">None recorded</span>
                            )}
                          </td>

                          {/* Column 3: Prescription */}
                          <td className="py-2.5 px-3">
                            {prevRx && prevRx.medicines && prevRx.medicines.length > 0 ? (
                              <div className="space-y-1">
                                {prevRx.medicines.map((m, idx) => (
                                  <div key={idx} className="text-[11px] leading-tight">
                                    <span className="font-semibold text-[#18212F]">{m.name}</span>
                                    {(m.strength || m.frequency) && (
                                      <span className="text-[10px] text-[#667085] ml-1">
                                        ({[m.strength, m.frequency, m.duration].filter(Boolean).join(' · ')})
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#98A2B3] italic">No Rx recorded</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#FFF9F7] border border-dashed border-[#F1E4E1] text-center space-y-1">
                <Sparkles className="w-5 h-5 text-[#F76762] mx-auto opacity-70" />
                <div className="text-xs font-semibold text-[#18212F]">Initial Consultation Visit</div>
                <p className="text-[11px] text-[#667085]">
                  No prior history recorded for {patient?.fullName || 'this patient'}.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Col 8): Clinical Documentation & Prescription Workspace */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Symptoms & Clinical Manifestations */}
          <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#18212F] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#F76762]" />
                <span>Symptoms & Clinical Manifestations</span>
              </label>
              <span className="text-[11px] text-[#667085]">Click quick chip or type below</span>
            </div>

            {/* Quick symptom chip cloud */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SYMPTOMS.slice(0, 12).map((sym) => {
                const isSelected = symptoms.some((s) => s.name.toLowerCase() === sym.toLowerCase());
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        const found = symptoms.find((s) => s.name.toLowerCase() === sym.toLowerCase());
                        if (found) handleRemoveSymptom(found.id);
                      } else {
                        handleAddSymptom(sym);
                      }
                    }}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-[#F76762]/10 border-[#F76762] text-[#F76762] font-semibold'
                        : 'bg-[#FFF9F7] hover:bg-[#F76762]/10 border-[#F1E4E1] text-[#18212F]'
                    }`}
                  >
                    <span className="text-xs">{isSelected ? '✓' : '+'}</span>
                    <span>{sym}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Symptoms Chips */}
            {symptoms.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                    Selected Symptoms ({symptoms.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSymptoms([])}
                    className="text-[11px] text-[#F76762] hover:underline cursor-pointer font-medium"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((s) => (
                    <span
                      key={s.id}
                      className="px-3 py-1.5 bg-[#FFF9F7] border border-[#F76762]/30 rounded-xl text-xs font-semibold text-[#18212F] flex items-center gap-2 shadow-2xs group hover:border-[#F76762] transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F76762]" />
                      <span>{s.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSymptom(s.id)}
                        className="text-[#667085] hover:text-red-600 p-0.5 cursor-pointer transition-colors"
                        title={`Remove ${s.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Symptom Input Line */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Type symptom and press Enter..."
                value={newSymptomName}
                onChange={(e) => setNewSymptomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSymptom();
                  }
                }}
                className="flex-1 px-3.5 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] placeholder-[#98A2B3] focus:outline-none focus:border-[#F76762] transition-colors"
              />
              <button
                type="button"
                onClick={() => handleAddSymptom()}
                disabled={!newSymptomName.trim()}
                className="px-4 py-2 bg-[#18212F] hover:bg-[#F76762] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-40 disabled:hover:bg-[#18212F] disabled:cursor-not-allowed shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Symptom</span>
              </button>
            </div>
          </div>

          {/* Section 2: Physical Examination & Clinical Notes */}
          <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-3">
            <label className="text-xs font-bold text-[#18212F] uppercase tracking-wider block">
              Physical Examination & Clinical Notes
            </label>
            <textarea
              rows={3}
              value={physicalExamination}
              onChange={(e) => setPhysicalExamination(e.target.value)}
              placeholder="Clinical examination notes, systemic exam, signs..."
              className="w-full p-3 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
            />
          </div>

          {/* Section 3: Consultation Service Charges Panel */}
          <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#F76762]" />
                <h3 className="text-xs font-bold text-[#18212F] uppercase tracking-wider">
                  Services & Charges (Itemized)
                </h3>
              </div>
              <span className="text-xs font-bold text-[#18212F]">
                Total: ₹{totalChargesAmount.toFixed(2)}
              </span>
            </div>

            {/* Current Itemized Charges Table */}
            <div className="border border-[#F1E4E1] rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FFF9F7] text-[10px] uppercase font-bold text-[#667085]">
                  <tr>
                    <th className="p-2.5">Service</th>
                    <th className="p-2.5">Notes</th>
                    <th className="p-2.5 text-right">Fee</th>
                    <th className="p-2.5 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1E4E1]">
                  {charges.map((ch) => (
                    <tr key={ch.id}>
                      <td className="p-2.5 font-bold text-[#18212F]">{ch.serviceName}</td>
                      <td className="p-2.5 text-[11px] text-[#667085]">{ch.notes || 'Clinic service'}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#18212F]">
                        ₹{ch.amount.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right">
                        {ch.serviceName !== 'Consultation' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCharge(ch.id)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Service from Master */}
            <div className="flex items-center gap-2 pt-1">
              <select
                value={selectedServiceToAdd}
                onChange={(e) => setSelectedServiceToAdd(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs font-semibold text-[#18212F] focus:outline-none focus:border-[#F76762] cursor-pointer"
              >
                {CLINIC_SERVICES_MASTER.filter((s) => s.serviceName !== 'Consultation').map((s) => (
                  <option key={s.serviceName} value={s.serviceName}>
                    {s.serviceName} (₹{s.price.toFixed(2)}) — {s.description}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddServiceCharge}
                className="px-3.5 py-1.5 bg-[#18212F] text-white text-xs font-semibold rounded-xl hover:bg-[#F76762] transition-colors cursor-pointer shrink-0"
              >
                + Add Service
              </button>
            </div>

            {/* Payment Collection Option: Collect Now vs Send to Reception */}
            <div className="pt-3 border-t border-[#F1E4E1] space-y-2">
              <div className="text-[11px] font-bold text-[#18212F] uppercase tracking-wider">
                Payment Collection Mode:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                
                {/* Send to Reception */}
                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  !collectNow 
                    ? 'bg-[#FFF9F7] border-[#F76762] text-[#18212F]' 
                    : 'bg-white border-[#F1E4E1] text-[#667085]'
                }`}>
                  <input
                    type="radio"
                    name="collectionMode"
                    checked={!collectNow}
                    onChange={() => setCollectNow(false)}
                    className="mt-0.5 text-[#F76762]"
                  />
                  <div>
                    <span className="font-bold block">Send to Reception Desk</span>
                    <span className="text-[10px] text-[#667085]">
                      Generates pending invoice. Front desk receptionist collects payment.
                    </span>
                  </div>
                </label>

                {/* Collect Now by Doctor */}
                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  collectNow 
                    ? 'bg-[#FFF9F7] border-[#F76762] text-[#18212F]' 
                    : 'bg-white border-[#F1E4E1] text-[#667085]'
                }`}>
                  <input
                    type="radio"
                    name="collectionMode"
                    checked={collectNow}
                    onChange={() => setCollectNow(true)}
                    className="mt-0.5 text-[#F76762]"
                  />
                  <div>
                    <span className="font-bold block">Collect Payment in Room</span>
                    <span className="text-[10px] text-[#667085]">
                      Doctor receives cash/UPI directly. Marked Paid immediately.
                    </span>
                  </div>
                </label>

              </div>

              {/* Doctor Collection Method Selector */}
              {collectNow && (
                <div className="p-3 bg-[#FFF9F7] rounded-xl border border-[#F1E4E1] flex items-center justify-between gap-4 mt-2">
                  <span className="text-xs font-semibold text-[#18212F]">Payment Received Via:</span>
                  <div className="flex gap-2">
                    {(['Cash', 'UPI', 'Card'] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                          paymentMethod === m 
                            ? 'bg-white border-[#F76762] text-[#F76762] shadow-2xs' 
                            : 'bg-transparent border-[#F1E4E1] text-[#667085]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Section 4: Digital Prescription Builder */}
          <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-[#F76762]" />
                <h3 className="text-xs font-bold text-[#18212F] uppercase tracking-wider">
                  Digital Prescription Builder
                </h3>
              </div>
              <button
                type="button"
                onClick={handleOpenPrescriptionPreview}
                className="text-xs font-bold text-[#F76762] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Preview A4 Sheet</span>
              </button>
            </div>

            {/* Prescribed Medications List Table */}
            {medicines.length > 0 ? (
              <div className="border border-[#F1E4E1] rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FFF9F7] text-[10px] uppercase font-bold text-[#667085]">
                    <tr>
                      <th className="p-2.5">Medicine</th>
                      <th className="p-2.5">Strength</th>
                      <th className="p-2.5">Frequency</th>
                      <th className="p-2.5">Duration</th>
                      <th className="p-2.5">Timing</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1E4E1]">
                    {medicines.map((m) => (
                      <tr key={m.id}>
                        <td className="p-2.5 font-bold text-[#18212F]">{m.name}</td>
                        <td className="p-2.5 text-[#667085]">{m.strength}</td>
                        <td className="p-2.5 font-mono font-bold text-[#F76762]">{m.frequency}</td>
                        <td className="p-2.5 text-[#667085]">{m.duration}</td>
                        <td className="p-2.5 text-[#667085]">{m.timing}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(m.id)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#FFF9F7]/60 border border-dashed border-[#F1E4E1] text-center text-xs text-[#667085]">
                No medications added yet. Use the fields below to prescribe medicines.
              </div>
            )}

            {/* Add Medicine Inputs */}
            <div className="p-3.5 bg-[#FFF9F7] rounded-xl border border-[#F1E4E1] space-y-3">
              <div className="font-semibold text-xs text-[#18212F]">
                + Add Medication
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Medicine name (e.g. Paracetamol)"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#F1E4E1] rounded-lg text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
                <input
                  type="text"
                  placeholder="Strength (e.g. 500 mg)"
                  value={medStrength}
                  onChange={(e) => setMedStrength(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#F1E4E1] rounded-lg text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
                <select
                  value={medFrequency}
                  onChange={(e) => setMedFrequency(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#F1E4E1] rounded-lg text-[#18212F] focus:outline-none focus:border-[#F76762]"
                >
                  <option value="1-0-1">1-0-1 (Morning & Night)</option>
                  <option value="1-1-1">1-1-1 (Three times a day)</option>
                  <option value="1-0-0">1-0-0 (Morning only)</option>
                  <option value="0-0-1">0-0-1 (Bedtime only)</option>
                  <option value="Once daily">Once daily</option>
                  <option value="SOS / As needed">SOS / As needed</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Duration (e.g. 5 days)"
                  value={medDuration}
                  onChange={(e) => setMedDuration(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#F1E4E1] rounded-lg text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
                <select
                  value={medTiming}
                  onChange={(e) => setMedTiming(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#F1E4E1] rounded-lg text-[#18212F] focus:outline-none focus:border-[#F76762]"
                >
                  <option value="After food">After food</option>
                  <option value="Before food">Before food (Empty stomach)</option>
                  <option value="With meals">With meals</option>
                  <option value="At bedtime">At bedtime</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddMedicine}
                  className="px-4 py-1.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white text-xs font-semibold rounded-lg hover:opacity-95 shadow-2xs transition-all cursor-pointer"
                >
                  Add Medicine
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Follow-up Scheduling */}
          <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#18212F] uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#F76762]" />
                <span>Next Follow-up Appointment</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#18212F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                  className="rounded text-[#F76762]"
                />
                <span>Follow-up Recommended</span>
              </label>
            </div>

            {followUpRequired && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-[#667085] block mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#667085] block mb-1">
                    Follow-up Objective
                  </label>
                  <input
                    type="text"
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="e.g. BP re-evaluation & lab results"
                    className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 4. Sticky Bottom Consultation Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F1E4E1] py-3 px-4 sm:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#18212F]">
              Patient: <span className="font-bold">{appointment?.patientName}</span>
            </span>
            <span className="text-[#667085] hidden sm:inline">·</span>
            <span className="text-xs text-[#667085] hidden sm:inline font-mono">
              Token {appointment?.token}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="px-4 py-2 bg-white hover:bg-[#FFF9F7] text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
            >
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              type="button"
              onClick={handleOpenPrescriptionPreview}
              className="px-4 py-2 bg-white hover:bg-[#FFF9F7] text-xs font-semibold text-[#F76762] border border-[#F1E4E1] rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Preview Rx</span>
            </button>

            {isAlreadyCompleted ? (
              <button
                type="button"
                onClick={handleUpdateConsultation}
                disabled={isCompleting}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCompleting ? 'Saving Updates...' : 'Update Consultation & Vitals'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCompleteModal(true)}
                className="px-5 py-2 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-md shadow-[#F76762]/20 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Consultation</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Confirmation Modal for Consultation Completion */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-[#18212F]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#F1E4E1] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#18212F]">
                Finalize & Complete Consultation?
              </h3>
              <p className="text-xs text-[#667085]">
                This will mark Token <span className="font-bold">{appointment?.token}</span> as Completed, issue the digital prescription, and process {collectNow ? 'direct doctor collection' : 'pending charges to Reception Desk'}.
              </p>
            </div>

            <div className="p-3 bg-[#FFF9F7] rounded-xl border border-[#F1E4E1] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#667085]">Total Services Fee:</span>
                <span className="font-bold text-[#18212F]">₹{totalChargesAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Collection Mode:</span>
                <span className="font-bold text-[#F76762]">
                  {collectNow ? `Paid in room via ${paymentMethod}` : 'Send to Reception Desk'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Prescription:</span>
                <span className="font-semibold text-[#18212F]">
                  {medicines.length > 0 ? `${medicines.length} medications` : 'None'}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-[#18212F] rounded-xl cursor-pointer transition-colors"
              >
                Review Again
              </button>
              <button
                type="button"
                onClick={handleCompleteConsultation}
                disabled={isCompleting}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                {isCompleting ? 'Finalizing...' : 'Confirm & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A4 Prescription Preview Modal */}
      <PrescriptionA4Modal
        prescription={activePrescriptionForPrint}
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
      />

    </div>
  );
};
