import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  Volume2, 
  Stethoscope, 
  ArrowRight, 
  Eye, 
  SkipForward, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  UserCheck
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';

interface DoctorQueueViewProps {
  onNavigate: (route: string) => void;
}

export const DoctorQueueView: React.FC<DoctorQueueViewProps> = ({ onNavigate }) => {
  const { 
    queues, 
    appointments, 
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
  const [statusFilter, setStatusFilter] = useState<'All' | 'Waiting' | 'In Consultation' | 'Completed' | 'Skipped'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Doctor Isolation: Only this doctor's queue!
  const myQueue = queues.filter((q) => q.doctorId === currentDoctor.id || q.doctorId === currentDoctor.id.replace('doc-', ''));

  const filteredQueue = myQueue.filter((item) => {
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.patientName.toLowerCase().includes(q) ||
        item.patientUhid.toLowerCase().includes(q) ||
        item.token.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStartConsultation = (appointmentId: string) => {
    startConsultation(appointmentId, currentDoctor.id);
    onNavigate(`/doctor/consultation/${appointmentId}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold text-[#18212F]">
              Live Queue Board — {currentDoctor.name}
            </h2>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Real-time waiting room orchestration for {currentDoctor.room}. Call patients into room or start clinical consults.
          </p>
        </div>

        {/* Status Counts Pill Summary */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
            {myQueue.filter((q) => q.status === 'Waiting').length} Waiting
          </span>
          <span className="px-3 py-1 bg-[#F76762]/10 text-[#F76762] border border-[#F76762]/20 rounded-xl text-xs font-bold">
            {myQueue.filter((q) => q.status === 'In Consultation').length} In Room
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
            {myQueue.filter((q) => q.status === 'Completed').length} Done
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Waiting', 'In Consultation', 'Completed', 'Skipped'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                statusFilter === tab
                  ? 'bg-[#18212F] text-white shadow-xs'
                  : 'bg-white border border-[#F1E4E1] text-[#667085] hover:text-[#18212F]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search token, patient, UHID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
          />
        </div>
      </div>

      {/* Queue List Cards */}
      {filteredQueue.length > 0 ? (
        <div className="space-y-3">
          {filteredQueue.map((item) => {
            const apt = appointments.find((a) => a.id === item.appointmentId);
            const isWaiting = item.status === 'Waiting';
            const isInRoom = item.status === 'In Consultation';
            const isDone = item.status === 'Completed';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isInRoom
                    ? 'border-[#F76762] shadow-sm bg-[#FFF9F7]'
                    : isWaiting
                    ? 'border-[#F1E4E1] hover:border-[#F76762]/40'
                    : 'border-neutral-200 opacity-80'
                }`}
              >
                {/* Left: Token badge & Patient Identification */}
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <div
                    className={`px-4 py-2 min-w-[76px] h-14 rounded-2xl flex items-center justify-center font-bold font-mono text-base shrink-0 whitespace-nowrap ${
                      isInRoom
                        ? 'bg-[#F76762] text-white shadow-md shadow-[#F76762]/20'
                        : isWaiting
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {item.token}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-[#18212F]">
                        {item.patientName}
                      </h3>
                      <span className="font-mono text-xs text-[#667085] bg-neutral-100 px-2 py-0.5 rounded">
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
                      <span>Assigned: {item.assignedAt}</span>
                      {item.calledAt && (
                        <>
                          <span>·</span>
                          <span className="text-amber-700 font-medium">Called: {item.calledAt}</span>
                        </>
                      )}
                      {apt?.reason && (
                        <>
                          <span>·</span>
                          <span className="italic text-neutral-700">"{apt.reason}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {isWaiting && (
                    <>
                      <button
                        onClick={() => callPatient(item.token, item.appointmentId)}
                        className="px-3.5 py-2 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-[#F76762]" />
                        <span>Call</span>
                      </button>
                      <button
                        onClick={() => skipPatient(item.id)}
                        className="p-2 text-[#667085] hover:text-[#18212F] hover:bg-neutral-100 rounded-xl border border-transparent hover:border-neutral-200 cursor-pointer"
                        title="Skip patient token"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {!isDone && (
                    <button
                      onClick={() => handleStartConsultation(item.appointmentId)}
                      className="px-4.5 py-2 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{isInRoom ? 'Resume Consult' : 'Start Consultation'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isDone && (
                    <button
                      onClick={() => onNavigate(`/doctor/consultation/${item.appointmentId}`)}
                      className="px-4 py-2 bg-white hover:bg-[#FFF9F7] text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl flex items-center gap-1.5 cursor-pointer"
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
        <div className="bg-white rounded-2xl border border-dashed border-[#F1E4E1] p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-[#667085]/60 mx-auto" />
          <h3 className="text-sm font-bold text-[#18212F]">
            No patients match this queue filter
          </h3>
          <p className="text-xs text-[#667085] max-w-sm mx-auto">
            Try switching filter tabs or checking back once reception checks in upcoming patients.
          </p>
        </div>
      )}

    </div>
  );
};
