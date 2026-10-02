import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Stethoscope,
  Calendar,
  Activity,
  FileText,
  Repeat,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Pill,
  Printer,
  ArrowRight,
  Sparkles,
  Filter,
  Check,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  X
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { Prescription } from '../../../types/doctor';
import { PrescriptionA4Modal } from '../modals/PrescriptionA4Modal';
import { getPatientAgeDisplay } from '../../../utils/validation';

interface DoctorHistoryViewProps {
  initialPatientId?: string;
  onNavigate: (route: string) => void;
}

export const DoctorHistoryView: React.FC<DoctorHistoryViewProps> = ({
  initialPatientId,
  onNavigate
}) => {
  const {
    consultations,
    patients,
    currentDoctorId,
    doctors,
    prescriptions,
    followUps,
    appointments
  } = useReception();

  const currentDoctor = doctors.find((d) => d.id === currentDoctorId || d.id === `doc-${currentDoctorId}`) || doctors[0] || {
    id: '1',
    name: 'Dr. Sarah Khan',
    specialization: 'General Medicine',
    room: 'Room 101',
    code: 'DOC-1',
  };
  const cleanDocId = (currentDoctor?.id || '1').replace('doc-', '');

  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'consultations' | 'prescriptions' | 'vitals'>('all');
  const [patientScope, setPatientScope] = useState<'my' | 'all'>('my');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDetailsModalOpen(false);
      }
    };
    if (isDetailsModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailsModalOpen]);

  // Modal for Prescription Print
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [selectedRxForPrint, setSelectedRxForPrint] = useState<Prescription | null>(null);

  // Sync initialPatientId if passed via props
  useEffect(() => {
    if (initialPatientId && initialPatientId !== selectedPatientId) {
      setSelectedPatientId(initialPatientId);
    }
  }, [initialPatientId]);

  // Consultations conducted by current doctor
  const myConsultations = consultations.filter((c) =>
    c.doctorId === currentDoctor.id ||
    c.doctorId === cleanDocId ||
    (c.doctorName && currentDoctor.name && c.doctorName.toLowerCase().includes(currentDoctor.name.toLowerCase()))
  );

  // My patients (seen or booked with current doctor)
  const myDoctorPatientIds = Array.from(new Set([
    ...myConsultations.map((c) => c.patientId),
    ...appointments.filter((a) => a.doctorId === currentDoctor.id || a.doctorId === cleanDocId).map((a) => a.patientId)
  ]));

  // Auto-fallback to 'all' if no patients for 'my'
  const effectiveScope = patientScope === 'my' && myDoctorPatientIds.length === 0 ? 'all' : patientScope;

  // Patients list based on scope
  const scopedPatients = effectiveScope === 'my'
    ? patients.filter((p) => myDoctorPatientIds.includes(p.id))
    : patients;

  // Filtered patients for selector / search
  const filteredPatients = scopedPatients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      (p.mobile && p.mobile.includes(q))
    );
  });

  // Default to first patient if not set
  const activePatientId = selectedPatientId || (scopedPatients[0]?.id ?? patients[0]?.id ?? '');
  const activePatient = patients.find((p) => p.id === activePatientId) || scopedPatients[0] || patients[0];

  // All consultations, prescriptions, follow-ups, and appointments for this patient
  const allPatientConsultations = consultations.filter((c) =>
    c.patientId === activePatient?.id || (activePatient?.uhid && c.patientUhid === activePatient.uhid)
  ).sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  const myConsultationsWithThisPatient = allPatientConsultations.filter((c) =>
    c.doctorId === currentDoctor.id ||
    c.doctorId === cleanDocId ||
    (c.doctorName && currentDoctor.name && c.doctorName.toLowerCase().includes(currentDoctor.name.toLowerCase()))
  );

  const patientPrescriptions = prescriptions.filter((p) =>
    p.patientId === activePatient?.id || (activePatient?.uhid && p.patientUhid === activePatient.uhid)
  ).sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  const patientFollowUps = followUps.filter((f) =>
    f.patientId === activePatient?.id || (activePatient?.uhid && f.patientUhid === activePatient.uhid)
  );

  const activeAppointment = appointments.find((a) =>
    (a.patientId === activePatient?.id || (activePatient?.uhid && a.patientUhid === activePatient.uhid)) &&
    (a.status === 'Waiting' || a.status === 'In Consultation' || a.status === 'Scheduled')
  );

  // Latest recorded vitals
  const latestConsultWithVitals = allPatientConsultations.find((c) =>
    c.vitals && (c.vitals.bloodPressureSystolic || c.vitals.pulse || c.vitals.height || c.vitals.weight)
  );
  const latestVitals = latestConsultWithVitals?.vitals;

  // Has documented allergies
  const hasAllergies = activePatient?.allergies &&
    activePatient.allergies.toLowerCase() !== 'none' &&
    activePatient.allergies.toLowerCase() !== 'none reported' &&
    activePatient.allergies.toLowerCase() !== 'no documented drug allergies';

  // Print Rx handler
  const handleOpenRxPrint = (rx: Prescription) => {
    setSelectedRxForPrint(rx);
    setIsRxModalOpen(true);
  };

  return (
    <div className="space-y-6">

      {/* 1. Top Bar: Title & Directory Scope Switcher */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#18212F] flex items-center gap-2">
            <History className="w-5 h-5 text-[#F76762]" />
            <span>Doctor Patient History — {currentDoctor.name}</span>
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Complete electronic medical record, longitudinal vitals progression, clinical notes, and aligned overall patient details.
          </p>
        </div>

        {/* Directory Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Scope Toggle */}
          <div className="flex items-center bg-[#FFF9F7] p-1 border border-[#F1E4E1] rounded-xl text-xs font-semibold">
            <button
              onClick={() => setPatientScope('my')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${patientScope === 'my'
                  ? 'bg-[#18212F] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#18212F]'
                }`}
            >
              My Patients ({myDoctorPatientIds.length})
            </button>
            <button
              onClick={() => setPatientScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${patientScope === 'all'
                  ? 'bg-[#18212F] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#18212F]'
                }`}
            >
              All Clinic ({patients.length})
            </button>
          </div>

          {/* Toggle Directory Panel */}
          <button
            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl transition-colors cursor-pointer shadow-2xs"
            title={isLeftPanelCollapsed ? 'Show patient directory panel' : 'Hide patient directory panel'}
          >
            {isLeftPanelCollapsed ? (
              <>
                <PanelLeftOpen className="w-3.5 h-3.5 text-[#F76762]" />
                <span>Show Directory</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="w-3.5 h-3.5 text-[#667085]" />
                <span>Hide Directory</span>
              </>
            )}
          </button>
        </div>
      </div>
      {/* 2. Main Layout: Left Patient Selector + Right Aligned Details & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Left Column: Searchable Patient Directory (Col 3 when expanded) */}
        {!isLeftPanelCollapsed && (
          <div className="lg:col-span-3 bg-white rounded-3xl border border-[#F1E4E1] p-4 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="font-bold text-[#18212F] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#F76762]" />
                <span>Patient Directory</span>
              </span>
              <span className="font-mono text-[10px] text-[#667085] bg-[#FFF9F7] px-2 py-0.5 rounded-md border border-[#F1E4E1]">
                {filteredPatients.length} patients
              </span>
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#667085]" />
              <input
                type="text"
                placeholder="Search patient, UHID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
              />
            </div>

            {/* Scrollable Patient List */}
            <div className="divide-y divide-[#F1E4E1] max-h-[640px] overflow-y-auto space-y-1 pr-0.5">
              {filteredPatients.map((p) => {
                const isSelected = activePatient?.id === p.id;
                const hasActiveVisit = appointments.some(
                  (a) => a.patientId === p.id && (a.status === 'Waiting' || a.status === 'In Consultation')
                );

                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full p-2.5 text-left rounded-2xl flex items-center justify-between transition-all cursor-pointer my-1 ${isSelected
                        ? 'bg-[#F76762]/10 border border-[#F76762]/30 text-[#18212F] shadow-2xs'
                        : 'hover:bg-[#FFF9F7] text-[#667085] border border-transparent'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${isSelected
                          ? 'bg-gradient-to-br from-[#F76762] to-[#FB866E] text-white'
                          : 'bg-[#FFF9F7] text-[#18212F] border border-[#F1E4E1]'
                        }`}>
                        {p.fullName.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-xs text-[#18212F] truncate">{p.fullName}</span>
                          {hasActiveVisit && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Active in clinic" />
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-[#667085]">
                          {p.uhid} · {getPatientAgeDisplay(p)}/{p.gender}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#F76762]' : 'text-[#667085]'}`} />
                  </button>
                );
              })}

              {filteredPatients.length === 0 && (
                <div className="py-8 text-center text-xs text-[#667085]">
                  No patients match your search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Column: Aligned Overall Details & Longitudinal Stream */}
        <div className={`${isLeftPanelCollapsed ? 'lg:col-span-12' : 'lg:col-span-9'} space-y-6`}>

          {activePatient ? (
            <>
              {/* 2. ALIGNED OVERALL PATIENT SUMMARY PROFILE */}
              <div className="bg-white rounded-3xl border border-[#F1E4E1] p-5 sm:p-6 shadow-xs space-y-5">

                {/* 2A. Identity Header & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F1E4E1]">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0">
                      {activePatient.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-[#18212F] tracking-tight capitalize whitespace-nowrap">
                          {activePatient.fullName}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#F76762]/10 text-[#F76762] border border-[#F76762]/20 whitespace-nowrap shrink-0">
                          {activePatient.uhid}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-neutral-100 text-neutral-700 whitespace-nowrap shrink-0">
                          {getPatientAgeDisplay(activePatient)} · {activePatient.gender}
                        </span>
                        {activePatient.bloodGroup && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 whitespace-nowrap shrink-0">
                            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                            <span>Blood: {activePatient.bloodGroup}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-[#667085] flex-wrap">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-[#F76762]" />
                          <span>Registered: <strong className="font-semibold text-[#18212F]">{activePatient.registeredAt}</strong></span>
                        </span>
                        <span className="text-[#D0D5DD]">•</span>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-[#667085]" />
                          <span>Last Visit: <strong className="font-semibold text-[#18212F]">{activePatient.lastVisit || 'Today'}</strong></span>
                        </span>
                        <span className="text-[#D0D5DD]">•</span>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <Phone className="w-3.5 h-3.5 text-[#667085]" />
                          <a href={`tel:${activePatient.mobile}`} className="font-semibold text-[#18212F] hover:text-[#F76762] underline underline-offset-2">
                            {activePatient.mobile || 'No mobile'}
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Resume Consultation Button */}
                  <div className="shrink-0 self-start sm:self-center">
                    {activeAppointment ? (
                      <button
                        onClick={() => onNavigate(`/doctor/consultation/${activeAppointment.id}`)}
                        className="px-4 py-2.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-xs cursor-pointer flex items-center gap-1.5 animate-pulse whitespace-nowrap"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Resume Consultation ({activeAppointment.token || 'Active'})</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('/doctor/appointments')}
                        className="px-4 py-2.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>View Appointments</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2B. Total Consultations (Small Box) & Patient Details Button */}
                <div className="flex flex-col sm:flex-row sm:items-stretch gap-3.5">
                  {/* Small Box: Total Consultations */}
                  <div className="p-3.5 rounded-2xl bg-[#FFF9F7] border border-[#F1E4E1] flex flex-col justify-between sm:w-60 shrink-0">
                    <div className="flex items-center justify-between text-[#667085]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Consultations</span>
                      <Calendar className="w-3.5 h-3.5 text-[#F76762]" />
                    </div>
                    <div className="mt-1 flex items-baseline justify-between gap-2">
                      <div className="text-xl font-bold font-mono text-[#18212F]">
                        {allPatientConsultations.length}
                      </div>
                      <div className="text-[10px] text-[#667085] truncate">
                        {myConsultationsWithThisPatient.length} with {currentDoctor.name}
                      </div>
                    </div>
                  </div>

                  {/* Patient Details Button */}
                  <button
                    type="button"
                    onClick={() => setIsDetailsModalOpen(true)}
                    className="flex-1 p-3.5 rounded-2xl bg-white hover:bg-[#FFF9F7] border border-[#F1E4E1] hover:border-[#F76762]/40 shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between group min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-[#18212F] group-hover:text-[#F76762] transition-colors truncate">
                        Patient Details
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 ml-3">
                      {hasAllergies && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span>Allergies</span>
                        </span>
                      )}
                      <span className="text-xs font-bold text-[#F76762] group-hover:translate-x-0.5 transition-transform flex items-center gap-1 whitespace-nowrap">
                        <span>Open</span>
                        <span>→</span>
                      </span>
                    </div>
                  </button>
                </div>

              </div>

              {/* 3. LONGITUDINAL HISTORY STREAM & TABBED SECTIONS */}
              <div className="bg-white rounded-3xl border border-[#F1E4E1] p-5 sm:p-6 shadow-xs space-y-6">

                {/* Filter Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1E4E1]">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#F76762]" />
                    <h3 className="text-sm font-bold text-[#18212F]">
                      Clinical History Stream & Timeline
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#FFF9F7] p-1 border border-[#F1E4E1] rounded-xl text-xs font-semibold overflow-x-auto">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === 'all'
                          ? 'bg-[#18212F] text-white shadow-xs'
                          : 'text-[#667085] hover:text-[#18212F]'
                        }`}
                    >
                      All Milestones ({allPatientConsultations.length + patientPrescriptions.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('consultations')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === 'consultations'
                          ? 'bg-[#18212F] text-white shadow-xs'
                          : 'text-[#667085] hover:text-[#18212F]'
                        }`}
                    >
                      Consultations ({allPatientConsultations.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('prescriptions')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === 'prescriptions'
                          ? 'bg-[#18212F] text-white shadow-xs'
                          : 'text-[#667085] hover:text-[#18212F]'
                        }`}
                    >
                      Prescriptions ({patientPrescriptions.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('vitals')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === 'vitals'
                          ? 'bg-[#18212F] text-white shadow-xs'
                          : 'text-[#667085] hover:text-[#18212F]'
                        }`}
                    >
                      Vitals Log ({allPatientConsultations.filter(c => c.vitals && (c.vitals.bloodPressureSystolic || c.vitals.pulse)).length})
                    </button>
                  </div>
                </div>

                {/* TAB CONTENT: VITALS TABLE */}
                {activeTab === 'vitals' && (
                  <div className="space-y-4">
                    <div className="text-xs text-[#667085]">
                      Chronological progression of physiological vital signs recorded across clinical visits.
                    </div>
                    {allPatientConsultations.filter(c => c.vitals && (c.vitals.bloodPressureSystolic || c.vitals.pulse)).length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-[#F1E4E1]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FFF9F7] text-[10px] font-bold text-[#667085] uppercase tracking-wider border-b border-[#F1E4E1]">
                            <tr>
                              <th className="py-3 px-4">Visit Date</th>
                              <th className="py-3 px-4">Blood Pressure</th>
                              <th className="py-3 px-4">Pulse</th>
                              <th className="py-3 px-4">SpO2</th>
                              <th className="py-3 px-4">Temp</th>
                              <th className="py-3 px-4">Height / Weight</th>
                              <th className="py-3 px-4">BMI</th>
                              <th className="py-3 px-4">Attending Doctor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1E4E1]">
                            {allPatientConsultations
                              .filter(c => c.vitals && (c.vitals.bloodPressureSystolic || c.vitals.pulse))
                              .map((c) => (
                                <tr key={c.id} className="hover:bg-[#FFF9F7]/40">
                                  <td className="py-3 px-4 font-bold text-[#18212F]">
                                    <div>{c.date}</div>
                                    <div className="text-[10px] text-[#667085] font-normal">{c.startedAt}</div>
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-[#18212F]">
                                    {c.vitals?.bloodPressureSystolic && c.vitals?.bloodPressureDiastolic
                                      ? `${c.vitals.bloodPressureSystolic}/${c.vitals.bloodPressureDiastolic} mmHg`
                                      : '--'}
                                  </td>
                                  <td className="py-3 px-4 font-mono">
                                    {c.vitals?.pulse ? `${c.vitals.pulse} bpm` : '--'}
                                  </td>
                                  <td className="py-3 px-4 font-mono">
                                    {c.vitals?.spO2 ? `${c.vitals.spO2}%` : '--'}
                                  </td>
                                  <td className="py-3 px-4 font-mono">
                                    {c.vitals?.temperature ? `${c.vitals.temperature}°C` : '--'}
                                  </td>
                                  <td className="py-3 px-4 text-[#667085]">
                                    {c.vitals?.height ? `${c.vitals.height} cm` : '--'} / {c.vitals?.weight ? `${c.vitals.weight} kg` : '--'}
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-[#F76762]">
                                    {c.vitals?.bmi || '--'}
                                  </td>
                                  <td className="py-3 px-4 text-[#18212F]">
                                    {c.doctorName || currentDoctor.name}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-[#667085] bg-[#FFF9F7] rounded-2xl border border-dashed border-[#F1E4E1]">
                        No recorded vitals history found for {activePatient.fullName}.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT: PRESCRIPTIONS LIST */}
                {activeTab === 'prescriptions' && (
                  <div className="space-y-4">
                    {patientPrescriptions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {patientPrescriptions.map((rx) => (
                          <div key={rx.id} className="p-4 rounded-2xl bg-[#FFF9F7] border border-[#F1E4E1] space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-[#F1E4E1] pb-2">
                              <div className="flex items-center gap-1.5">
                                <Pill className="w-4 h-4 text-[#F76762]" />
                                <span className="font-mono font-bold text-xs text-[#18212F]">{rx.rxNumber}</span>
                              </div>
                              <span className="text-[10px] text-[#667085] font-semibold">{rx.date}</span>
                            </div>

                            {/* Prescribed Medicines */}
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">
                                Prescribed Medications ({rx.medicines?.length || 0})
                              </div>
                              <div className="space-y-1">
                                {rx.medicines?.map((m, idx) => (
                                  <div key={idx} className="p-2 bg-white rounded-xl border border-[#F1E4E1] text-xs flex justify-between items-center">
                                    <div>
                                      <span className="font-bold text-[#18212F]">{m.name}</span>
                                      <span className="text-[#667085] text-[11px] ml-1.5">({m.strength} · {m.dosage})</span>
                                      <div className="text-[10px] text-[#667085] mt-0.5">
                                        Frequency: <span className="font-semibold text-[#18212F]">{m.frequency}</span> · {m.duration} · {m.timing}
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold bg-[#F76762]/10 text-[#F76762] px-2 py-0.5 rounded">
                                      Qty: {m.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {rx.generalAdvice && (
                              <div className="text-[11px] text-[#667085] italic pt-1">
                                Advice: "{rx.generalAdvice}"
                              </div>
                            )}

                            <div className="pt-2 flex justify-between items-center border-t border-[#F1E4E1]/60">
                              <span className="text-[10px] text-[#667085]">Dr. {rx.doctorName}</span>
                              <button
                                onClick={() => handleOpenRxPrint(rx)}
                                className="px-3 py-1 bg-white hover:bg-[#FFF9F7] text-xs font-semibold text-[#F76762] border border-[#F1E4E1] rounded-xl flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Preview Rx</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-[#667085] bg-[#FFF9F7] rounded-2xl border border-dashed border-[#F1E4E1]">
                        No prescription history found on record for {activePatient.fullName}.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT: TIMELINE STREAM (ALL OR CONSULTATIONS) */}
                {(activeTab === 'all' || activeTab === 'consultations') && (
                  <div className="space-y-4">
                    {allPatientConsultations.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-[#F1E4E1]">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#FFF9F7] border-b border-[#F1E4E1] text-[10px] font-bold text-[#667085] uppercase tracking-wider">
                              <th className="py-3 px-4 w-[240px] whitespace-nowrap">Appointment History</th>
                              <th className="py-3 px-4 w-[35%]">Causes (Symptoms)</th>
                              <th className="py-3 px-4">Prescription</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1E4E1]/80 bg-white">
                            {allPatientConsultations.map((c) => {
                              const rx = patientPrescriptions.find(
                                (p) =>
                                  (c.appointmentId && p.appointmentId === c.appointmentId) ||
                                  p.date === c.date
                              );

                              const symptomsList = c.symptoms && c.symptoms.length > 0 ? c.symptoms : [];

                              return (
                                <tr key={c.id} className="hover:bg-[#FFF9F7]/40 transition-colors align-top">
                                  {/* Column 1: Appointment History */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <div className="font-bold text-[#18212F] text-xs flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-[#F76762] shrink-0" />
                                      <span>{c.date}</span>
                                      {c.startedAt && (
                                        <span className="text-[11px] font-normal text-[#667085]">
                                          at {c.startedAt}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-[#667085] mt-1">
                                      {c.doctorName ? `Dr. ${c.doctorName.replace(/^Dr\.\s*/i, '')}` : currentDoctor.name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                        {c.status}
                                      </span>
                                      {c.appointmentId && (
                                        <button
                                          onClick={() => onNavigate(`/doctor/consultation/${c.appointmentId}`)}
                                          className="text-[10px] font-bold text-[#F76762] hover:underline flex items-center gap-0.5 cursor-pointer"
                                        >
                                          <span>Open Record</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </td>

                                  {/* Column 2: Causes (Symptoms like fever, cough) */}
                                  <td className="py-3.5 px-4">
                                    {symptomsList.length > 0 ? (
                                      <div className="flex flex-wrap gap-1.5">
                                        {symptomsList.map((s, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FFF4F2] text-[#D94F4A] border border-[#FADCD8]"
                                          >
                                            {s.name}
                                            {s.duration ? ` · ${s.duration}` : ''}
                                            {s.severity && s.severity !== 'Mild' ? ` (${s.severity})` : ''}
                                          </span>
                                        ))}
                                      </div>
                                    ) : c.chiefComplaint ? (
                                      <div className="text-xs text-[#18212F] font-medium">
                                        {c.chiefComplaint}
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-[#98A2B3] italic">No symptoms recorded</span>
                                    )}
                                  </td>

                                  {/* Column 3: Prescription */}
                                  <td className="py-3.5 px-4">
                                    {rx && rx.medicines && rx.medicines.length > 0 ? (
                                      <div className="space-y-1.5">
                                        <div className="space-y-1">
                                          {rx.medicines.map((m, idx) => (
                                            <div key={idx} className="text-xs leading-tight">
                                              <span className="font-bold text-[#18212F]">{m.name}</span>
                                              <span className="text-[#667085] text-[11px] ml-1.5">
                                                ({[m.strength, m.dosage, m.frequency, m.duration].filter(Boolean).join(' · ')})
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenRxPrint(rx)}
                                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#F76762] hover:underline cursor-pointer pt-1"
                                        >
                                          <Printer className="w-3 h-3" />
                                          <span>Preview Prescription</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-[#98A2B3] italic">No prescription recorded</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-12 text-center text-xs text-[#667085] bg-[#FFF9F7] rounded-2xl border border-dashed border-[#F1E4E1] space-y-2">
                        <Sparkles className="w-6 h-6 text-[#F76762] mx-auto opacity-70" />
                        <div className="font-bold text-[#18212F] text-sm">No Recorded Clinical Consultations</div>
                        <p>There are no past consultation notes on record for {activePatient.fullName}.</p>
                      </div>
                    )}
                  </div>
                )}

              </div>

            </>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-[#F1E4E1] p-16 text-center text-xs text-[#667085] space-y-2">
              <User className="w-8 h-8 text-[#667085] mx-auto opacity-50" />
              <div className="font-bold text-[#18212F] text-sm">No Patient Selected</div>
              <p>Please select a patient from the directory on the left to view their aligned medical history and records.</p>
            </div>
          )}

        </div>

      </div>

      {/* Prescription Print Modal */}
      <PrescriptionA4Modal
        prescription={selectedRxForPrint}
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
      />

      {/* Glassmorphic Patient Details Pop-up Modal */}
      {isDetailsModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#18212F]/40 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDetailsModalOpen(false);
          }}
        >
          <div 
            className="relative w-full max-w-4xl bg-white/90 backdrop-blur-2xl border border-white/70 shadow-2xl rounded-3xl p-6 sm:p-7 animate-in zoom-in-95 duration-200 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pop-up Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F1E4E1]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white shadow-xs">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#18212F]">
                    Patient Details
                  </h3>
                  <p className="text-xs text-[#667085] flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#18212F]">{activePatient.fullName}</span>
                    <span>•</span>
                    <span className="font-mono text-[#F76762] font-semibold">{activePatient.uhid}</span>
                    <span>•</span>
                    <span>{getPatientAgeDisplay(activePatient)} / {activePatient.gender}</span>
                    {activePatient.bloodGroup && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-red-600">Blood: {activePatient.bloodGroup}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#667085] hover:text-[#18212F] border border-[#F1E4E1] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                aria-label="Close pop-up"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: Moved Clinical Vitals & Care Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#F1E4E1] pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#18212F] uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5 text-[#F76762]" />
                  <span>Latest Clinical Vitals & Care Status</span>
                </div>
                <span className="text-[11px] text-[#667085]">
                  Recorded during clinical examinations
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Vitals Card 1: BP & Heart Rate */}
                <div className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-xs flex flex-col justify-between min-h-[96px]">
                  <div className="flex items-center justify-between text-[#667085]">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Latest BP & Heart Rate</span>
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div>
                    <div className="text-xl font-bold font-mono text-[#18212F]">
                      {latestVitals?.bloodPressureSystolic && latestVitals?.bloodPressureDiastolic
                        ? `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic}`
                        : '--/--'}{' '}
                      <span className="text-xs font-normal text-[#667085]">mmHg</span>
                    </div>
                    <div className="text-[10px] text-[#667085] flex items-center gap-1 truncate">
                      <span>Pulse:</span>
                      <span className="font-bold text-[#18212F]">{latestVitals?.pulse ? `${latestVitals.pulse} bpm` : 'Not recorded'}</span>
                    </div>
                  </div>
                </div>

                {/* Vitals Card 2: Oxygen & Temp */}
                <div className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-xs flex flex-col justify-between min-h-[96px]">
                  <div className="flex items-center justify-between text-[#667085]">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Oxygen & Temp</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xl font-bold font-mono text-[#18212F]">
                      {latestVitals?.spO2 ? `${latestVitals.spO2}%` : '--'}{' '}
                      <span className="text-xs font-normal text-[#667085]">· {latestVitals?.temperature ? `${latestVitals.temperature}°C` : '--'}</span>
                    </div>
                    <div className="text-[10px] text-[#667085] truncate">
                      BMI: <span className="font-bold text-[#18212F]">{latestVitals?.bmi || '--'}</span>
                      {latestVitals?.weight ? ` · ${latestVitals.weight}kg` : ''}
                    </div>
                  </div>
                </div>

                {/* Vitals Card 3: Prescriptions & Care */}
                <div className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-xs flex flex-col justify-between min-h-[96px]">
                  <div className="flex items-center justify-between text-[#667085]">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Prescriptions & Care</span>
                    <Pill className="w-3.5 h-3.5 text-[#F76762]" />
                  </div>
                  <div>
                    <div className="text-xl font-bold font-mono text-[#18212F]">
                      {patientPrescriptions.length} <span className="text-xs font-normal text-[#667085]">issued</span>
                    </div>
                    <div className="text-[10px] text-[#667085] truncate">
                      {patientFollowUps.filter(f => f.status === 'Scheduled').length > 0
                        ? `${patientFollowUps.filter(f => f.status === 'Scheduled').length} upcoming follow-up`
                        : 'No pending follow-ups'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Patient Demographics, Medical Alerts & Care Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#F1E4E1] pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#18212F] uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-[#F76762]" />
                  <span>Personal Profile, Medical Alerts & Emergency Care</span>
                </div>
                <span className="text-[11px] text-[#667085]">
                  Demographics & emergency contacts
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Personal & Contact */}
                <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#18212F] uppercase tracking-wider border-b border-[#F1E4E1] pb-2">
                  <User className="w-3.5 h-3.5 text-[#F76762]" />
                  <span>Personal & Contact</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#667085] shrink-0">Mobile Phone:</span>
                    <a href={`tel:${activePatient.mobile}`} className="font-semibold text-[#18212F] hover:text-[#F76762] truncate">
                      {activePatient.mobile || 'Not provided'}
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#667085] shrink-0">Email:</span>
                    <span className="font-semibold text-[#18212F] truncate text-right" title={activePatient.email || 'Not provided'}>
                      {activePatient.email || 'Not provided'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#667085] shrink-0">Date of Birth:</span>
                    <span className="font-semibold text-[#18212F] text-right font-mono whitespace-nowrap">
                      {activePatient.dob || 'N/A'}{' '}
                      <span className="text-[#667085] font-normal font-sans">({getPatientAgeDisplay(activePatient)})</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#667085] shrink-0">City & Address:</span>
                    <span className="font-semibold text-[#18212F] text-right truncate" title={activePatient.address ? `${activePatient.address}${activePatient.city ? `, ${activePatient.city}` : ''}` : (activePatient.city || 'Metro City')}>
                      {activePatient.address ? `${activePatient.address}${activePatient.city ? `, ${activePatient.city}` : ''}` : (activePatient.city || 'Metro City')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Medical Alerts & Health */}
              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#18212F] uppercase tracking-wider border-b border-[#F1E4E1] pb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#F76762]" />
                  <span>Medical Alerts & Health</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[#667085] block text-[10px] uppercase font-bold tracking-wider mb-1">Documented Drug Allergies:</span>
                    {hasAllergies ? (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-800 text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span className="truncate">{activePatient.allergies}</span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>No known drug allergies reported</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[#667085] block text-[10px] uppercase font-bold tracking-wider mb-1">Chronic Conditions:</span>
                    {activePatient.medicalConditions && activePatient.medicalConditions.toLowerCase() !== 'none' ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-xs">
                        <Heart className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{activePatient.medicalConditions}</span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-neutral-100/80 text-neutral-700 text-[11px] backdrop-blur-xs">
                        None reported
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Emergency & Primary Care */}
              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#18212F] uppercase tracking-wider border-b border-[#F1E4E1] pb-2">
                  <Repeat className="w-3.5 h-3.5 text-[#F76762]" />
                  <span>Emergency & Primary Care</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#667085] shrink-0">Emergency Contact:</span>
                    <span className="font-semibold text-[#18212F] truncate text-right">
                      {activePatient.emergencyContact?.name || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#667085] shrink-0">Relationship:</span>
                    <span className="font-medium text-[#18212F] text-right">
                      {activePatient.emergencyContact?.relationship || 'Family'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#667085] shrink-0">Emergency Phone:</span>
                    <span className="font-mono font-semibold text-[#18212F] text-right">
                      {activePatient.emergencyContact?.phone || activePatient.mobile || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F1E4E1]/80">
                    <span className="text-[11px] text-[#667085] shrink-0">Primary Physician:</span>
                    <span className="font-semibold text-[#F76762] text-right truncate">
                      {currentDoctor.name} ({currentDoctor.room?.split('·')[0]?.trim() || currentDoctor.room})
                    </span>
                  </div>
                </div>
              </div>

              </div>
            </div>

            {/* Modal Bottom / Action */}
            <div className="flex items-center justify-between pt-4 border-t border-[#F1E4E1] text-xs">
              <span className="text-[#667085]">
                Electronic Health Record · Confidential Physician Workspace
              </span>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-5 py-2 bg-[#18212F] hover:bg-[#18212F]/90 text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Close Pop-up
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
