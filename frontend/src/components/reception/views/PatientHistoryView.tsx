import React, { useState } from 'react';
import { 
  History, 
  Search, 
  User, 
  Clock, 
  Calendar, 
  CreditCard, 
  FileText, 
  ChevronRight,
  Stethoscope,
  Activity,
  CheckCircle2,
  Heart,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  CalendarPlus,
  IndianRupee,
  Shield,
  Repeat
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';

interface PatientHistoryViewProps {
  onSelectPatient: (patientId: string) => void;
}

export const PatientHistoryView: React.FC<PatientHistoryViewProps> = ({ onSelectPatient }) => {
  const { patients, appointments, bills, timeline, searchPatients, consultations } = useReception();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'appointments' | 'billing' | 'timeline' | 'consultations'>('all');

  const matchingPatients = searchPatients(searchQuery);
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const patientAppointments = appointments.filter(a => a.patientId === selectedPatient?.id);
  const patientBills = bills.filter(b => b.patientId === selectedPatient?.id);
  const patientTimeline = timeline.filter(t => t.patientId === selectedPatient?.id);
  const patientConsultations = consultations.filter(c => 
    c.patientId === selectedPatient?.id || (selectedPatient?.uhid && c.patientUhid === selectedPatient.uhid)
  );

  const totalBilled = patientBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const outstandingBalance = patientBills
    .filter(b => b.status !== 'Paid')
    .reduce((acc, b) => acc + (b.totalAmount || 0), 0);

  const hasAllergies = selectedPatient?.allergies && 
    selectedPatient.allergies.toLowerCase() !== 'none' && 
    selectedPatient.allergies.toLowerCase() !== 'none reported' &&
    selectedPatient.allergies.toLowerCase() !== 'no documented drug allergies';

  return (
    <div className="space-y-6 text-xs">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#18212F] tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-[#F76762]" />
            <span>Reception Patient History & Longitudinal Log</span>
          </h2>
          <p className="text-[11px] text-[#667085] mt-0.5">
            Comprehensive patient demographic profile, aligned clinical alerts, visit records, invoices, and activity logs.
          </p>
        </div>

        {selectedPatient && (
          <button
            onClick={() => onSelectPatient(selectedPatient.id)}
            className="px-3.5 py-1.5 bg-[#18212F] hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs self-start sm:self-auto transition-colors"
          >
            View Full Patient Profile
          </button>
        )}
      </div>

      {/* 2-Column Layout: Left Patient Selector, Right History & Aligned Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Col (Col 4): Patient Selector */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#F1E4E1] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs pb-1">
            <span className="font-bold text-[#18212F]">Patient Directory</span>
            <span className="font-mono text-[10px] text-[#667085] bg-[#FFF9F7] px-2 py-0.5 rounded-md border border-[#F1E4E1]">
              {matchingPatients.length} found
            </span>
          </div>

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

          <div className="divide-y divide-[#F1E4E1] max-h-[560px] overflow-y-auto space-y-0.5 pr-0.5">
            {matchingPatients.map((p) => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full p-2.5 text-left rounded-xl flex items-center justify-between transition-all cursor-pointer my-1 ${
                    isSelected
                      ? 'bg-[#F76762]/10 border border-[#F76762]/30 text-[#18212F] shadow-2xs'
                      : 'hover:bg-[#FFF9F7] text-[#667085] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected ? 'bg-[#F76762] text-white' : 'bg-[#FFF9F7] text-[#667085] border border-[#F1E4E1]'
                    }`}>
                      {p.fullName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs text-[#18212F] truncate">{p.fullName}</div>
                      <div className="text-[10px] font-mono text-[#667085]">
                        {p.uhid} · {p.age}y/{p.gender}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#F76762]' : 'text-[#667085]'}`} />
                </button>
              );
            })}

            {matchingPatients.length === 0 && (
              <div className="py-8 text-center text-[#667085]">
                No matching patients found.
              </div>
            )}
          </div>
        </div>

        {/* Right Col (Col 8): Aligned Overall Patient Details & Clinical Log */}
        <div className="lg:col-span-8 space-y-5">
          
          {selectedPatient ? (
            <>
              {/* 1. MASTER ALIGNED OVERALL PATIENT DETAILS CARD */}
              <div className="bg-white rounded-3xl border border-[#F1E4E1] p-5 sm:p-6 shadow-xs space-y-5">
                
                {/* 1A. Identity Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F1E4E1]">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white font-black text-xl shadow-sm shrink-0">
                      {selectedPatient.fullName.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-[#18212F] tracking-tight">
                          {selectedPatient.fullName}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#F76762]/10 text-[#F76762] border border-[#F76762]/20">
                          {selectedPatient.uhid}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-700">
                          {selectedPatient.age}y · {selectedPatient.gender}
                        </span>
                        {selectedPatient.bloodGroup && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                            <span>Blood: {selectedPatient.bloodGroup}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#667085] flex-wrap">
                        <span>Registered: <strong className="text-[#18212F]">{selectedPatient.registeredAt}</strong></span>
                        <span>·</span>
                        <span>Last Visit: <strong className="text-[#18212F]">{selectedPatient.lastVisit || 'Today'}</strong></span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#667085]" />
                          <a href={`tel:${selectedPatient.mobile}`} className="font-semibold text-[#18212F] hover:text-[#F76762]">
                            {selectedPatient.mobile || 'No mobile'}
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => onSelectPatient(selectedPatient.id)}
                      className="px-3.5 py-1.5 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      Full Profile
                    </button>
                  </div>
                </div>

                {/* 1B. 4 Aligned KPI Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#FFF9F7] border border-[#F1E4E1] space-y-1">
                    <div className="flex items-center justify-between text-[#667085]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Visits</span>
                      <Calendar className="w-3.5 h-3.5 text-[#F76762]" />
                    </div>
                    <div className="text-lg font-bold font-mono text-[#18212F]">
                      {patientAppointments.length}
                    </div>
                    <div className="text-[10px] text-[#667085]">
                      {patientConsultations.length} consultations
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FFF9F7] border border-[#F1E4E1] space-y-1">
                    <div className="flex items-center justify-between text-[#667085]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Invoiced</span>
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="text-lg font-bold font-mono text-[#18212F]">
                      ₹{totalBilled.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[#667085]">
                      {patientBills.length} invoices generated
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FFF9F7] border border-[#F1E4E1] space-y-1">
                    <div className="flex items-center justify-between text-[#667085]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Balance Due</span>
                      <IndianRupee className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className={`text-lg font-bold font-mono ${outstandingBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ₹{outstandingBalance.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[#667085]">
                      {outstandingBalance > 0 ? 'Pending payment' : 'Fully settled'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FFF9F7] border border-[#F1E4E1] space-y-1">
                    <div className="flex items-center justify-between text-[#667085]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Activity Log</span>
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-lg font-bold font-mono text-[#18212F]">
                      {patientTimeline.length}
                    </div>
                    <div className="text-[10px] text-[#667085]">
                      Recorded events
                    </div>
                  </div>
                </div>

                {/* 1C. Aligned 3-Column Patient Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  
                  {/* Column 1: Personal & Demographics */}
                  <div className="p-4 rounded-2xl bg-[#FFF9F7]/70 border border-[#F1E4E1] space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#18212F] uppercase tracking-wider border-b border-[#F1E4E1] pb-2">
                      <User className="w-3.5 h-3.5 text-[#F76762]" />
                      <span>Personal & Demographics</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Mobile Phone:</span>
                        <a href={`tel:${selectedPatient.mobile}`} className="font-semibold text-[#18212F] hover:text-[#F76762] text-right">
                          {selectedPatient.mobile || 'Not provided'}
                        </a>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Email:</span>
                        <span className="font-semibold text-[#18212F] truncate text-right">
                          {selectedPatient.email || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Date of Birth:</span>
                        <span className="font-semibold text-[#18212F] text-right font-mono">
                          {selectedPatient.dob} ({selectedPatient.age} yrs)
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Address & City:</span>
                        <span className="font-semibold text-[#18212F] text-right">
                          {selectedPatient.address ? `${selectedPatient.address}${selectedPatient.city ? `, ${selectedPatient.city}` : ''}` : (selectedPatient.city || 'Standard clinic residence')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Medical Alerts & Health */}
                  <div className="p-4 rounded-2xl bg-[#FFF9F7]/70 border border-[#F1E4E1] space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#18212F] uppercase tracking-wider border-b border-[#F1E4E1] pb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#F76762]" />
                      <span>Medical Alerts & Health</span>
                    </div>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-[#667085] block text-[11px] mb-1 font-semibold">Documented Drug Allergies:</span>
                        {hasAllergies ? (
                          <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px] font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>{selectedPatient.allergies}</span>
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>No known drug allergies</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[#667085] block text-[11px] mb-1 font-semibold">Chronic Conditions:</span>
                        {selectedPatient.medicalConditions && selectedPatient.medicalConditions.toLowerCase() !== 'none' ? (
                          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{selectedPatient.medicalConditions}</span>
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700 text-[11px]">
                            No chronic conditions on record
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Emergency & Care Contact */}
                  <div className="p-4 rounded-2xl bg-[#FFF9F7]/70 border border-[#F1E4E1] space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#18212F] uppercase tracking-wider border-b border-[#F1E4E1] pb-2">
                      <Repeat className="w-3.5 h-3.5 text-[#F76762]" />
                      <span>Emergency & Primary Care</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Emergency Contact:</span>
                        <span className="font-semibold text-[#18212F] text-right">
                          {selectedPatient.emergencyContact?.name || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Relationship:</span>
                        <span className="font-medium text-[#18212F] text-right">
                          {selectedPatient.emergencyContact?.relationship || 'Family'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Emergency Phone:</span>
                        <span className="font-mono font-semibold text-[#18212F] text-right">
                          {selectedPatient.emergencyContact?.phone || selectedPatient.mobile}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#667085] shrink-0">Registration Center:</span>
                        <span className="font-semibold text-[#F76762] text-right">
                          Central Clinic Desk
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* 2. CHRONOLOGICAL LOGS & RECORDS WITH TABS */}
              <div className="bg-white rounded-3xl border border-[#F1E4E1] p-5 sm:p-6 shadow-xs space-y-5">
                
                {/* Tabs Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1E4E1]">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#F76762]" />
                    <h4 className="font-bold text-sm text-[#18212F]">
                      Longitudinal History Records
                    </h4>
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
                      All Records
                    </button>
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'appointments'
                          ? 'bg-[#18212F] text-white shadow-xs'
                          : 'text-[#667085] hover:text-[#18212F]'
                      }`}
                    >
                      Appointments ({patientAppointments.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('billing')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'billing'
                          ? 'bg-[#18212F] text-white shadow-xs'
                          : 'text-[#667085] hover:text-[#18212F]'
                      }`}
                    >
                      Invoices ({patientBills.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'timeline'
                          ? 'bg-[#18212F] text-white shadow-xs'
                          : 'text-[#667085] hover:text-[#18212F]'
                      }`}
                    >
                      Journey Log ({patientTimeline.length})
                    </button>
                  </div>
                </div>

                {/* TAB 1: APPOINTMENTS */}
                {(activeTab === 'all' || activeTab === 'appointments') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#18212F]">
                      <Calendar className="w-3.5 h-3.5 text-[#F76762]" />
                      <span>Appointments & Clinic Visits ({patientAppointments.length})</span>
                    </div>

                    <div className="divide-y divide-[#F1E4E1]">
                      {patientAppointments.length === 0 ? (
                        <div className="py-4 text-[#667085] italic">No appointment logs on record for this patient.</div>
                      ) : (
                        patientAppointments.map((apt) => (
                          <div key={apt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FFF9F7]/50 p-2 rounded-xl">
                            <div>
                              <div className="font-bold text-xs text-[#18212F] flex items-center gap-2">
                                <span>{apt.date} at {apt.time}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 rounded text-[#667085]">{apt.type}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#F76762]/10 text-[#F76762] rounded font-bold">
                                  {apt.token}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#667085] mt-0.5">
                                {apt.doctorName} — <span className="italic">{apt.reason}</span>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold self-start sm:self-auto ${
                              apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                              apt.status === 'In Consultation' ? 'bg-blue-100 text-blue-800' :
                              apt.status === 'Waiting' ? 'bg-amber-100 text-amber-800' :
                              'bg-neutral-100 text-neutral-700'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: INVOICES & BILLING */}
                {(activeTab === 'all' || activeTab === 'billing') && (
                  <div className="space-y-3 pt-3 border-t border-[#F1E4E1]">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#18212F]">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Financial Invoices & Payment Receipts ({patientBills.length})</span>
                    </div>

                    <div className="divide-y divide-[#F1E4E1]">
                      {patientBills.length === 0 ? (
                        <div className="py-4 text-[#667085] italic">No billing records for this patient.</div>
                      ) : (
                        patientBills.map((b) => (
                          <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FFF9F7]/50 p-2 rounded-xl">
                            <div>
                              <div className="font-mono font-bold text-xs text-[#18212F] flex items-center gap-2">
                                <span>{b.billNumber}</span>
                                <span className="text-[10px] text-[#667085] font-normal">{b.createdAt}</span>
                              </div>
                              <div className="text-[11px] text-[#667085] mt-0.5">
                                Services: {b.charges.map(c => c.serviceName).join(', ')}
                              </div>
                            </div>
                            <div className="text-right self-start sm:self-auto flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0.5">
                              <div className="font-mono font-bold text-xs text-[#18212F]">₹{b.totalAmount.toFixed(2)}</div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                b.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {b.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: TIMELINE */}
                {(activeTab === 'all' || activeTab === 'timeline') && (
                  <div className="space-y-3 pt-3 border-t border-[#F1E4E1]">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#18212F]">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      <span>Chronological Interaction Log ({patientTimeline.length})</span>
                    </div>

                    <div className="space-y-2">
                      {patientTimeline.length === 0 ? (
                        <div className="py-4 text-[#667085] italic">No activity timeline items recorded.</div>
                      ) : (
                        patientTimeline.map((tl) => (
                          <div key={tl.id} className="p-3 bg-[#FFF9F7] rounded-xl border border-[#F1E4E1] flex items-center justify-between gap-2">
                            <div>
                              <div className="font-bold text-xs text-[#18212F]">{tl.title}</div>
                              <div className="text-[11px] text-[#667085]">{tl.description}</div>
                            </div>
                            <div className="text-right text-[10px] text-[#667085] font-mono shrink-0">
                              <div>{tl.timestamp}</div>
                              <div>by {tl.actorName}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="p-12 text-center text-[#667085] bg-white rounded-3xl border border-[#F1E4E1]">
              Select a patient from the directory on the left to review their aligned history.
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
