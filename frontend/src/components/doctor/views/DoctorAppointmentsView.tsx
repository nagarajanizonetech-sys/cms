import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  Stethoscope, 
  ArrowRight, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Volume2,
  Sparkles,
  Users
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { AppointmentStatus, AppointmentType } from '../../../types/reception';
import { AppointmentCalendar } from '../../reception/views/AppointmentCalendar';

interface DoctorAppointmentsViewProps {
  onNavigate: (route: string) => void;
}

export const DoctorAppointmentsView: React.FC<DoctorAppointmentsViewProps> = ({ onNavigate }) => {
  const { appointments, queues, startConsultation, callPatient, currentDoctorId, doctors } = useReception();
  const currentDoctor = doctors.find((d) => d.id === currentDoctorId || d.id === `doc-${currentDoctorId}`) || doctors[0] || {
    id: '1',
    name: 'Dr. Sarah Khan',
    room: 'Room 101',
    specialization: 'General Medicine',
  };
  const cleanDocId = (currentDoctor?.id || '1').replace('doc-', '');

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Doctor Isolation: Only this doctor's appointments
  const myAppointments = appointments.filter((a) => 
    !currentDoctor ? true : (
      a.doctorId === currentDoctor.id || 
      (cleanDocId && a.doctorId === cleanDocId) || 
      (a.doctorName && currentDoctor.name && a.doctorName.toLowerCase().includes(currentDoctor.name.toLowerCase()))
    )
  );

  // Enrich appointments with live queue token, check-in status, and priority
  const enrichedAppointments = myAppointments.map((apt) => {
    const q = queues.find((item) => item.appointmentId === apt.id);
    const token = apt.token || q?.token;
    let status = apt.status;
    if (q && (q.status === 'Waiting' || q.status === 'In Consultation')) {
      status = q.status;
    }
    return {
      ...apt,
      token,
      status,
      assignedAt: q?.assignedAt,
      priority: q?.priority || 'Normal',
    };
  });

  // Segments & counters
  const waitingCount = enrichedAppointments.filter((a) => a.status === 'Waiting').length;
  const inConsultationPatient = enrichedAppointments.find((a) => a.status === 'In Consultation');
  const scheduledCount = enrichedAppointments.filter((a) => a.status === 'Scheduled').length;
  const completedCount = enrichedAppointments.filter((a) => a.status === 'Completed').length;

  // Filter & sort appointments: Waiting and In Consultation patients bubble to the top
  const filteredAppointments = enrichedAppointments.filter((apt) => {
    if (statusFilter !== 'All' && apt.status !== statusFilter) return false;
    if (typeFilter !== 'All' && apt.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        apt.patientName.toLowerCase().includes(q) ||
        apt.patientUhid.toLowerCase().includes(q) ||
        (apt.token && apt.token.toLowerCase().includes(q)) ||
        (apt.patientPhone && apt.patientPhone.includes(q))
      );
    }
    return true;
  }).sort((a, b) => {
    const order: Record<string, number> = {
      'In Consultation': 0,
      'Waiting': 1,
      'Scheduled': 2,
      'Checked-in': 3,
      'Completed': 4,
      'Cancelled': 5,
    };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  const handleStartConsultation = (appointmentId: string) => {
    if (currentDoctor?.id) {
      startConsultation(appointmentId, currentDoctor.id);
    }
    onNavigate(`/doctor/consultation/${appointmentId}`);
  };

  const handleCallPatient = (token?: string, appointmentId?: string) => {
    if (token && appointmentId) {
      callPatient(token, appointmentId);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#18212F]">
              Patient Appointments & Live Queue — {currentDoctor?.name || 'Doctor'}
            </h2>
            {waitingCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {waitingCount} in waiting lounge
              </span>
            )}
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Real-time patient schedule and waiting queue for {currentDoctor?.room || 'Consultation Room'}. Start or resume clinical consultations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#FFF9F7] p-1 border border-[#F1E4E1] rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#18212F] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#18212F]'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-[#18212F] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#18212F]'
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <AppointmentCalendar
          defaultDoctorId={currentDoctor?.id || '1'}
          onSelectPatient={(patientId) => onNavigate(`/doctor/patients`)}
        />
      ) : (
        <>
          {/* Active In-Consultation Patient Banner */}
          {inConsultationPatient && (
            <div className="p-4 bg-gradient-to-r from-[#FFF5F4] to-[#FFF9F7] rounded-2xl border border-[#F76762]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F76762] text-white flex items-center justify-center font-mono font-black text-sm shrink-0">
                  {inConsultationPatient.token || 'IN'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#18212F]">{inConsultationPatient.patientName}</span>
                    <span className="text-[10px] font-mono text-[#667085]">{inConsultationPatient.patientUhid}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#F76762] bg-[#F76762]/10 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F76762] animate-pulse" />
                      Currently In Consultation
                    </span>
                  </div>
                  <p className="text-[11px] text-[#667085] mt-0.5">
                    Reason: {inConsultationPatient.reason || 'General clinical consultation'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleStartConsultation(inConsultationPatient.id)}
                className="px-4 py-2 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Resume Consultation</span>
              </button>
            </div>
          )}

          {/* Quick Status Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setStatusFilter('Waiting')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                statusFilter === 'Waiting'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white border-[#F1E4E1] hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'Waiting' ? 'text-amber-100' : 'text-[#667085]'}`}>
                  Waiting Now
                </span>
                <span className={`w-2 h-2 rounded-full ${waitingCount > 0 ? (statusFilter === 'Waiting' ? 'bg-white animate-pulse' : 'bg-amber-500 animate-pulse') : 'bg-transparent'}`} />
              </div>
              <div className={`text-xl font-bold font-mono mt-1 ${statusFilter === 'Waiting' ? 'text-white' : 'text-[#18212F]'}`}>
                {waitingCount}
              </div>
              <div className={`text-[10px] mt-0.5 ${statusFilter === 'Waiting' ? 'text-amber-100' : 'text-[#667085]'}`}>
                Patients in lounge
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('In Consultation')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                statusFilter === 'In Consultation'
                  ? 'bg-[#F76762] text-white border-[#F76762] shadow-xs'
                  : 'bg-white border-[#F1E4E1] hover:border-[#F76762]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'In Consultation' ? 'text-red-100' : 'text-[#667085]'}`}>
                  In Room
                </span>
                <Stethoscope className={`w-3.5 h-3.5 ${statusFilter === 'In Consultation' ? 'text-white' : 'text-[#F76762]'}`} />
              </div>
              <div className={`text-xl font-bold font-mono mt-1 ${statusFilter === 'In Consultation' ? 'text-white' : 'text-[#18212F]'}`}>
                {inConsultationPatient ? 1 : 0}
              </div>
              <div className={`text-[10px] mt-0.5 ${statusFilter === 'In Consultation' ? 'text-red-100' : 'text-[#667085]'}`}>
                Active consultation
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('Scheduled')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                statusFilter === 'Scheduled'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-white border-[#F1E4E1] hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'Scheduled' ? 'text-blue-100' : 'text-[#667085]'}`}>
                  Scheduled
                </span>
                <Clock className={`w-3.5 h-3.5 ${statusFilter === 'Scheduled' ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <div className={`text-xl font-bold font-mono mt-1 ${statusFilter === 'Scheduled' ? 'text-white' : 'text-[#18212F]'}`}>
                {scheduledCount}
              </div>
              <div className={`text-[10px] mt-0.5 ${statusFilter === 'Scheduled' ? 'text-blue-100' : 'text-[#667085]'}`}>
                Upcoming today
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('Completed')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                statusFilter === 'Completed'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white border-[#F1E4E1] hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'Completed' ? 'text-emerald-100' : 'text-[#667085]'}`}>
                  Completed
                </span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${statusFilter === 'Completed' ? 'text-white' : 'text-emerald-600'}`} />
              </div>
              <div className={`text-xl font-bold font-mono mt-1 ${statusFilter === 'Completed' ? 'text-white' : 'text-[#18212F]'}`}>
                {completedCount}
              </div>
              <div className={`text-[10px] mt-0.5 ${statusFilter === 'Completed' ? 'text-emerald-100' : 'text-[#667085]'}`}>
                Finished sessions
              </div>
            </button>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {(['All', 'Waiting', 'In Consultation', 'Scheduled', 'Completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    statusFilter === status
                      ? 'bg-[#18212F] text-white shadow-xs'
                      : 'bg-white border border-[#F1E4E1] text-[#667085] hover:text-[#18212F]'
                  }`}
                >
                  {status}
                  {status === 'Waiting' && waitingCount > 0 && ` (${waitingCount})`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-[#F1E4E1] rounded-xl text-xs font-semibold text-[#18212F] focus:outline-none focus:border-[#F76762]"
              >
                <option value="All">All Visit Types</option>
                <option value="New Consultation">New Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Review">Review</option>
                <option value="Walk-in">Walk-in</option>
              </select>

              <div className="relative w-52 sm:w-64">
                <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search patient, token, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
              </div>
            </div>
          </div>

          {/* Appointments & Waiting Patients Table */}
          {filteredAppointments.length > 0 ? (
            <div className="bg-white rounded-2xl border border-[#F1E4E1] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF9F7] text-[10px] font-bold text-[#667085] uppercase tracking-wider border-b border-[#F1E4E1]">
                  <tr>
                    <th className="py-3 px-4">Token & Time</th>
                    <th className="py-3 px-4">Patient Profile</th>
                    <th className="py-3 px-4">Visit Type</th>
                    <th className="py-3 px-4">Reason for Visit</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1E4E1]">
                  {filteredAppointments.map((apt) => {
                    const isWaiting = apt.status === 'Waiting';
                    const isInRoom = apt.status === 'In Consultation';
                    return (
                      <tr 
                        key={apt.id} 
                        className={`transition-colors ${
                          isInRoom 
                            ? 'bg-[#FFF5F4]/60 hover:bg-[#FFF5F4]' 
                            : isWaiting 
                              ? 'bg-amber-50/40 hover:bg-amber-50/70' 
                              : 'hover:bg-[#FFF9F7]/40'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {apt.token ? (
                              <span className="font-mono text-xs font-black text-[#F76762] bg-[#F76762]/10 px-2 py-0.5 rounded-lg border border-[#F76762]/20">
                                {apt.token}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#667085] font-mono">No Token</span>
                            )}
                            <span className="font-bold text-[#18212F]">{apt.time}</span>
                          </div>
                          {apt.assignedAt && (
                            <div className="text-[10px] text-[#667085] mt-0.5">Checked-in: {apt.assignedAt}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#18212F]">{apt.patientName}</div>
                          <div className="text-[10px] font-mono text-[#667085]">
                            {apt.patientUhid} {apt.patientPhone && `· ${apt.patientPhone}`}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-[#18212F] bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                            {apt.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#667085] max-w-xs truncate">
                          {apt.reason || 'General Consultation'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            apt.status === 'In Consultation' ? 'bg-[#F76762]/15 text-[#F76762] border border-[#F76762]/20' :
                            apt.status === 'Waiting' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-neutral-100 text-neutral-700'
                          }`}>
                            {isWaiting && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                            {isInRoom && <span className="w-1.5 h-1.5 rounded-full bg-[#F76762] animate-pulse" />}
                            <span>{apt.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {isWaiting && apt.token && (
                              <button
                                onClick={() => handleCallPatient(apt.token, apt.id)}
                                title="Call patient into room"
                                className="p-1.5 bg-white hover:bg-neutral-100 text-[#667085] hover:text-[#18212F] border border-[#F1E4E1] rounded-xl cursor-pointer transition-colors"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {apt.status === 'Completed' ? (
                              <button
                                onClick={() => onNavigate(`/doctor/consultation/${apt.id}`)}
                                className="px-3 py-1.5 bg-white hover:bg-[#FFF9F7] text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#667085]" />
                                <span>View Record</span>
                              </button>
                            ) : isInRoom ? (
                              <button
                                onClick={() => handleStartConsultation(apt.id)}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-2xs cursor-pointer inline-flex items-center gap-1.5 animate-pulse"
                              >
                                <Stethoscope className="w-3.5 h-3.5" />
                                <span>Resume</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartConsultation(apt.id)}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Stethoscope className="w-3.5 h-3.5" />
                                <span>Start Consultation</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-[#F1E4E1] p-10 text-center text-xs text-[#667085]">
              No appointments found matching the selected filters.
            </div>
          )}
        </>
      )}

    </div>
  );
};
