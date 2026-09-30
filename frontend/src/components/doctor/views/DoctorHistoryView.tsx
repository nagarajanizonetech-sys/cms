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
  PanelLeftOpen
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { Prescription } from '../../../types/doctor';
import { PrescriptionA4Modal } from '../modals/PrescriptionA4Modal';

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
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                patientScope === 'my'
                  ? 'bg-[#18212F] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#18212F]'
              }`}
            >
              My Patients ({myDoctorPatientIds.length})
            </button>
            <button
              onClick={() => setPatientScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                patientScope === 'all'
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
        
        {/* Left Column: Searchable Patient Directory (Col 4 when expanded) */}
        {!isLeftPanelCollapsed && (
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#F1E4E1] p-4 sm:p-5 shadow-xs space-y-3.5">
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
                    className={`w-full p-2.5 text-left rounded-2xl flex items-center justify-between transition-all cursor-pointer my-1 ${
                      isSelected
                        ? 'bg-[#F76762]/10 border border-[#F76762]/30 text-[#18212F] shadow-2xs'
                        : 'hover:bg-[#FFF9F7] text-[#667085] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                        isSelected 
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
                          {p.uhid} · {p.age}y/{p.gender}
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
        <div className={`${isLeftPanelCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
          
          {activePatient ? (
            <>
              {/* 2. ALIGNED OVERALL PATIENT SUMMARY PROFILE */}
              <div className="bg-white rounded-3xl border border-[#F1E4E1] p-5 sm:p-6 shadow-xs space-y-5">
                
                {/* 2A. Identity Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#F1E4E1]">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0">
                      {activePatient.fullName.charAt(0)}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl font-black text-[#18212F] tracking-tight">
                          {activePatient.fullName}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#F76762]/10 text-[#F76762] border border-[#F76762]/20">
                          {activePatient.uhid}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-neutral-100 text-neutral-700">
                          {activePatient.age}y · {activePatient.gender}
                        </span>
                        {activePatient.bloodGroup && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                            <span>Blood: {activePatient.bloodGroup}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#667085] flex-wrap">
                        <span>Registered: <span className="font-semibold text-[#18212F]">{activePatient.registeredAt}</span></span>
                        <span>·</span>
                        <span>Last Visit: <span className="font-semibold text-[#18212F]">{activePatient.lastVisit || 'Today'}</span></span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#667085]" />
                          <a href={`tel:${activePatient.mobile}`} className="font-semibold text-[#18212F] hover:text-[#F76762] underline">
                            {activePatient.mobile || 'No mobile'}
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Consultation CTA */}
                  <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
                    {activeAppointment ? (
                      <button
                        onClick={() => onNavigate(`/doctor/consultation/${activeAppointment.id}`)}
                        className="px-4 py-2 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-xs cursor-pointer flex items-center gap-1.5 animate-pulse"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Resume Consultation ({activeAppointment.token || 'Active'})</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('/doctor/appointments')}
                        className="px-4 py-2 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>View Appointments</span>
                      </button>
                    )}
                    <button
                      onClick={() => onNavigate('/doctor/patients')}
                      className="px-3.5 py-2 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      Full Directory
                    </button>
                  </div>
                </div>

                {/* 2B. Aligned Metric KPI Stat Cards (4 Equal Columns) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-2xl bg-[#FFF9F7] border border-[#F1E4E1] space-y-1">
                    <div className="flex items-center justify-between text-[#667085]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Consultations</span>
                      <Calendar className="w-4 h-4 text-[#F76762]" />
                    </div>
                    <div className="text-xl font-bold font-mono text-[#18212F]">
                      {allPatientConsultations.length}
                    </div>
                    <div className="text-[10px] text-[#667085]">
                      {myConsultationsWithThisPatient.length} with {currentDoctor.name}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FFF9F7] border border-[#F1E4E1] space-y-1">
                    <div className="flex items-center justify-between text-[#667085]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Latest BP & Heart Rate</span>
                      <Heart className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-[#18212F]">
                      {latestVitals?.bloodPressureSystolic && latestVitals?.bloodPressureDiastolic 
                        ? `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic}`
                        : '--/--'}{' '}
                      <span className="text-xs font-normal text-[#667085]">mmHg</span>
                    </div>
                    <div className="text-[10px] text-[#667085] flex items-center gap-1">
                      <span>Pulse:</span>
                      <span className="font-bold text-[#18212F]">{latestVitals?.pulse ? `${latestVitals.pulse} bpm` : 'Not recorded'}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FFF9F7] border border-[#F1E4E1] space-y-1">
                    <div className="flex items-center justify-between text-[#667085]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Oxygen & Temp</span>
                      <Activity className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold font-mono text-[#18212F]">
                      {latestVitals?.spO2 ? `${latestVitals.spO2}%` : '--'}{' '}
                      <span className="text-xs font-normal text-[#667085]">· {latestVitals?.temperature ? `${latestVitals.temperature}°C` : '--'}</span>
                    </div>
                    <div className="text-[10px] text-[#667085]">
                      BMI: <span className="font-bold text-[#18212F]">{latestVitals?.bmi || '--'}</span>
                      {latestVitals?.weight ? ` · ${latestVitals.weight}kg` : ''}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FFF9F7] border border-[#F1E4E1] space-y-1">
                    <div className="flex items-center justify-between text-[#667085]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Prescriptions & Care</span>
                      <Pill className="w-4 h-4 text-[#F76762]" />
                    </div>
                    <div className="text-xl font-bold font-mono text-[#18212F]">
                      {patientPrescriptions.length} <span className="text-xs font-normal text-[#667085]">issued</span>
                    </div>
                    <div className="text-[10px] text-[#667085]">
                      {patientFollowUps.filter(f => f.status === 'Scheduled').length > 0
                        ? `${patientFollowUps.filter(f => f.status === 'Scheduled').length} upcoming follow-up`
                        : 'No pending follow-ups'}
                    </div>
                  </div>
                </div>

                {/* 2C. Aligned 3-Column Patient Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  
                  {/* Card 1: Personal & Demographics */}
                  <div className="p-4 rounded-2xl bg-[#FFF9F7]/70 border border-[#F1E4E1] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#18212F] uppercase tracking-wider border-b border-[#F1E4E1] pb-2">
                      <User className="w-3.5 h-3.5 text-[#F76762]" />
                      <span>Personal & Contact</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Mobile Phone:</span>
                        <a href={`tel:${activePatient.mobile}`} className="font-semibold text-[#18212F] hover:text-[#F76762] text-right">
                          {activePatient.mobile || 'Not provided'}
                        </a>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Email:</span>
                        <span className="font-semibold text-[#18212F] truncate text-right">
                          {activePatient.email || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Date of Birth:</span>
                        <span className="font-semibold text-[#18212F] text-right font-mono">
                          {activePatient.dob} ({activePatient.age} yrs)
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">City & Address:</span>
                        <span className="font-semibold text-[#18212F] text-right">
                          {activePatient.address ? `${activePatient.address}${activePatient.city ? `, ${activePatient.city}` : ''}` : (activePatient.city || 'Standard clinic residence')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Medical Alerts & Clinical Profile */}
                  <div className="p-4 rounded-2xl bg-[#FFF9F7]/70 border border-[#F1E4E1] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#18212F] uppercase tracking-wider border-b border-[#F1E4E1] pb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#F76762]" />
                      <span>Medical Alerts & Health</span>
                    </div>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-[#667085] block text-[11px] mb-1 font-semibold">Documented Drug Allergies:</span>
                        {hasAllergies ? (
                          <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px] font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>{activePatient.allergies}</span>
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>No known drug allergies reported</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[#667085] block text-[11px] mb-1 font-semibold">Chronic Conditions:</span>
                        {activePatient.medicalConditions && activePatient.medicalConditions.toLowerCase() !== 'none' ? (
                          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{activePatient.medicalConditions}</span>
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700 text-[11px]">
                            No chronic conditions on record
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Emergency & Primary Care */}
                  <div className="p-4 rounded-2xl bg-[#FFF9F7]/70 border border-[#F1E4E1] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#18212F] uppercase tracking-wider border-b border-[#F1E4E1] pb-2">
                      <Repeat className="w-3.5 h-3.5 text-[#F76762]" />
                      <span>Emergency & Primary Care</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Emergency Contact:</span>
                        <span className="font-semibold text-[#18212F] text-right">
                          {activePatient.emergencyContact?.name || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Relationship:</span>
                        <span className="font-medium text-[#18212F] text-right">
                          {activePatient.emergencyContact?.relationship || 'Family'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Emergency Phone:</span>
                        <span className="font-mono font-semibold text-[#18212F] text-right">
                          {activePatient.emergencyContact?.phone || activePatient.mobile}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Primary Clinic Physician:</span>
                        <span className="font-semibold text-[#F76762] text-right">
                          {currentDoctor.name} ({currentDoctor.room})
                        </span>
                      </div>
                    </div>
                  </div>

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
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'all'
                          ? 'bg-[#18212F] text-white shadow-xs'
                          : 'text-[#667085] hover:text-[#18212F]'
                      }`}
                    >
                      All Milestones ({allPatientConsultations.length + patientPrescriptions.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('consultations')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'consultations'
                          ? 'bg-[#18212F] text-white shadow-xs'
                          : 'text-[#667085] hover:text-[#18212F]'
                      }`}
                    >
                      Consultations ({allPatientConsultations.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('prescriptions')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'prescriptions'
                          ? 'bg-[#18212F] text-white shadow-xs'
                          : 'text-[#667085] hover:text-[#18212F]'
                      }`}
                    >
                      Prescriptions ({patientPrescriptions.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('vitals')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'vitals'
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
                              <th className="py-3 px-4 whitespace-nowrap">Appointment History</th>
                              <th className="py-3 px-4">Causes (Symptoms)</th>
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
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        c.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
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

    </div>
  );
};
