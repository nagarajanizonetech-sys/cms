import React from 'react';
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Phone, 
  Activity, 
  UserCheck, 
  Volume2, 
  Repeat, 
  Eye, 
  Stethoscope,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';

interface DoctorDashboardProps {
  onNavigate: (route: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onNavigate }) => {
  const { 
    queues, 
    appointments, 
    consultations, 
    followUps, 
    currentDoctorId, 
    doctors,
    startConsultation,
    callPatient,
    skipPatient
  } = useReception();

  const currentDoctor = doctors.find((d) => d.id === currentDoctorId || d.id === `doc-${currentDoctorId}`) || doctors[0] || {
    id: '1',
    name: 'Dr. Sarah Khan',
    room: 'Room 101',
    specialization: 'General Medicine',
  };
  const cleanDocId = (currentDoctor?.id || '1').replace('doc-', '');

  // DOCTOR ISOLATION: Only this doctor's queues, appointments, consultations, and follow-ups!
  const myQueue = queues.filter((q) => q.doctorId === currentDoctor.id || q.doctorId === cleanDocId);
  const myAppointments = appointments.filter((a) => a.doctorId === currentDoctor.id || a.doctorId === cleanDocId);
  const myConsultations = consultations.filter((c) => c.doctorId === currentDoctor.id || c.doctorId === cleanDocId);
  const myFollowUps = followUps.filter((f) => f.doctorId === currentDoctor.id || f.doctorId === cleanDocId);

  // Queue segments
  const waitingPatients = myQueue.filter((q) => q.status === 'Waiting');
  const inConsultationPatient = myQueue.find((q) => q.status === 'In Consultation');
  const completedToday = myQueue.filter((q) => q.status === 'Completed');
  const skippedPatients = myQueue.filter((q) => q.status === 'Skipped');

  // Stats calculation
  const totalAppointmentsToday = myAppointments.length;
  const remainingAppointments = myAppointments.filter((a) => a.status === 'Scheduled' || a.status === 'Waiting').length;

  const handleStartConsultation = (appointmentId: string) => {
    startConsultation(appointmentId, currentDoctor.id);
    onNavigate(`/doctor/consultation/${appointmentId}`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Doctor Welcome & Active Clinical Consultation Banner */}
      {inConsultationPatient && (
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#F76762] via-[#F8746F] to-[#FB866E] text-white shadow-lg shadow-[#F76762]/20 border border-white/20 animate-in slide-in-from-top-2 duration-200">
          {/* Subtle background glow & watermark */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-2 right-1/3 opacity-10 pointer-events-none">
            <Stethoscope className="w-32 h-32 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Left: Token Badge + Patient Core Details */}
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              {/* Distinctive Non-wrapping Token Badge */}
              <div className="px-4 py-2 min-w-[78px] h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex flex-col items-center justify-center shrink-0 shadow-inner">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 leading-none">Token</span>
                <span className="text-lg font-black font-mono tracking-wide text-white whitespace-nowrap leading-tight mt-0.5">
                  {inConsultationPatient.token}
                </span>
              </div>

              {/* Patient Demographics & Session State */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full border border-white/30 text-white shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    Currently in Room
                  </span>
                  <span className="text-xs font-mono text-white/90 bg-black/10 px-2 py-0.5 rounded">
                    {inConsultationPatient.patientUhid}
                  </span>
                  {inConsultationPatient.assignedAt && (
                    <span className="text-xs text-white/80 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-white/80" />
                      <span>Called: {inConsultationPatient.assignedAt}</span>
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
                  {inConsultationPatient.patientName}
                </h2>

                {myAppointments.find(a => a.id === inConsultationPatient.appointmentId)?.reason && (
                  <p className="text-xs text-white/90 truncate max-w-md italic flex items-center gap-1.5">
                    <span className="text-white/70 not-italic font-medium">Chief Complaint:</span>
                    <span>"{myAppointments.find(a => a.id === inConsultationPatient.appointmentId)?.reason}"</span>
                  </p>
                )}
              </div>
            </div>

            {/* Right: Quick Action Hub */}
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => onNavigate(`/doctor/consultation/${inConsultationPatient.appointmentId}`)}
                className="px-5 py-3 bg-white hover:bg-[#FFF9F7] text-[#18212F] text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Stethoscope className="w-4 h-4 text-[#F76762] group-hover:scale-110 transition-transform" />
                <span>Resume Consultation</span>
                <ArrowRight className="w-4 h-4 text-[#F76762] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Today's Clinical Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Card 1: Waiting */}
        <div className="p-4 bg-white rounded-2xl border border-[#F1E4E1] shadow-2xs hover:shadow-xs transition-shadow space-y-1">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11px] font-semibold">Waiting</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-[#18212F] font-mono">
            {waitingPatients.length}
          </div>
          <div className="text-[10px] text-amber-600 font-medium truncate">
            {waitingPatients.length > 0 ? 'Ready to be called' : 'Queue clear'}
          </div>
        </div>

        {/* Card 2: In Consultation */}
        <div className="p-4 bg-white rounded-2xl border border-[#F1E4E1] shadow-2xs hover:shadow-xs transition-shadow space-y-1">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11px] font-semibold">Active Consult</span>
            <Activity className="w-4 h-4 text-[#F76762]" />
          </div>
          <div className="text-2xl font-bold text-[#18212F] font-mono">
            {inConsultationPatient ? 1 : 0}
          </div>
          <div className="text-[10px] text-[#667085] truncate font-mono">
            {inConsultationPatient ? inConsultationPatient.token : 'Room ready'}
          </div>
        </div>

        {/* Card 3: Completed Today */}
        <div className="p-4 bg-white rounded-2xl border border-[#F1E4E1] shadow-2xs hover:shadow-xs transition-shadow space-y-1">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11px] font-semibold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#18212F] font-mono">
            {completedToday.length}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium truncate">
            Consults finished
          </div>
        </div>

        {/* Card 4: Total Scheduled Today */}
        <div className="p-4 bg-white rounded-2xl border border-[#F1E4E1] shadow-2xs hover:shadow-xs transition-shadow space-y-1">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11px] font-semibold">Total Booked</span>
            <Calendar className="w-4 h-4 text-[#F76762]" />
          </div>
          <div className="text-2xl font-bold text-[#18212F] font-mono">
            {totalAppointmentsToday}
          </div>
          <div className="text-[10px] text-[#667085] truncate">
            Today's appointments
          </div>
        </div>

        {/* Card 5: Follow-ups Today */}
        <div className="p-4 bg-white rounded-2xl border border-[#F1E4E1] shadow-2xs hover:shadow-xs transition-shadow space-y-1">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11px] font-semibold">Follow-ups</span>
            <Repeat className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-[#18212F] font-mono">
            {myFollowUps.length}
          </div>
          <div className="text-[10px] text-blue-600 font-medium truncate">
            Review cases
          </div>
        </div>

        {/* Card 6: Remaining Slots */}
        <div className="p-4 bg-white rounded-2xl border border-[#F1E4E1] shadow-2xs hover:shadow-xs transition-shadow space-y-1">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11px] font-semibold">Remaining</span>
            <Users className="w-4 h-4 text-[#667085]" />
          </div>
          <div className="text-2xl font-bold text-[#18212F] font-mono">
            {remainingAppointments}
          </div>
          <div className="text-[10px] text-[#667085] truncate">
            Upcoming today
          </div>
        </div>

      </div>

      {/* 3. Today's Queue Section (Most Important!) */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1E4E1]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-[#18212F]">
                Today's Live Queue — {currentDoctor.name}
              </h2>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Isolated clinical waiting lounge. Only patients assigned to {currentDoctor.room} are shown.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
              {waitingPatients.length} Waiting
            </span>
            <button
              onClick={() => onNavigate('/doctor/appointments')}
              className="text-xs font-semibold text-[#F76762] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Appointments</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Queue Cards / Rows */}
        {myQueue.length > 0 ? (
          <div className="space-y-3">
            {myQueue.map((item) => {
              const apt = myAppointments.find((a) => a.id === item.appointmentId);
              const isWaiting = item.status === 'Waiting';
              const isInRoom = item.status === 'In Consultation';
              const isDone = item.status === 'Completed';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isInRoom
                      ? 'bg-[#FFF9F7] border-[#F76762] shadow-2xs'
                      : isWaiting
                      ? 'bg-white hover:bg-[#FFF9F7]/40 border-[#F1E4E1]'
                      : 'bg-neutral-50/60 border-neutral-200 opacity-75'
                  }`}
                >
                  {/* Left: Token & Patient Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`px-3.5 py-2 min-w-[68px] h-11 rounded-xl flex items-center justify-center font-bold font-mono text-sm shrink-0 whitespace-nowrap ${
                        isInRoom
                          ? 'bg-[#F76762] text-white shadow-xs'
                          : isWaiting
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {item.token}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#18212F]">
                          {item.patientName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-[#667085]">
                          {item.patientUhid}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isInRoom
                              ? 'bg-[#F76762]/10 text-[#F76762]'
                              : isWaiting
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="text-xs text-[#667085] flex items-center gap-2 flex-wrap">
                        <span>Check-in: {item.assignedAt}</span>
                        {apt?.reason && (
                          <>
                            <span>·</span>
                            <span className="text-neutral-700 italic truncate max-w-xs sm:max-w-md">
                              "{apt.reason}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {isWaiting && (
                      <button
                        onClick={() => callPatient(item.token, item.appointmentId)}
                        className="px-3 py-1.5 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        title="Announce patient token into room"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-[#F76762]" />
                        <span>Call</span>
                      </button>
                    )}

                    {!isDone && (
                      <button
                        onClick={() => handleStartConsultation(item.appointmentId)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs ${
                          isInRoom
                            ? 'bg-[#F76762] text-white hover:opacity-95'
                            : 'bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white hover:opacity-95'
                        }`}
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>{isInRoom ? 'Open Workspace' : 'Start Consultation'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isDone && (
                      <button
                        onClick={() => onNavigate(`/doctor/consultation/${item.appointmentId}`)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-[#18212F] bg-white border border-[#F1E4E1] hover:bg-[#FFF9F7] rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#667085]" />
                        <span>View Records</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#FFF9F7]/50 rounded-xl border border-dashed border-[#F1E4E1] space-y-2">
            <Clock className="w-8 h-8 text-[#667085]/60 mx-auto" />
            <h3 className="text-xs font-bold text-[#18212F]">
              No Patients Currently in Queue
            </h3>
            <p className="text-[11px] text-[#667085]">
              When the receptionist registers or checks in a patient for {currentDoctor.name}, they will immediately appear here.
            </p>
          </div>
        )}

      </div>

      {/* 4. Secondary Row: Quick Appointments Schedule & Recent Consultations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Remaining Schedule */}
        <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#F76762]" />
              <h3 className="text-xs font-bold text-[#18212F] uppercase tracking-wider">
                Today's Booked Appointments
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/doctor/appointments')}
              className="text-xs font-semibold text-[#F76762] hover:underline"
            >
              View Schedule
            </button>
          </div>

          <div className="divide-y divide-[#F1E4E1]/80">
            {myAppointments.slice(0, 4).map((apt) => (
              <div key={apt.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#18212F] flex items-center gap-2">
                    <span>{apt.time}</span>
                    <span className="text-[#667085]">·</span>
                    <span>{apt.patientName}</span>
                  </div>
                  <div className="text-[11px] text-[#667085] truncate max-w-xs">
                    {apt.reason || 'Consultation'}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                  apt.status === 'In Consultation' ? 'bg-[#F76762]/10 text-[#F76762]' :
                  apt.status === 'Waiting' ? 'bg-amber-100 text-amber-800' :
                  'bg-neutral-100 text-neutral-700'
                }`}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Follow-ups Monitored */}
        <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[#F76762]" />
              <h3 className="text-xs font-bold text-[#18212F] uppercase tracking-wider">
                Follow-up Patient Reviews
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/doctor/follow-ups')}
              className="text-xs font-semibold text-[#F76762] hover:underline"
            >
              All Follow-ups
            </button>
          </div>

          <div className="divide-y divide-[#F1E4E1]/80">
            {myFollowUps.length > 0 ? (
              myFollowUps.slice(0, 4).map((fu) => (
                <div key={fu.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#18212F]">{fu.patientName}</div>
                    <div className="text-[11px] text-[#667085]">{fu.reason}</div>
                  </div>
                  <span className="font-mono text-[11px] text-[#F76762] font-semibold bg-[#F76762]/10 px-2 py-0.5 rounded">
                    Due: {fu.scheduledDate}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-[#667085]">
                No follow-ups due today for {currentDoctor.name}.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
