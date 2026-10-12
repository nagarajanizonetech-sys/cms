import React, { useState } from 'react';
import { 
  Clock, 
  Stethoscope, 
  UserCheck, 
  RotateCcw, 
  SkipForward, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  User,
  Activity,
  Flame,
  Volume2,
  Zap
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';

interface QueueViewProps {
  onOpenWalkInModal: (doctorId?: string) => void;
  onSelectPatient: (patientId: string) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  onOpenWalkInModal,
  onSelectPatient,
}) => {
  const { doctors, queues, updateQueueAction } = useReception();
  const [callingToast, setCallingToast] = useState<string | null>(null);

  const handleAction = (queueId: string, action: 'call_next' | 'skip' | 'recall' | 'mark_waiting' | 'complete', token: string) => {
    updateQueueAction(queueId, action);
    if (action === 'call_next') {
      setCallingToast(`Token ${token} called to doctor consultation room.`);
      setTimeout(() => setCallingToast(null), 3000);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      
      {/* Toast Announcement */}
      {callingToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18212F] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs border border-neutral-700 animate-in fade-in duration-150">
          <Volume2 className="w-4 h-4 text-[#F76762] animate-bounce shrink-0" />
          <span className="font-semibold">{callingToast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#18212F] tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F76762]" />
            <span>Clinic Live Queue Board</span>
          </h2>
          <p className="text-[11px] text-[#667085] mt-0.5">
            Real-time multi-doctor token orchestration, patient waiting lounge status, and room calling
          </p>
        </div>

        <button
          onClick={() => onOpenWalkInModal()}
          className="px-4 py-2.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-xs hover:opacity-90 transition-all cursor-pointer text-xs"
        >
          <Zap className="w-4 h-4" />
          <span>Add Walk-in to Queue</span>
        </button>
      </div>

      {/* Doctor Queues Grid (Separate lanes per doctor) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {doctors.map((doc) => {
          const docQueueWaiting = queues.filter(q => q.doctorId === doc.id && q.status === 'Waiting');
          const docActiveInRoom = queues.find(q => q.doctorId === doc.id && q.status === 'In Consultation');
          const docQueueSkipped = queues.filter(q => q.doctorId === doc.id && q.status === 'Skipped');
          const docQueueCompleted = queues.filter(q => q.doctorId === doc.id && q.status === 'Completed');

          return (
            <div 
              key={doc.id}
              className="bg-white rounded-2xl border border-[#F1E4E1] shadow-xs overflow-hidden flex flex-col justify-between h-full"
            >
              
              {/* Doctor Lane Header */}
              <div className="p-3.5 sm:p-4 bg-[#FFF9F7] border-b border-[#F1E4E1] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="px-2.5 h-7 sm:h-8 rounded-xl bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white flex items-center justify-center font-mono font-bold text-[11px] sm:text-xs shrink-0 shadow-2xs whitespace-nowrap tracking-wide">
                    {doc.code}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-[#18212F]">{doc.name}</h3>
                    <div className="text-[10px] sm:text-[11px] text-[#667085] flex flex-wrap items-center gap-1.5 font-mono">
                      <span>{doc.room}</span>
                      {doc.specialization && (
                        <>
                          <span>·</span>
                          <span>{doc.specialization}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1E4E1]/60 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    doc.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    doc.status === 'In Consultation' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-neutral-100 text-neutral-600'
                  }`}>
                    {doc.status}
                  </span>
                  <div className="px-2.5 py-1 rounded-full bg-white border border-[#F1E4E1] text-[10px] text-[#667085] font-mono shadow-2xs">
                    Waiting: <strong className="text-[#F76762]">{docQueueWaiting.length}</strong>
                  </div>
                </div>
              </div>

              {/* Current Active Patient In Consultation Room (Equalized Height) */}
              <div className="p-4 bg-gradient-to-r from-[#FFF9F7] to-white border-b border-[#F1E4E1]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#667085] mb-2.5 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#F76762]" />
                  <span>Currently in Room (Active Consultation)</span>
                </div>

                {docActiveInRoom ? (
                  <div className="p-3 bg-white rounded-xl border border-[#F76762]/30 shadow-xs flex items-center justify-between min-h-[76px]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#F76762]/10 border border-[#F76762]/20 flex flex-col items-center justify-center shrink-0">
                        <span className="text-sm font-extrabold font-mono text-[#F76762] leading-none">
                          {docActiveInRoom.token}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mt-1" />
                      </div>
                      <div className="min-w-0">
                        <div 
                          onClick={() => onSelectPatient(docActiveInRoom.patientId)}
                          className="font-bold text-xs text-[#18212F] hover:text-[#F76762] cursor-pointer truncate"
                        >
                          {docActiveInRoom.patientName}
                        </div>
                        <div className="text-[10px] font-mono text-[#667085] mt-0.5 truncate">
                          {docActiveInRoom.patientUhid} · {docActiveInRoom.calledAt || 'Just now'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAction(docActiveInRoom.id, 'complete', docActiveInRoom.token)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors shadow-2xs ml-2"
                      title="Mark Consultation Complete"
                    >
                      Complete
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-white/60 rounded-xl border border-[#F1E4E1] text-[#667085] text-center italic flex items-center justify-center min-h-[76px] text-xs">
                    Doctor is ready. No patient currently in consultation room.
                  </div>
                )}
              </div>

              {/* Waiting Patients List */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#18212F] mb-3">
                    <span>Waiting Lounge ({docQueueWaiting.length} Patients)</span>
                    <span className="text-[10px] text-[#667085] font-normal">Next in order</span>
                  </div>

                  {docQueueWaiting.length === 0 ? (
                    <div className="py-8 text-center text-[#667085] bg-[#FFF9F7]/40 rounded-xl border border-dashed border-[#F1E4E1] flex flex-col items-center justify-center min-h-[140px]">
                      <User className="w-5 h-5 text-[#d0c5c0] mb-1.5" />
                      <p className="text-[11px] font-medium text-[#8c827d]">Queue empty. No patients waiting.</p>
                      <p className="text-[10px] text-[#a89e99] mt-0.5">Tokens will appear here once checked in.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {docQueueWaiting.map((item, idx) => (
                        <div 
                          key={item.id}
                          className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            idx === 0 
                              ? 'bg-white border-[#F76762]/40 shadow-xs' 
                              : 'bg-white border-[#F1E4E1]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`px-2.5 py-1 min-w-[52px] h-8 rounded-lg flex items-center justify-center font-mono font-extrabold text-xs shrink-0 whitespace-nowrap ${
                              idx === 0 
                                ? 'bg-[#F76762] text-white shadow-2xs' 
                                : 'bg-neutral-100 text-[#18212F]'
                            }`}>
                              {item.token}
                            </div>

                            <div className="min-w-0">
                              <div 
                                onClick={() => onSelectPatient(item.patientId)}
                                className="font-bold text-xs text-[#18212F] hover:text-[#F76762] cursor-pointer truncate"
                              >
                                {item.patientName}
                              </div>
                              <div className="text-[10px] font-mono text-[#667085] truncate">
                                {item.patientUhid} · {item.assignedAt}
                              </div>
                            </div>
                          </div>

                          {/* Queue Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleAction(item.id, 'call_next', item.token)}
                              className="px-2.5 py-1 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white rounded-lg font-bold text-xs shadow-2xs hover:opacity-90 cursor-pointer transition-opacity"
                              title="Call Patient Into Doctor Room"
                            >
                              Call Next
                            </button>
                            <button
                              onClick={() => handleAction(item.id, 'skip', item.token)}
                              className="p-1.5 hover:bg-[#FFF9F7] text-[#667085] hover:text-[#18212F] rounded border border-[#F1E4E1] cursor-pointer transition-colors"
                              title="Skip Patient (temporarily away)"
                            >
                              <SkipForward className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Lane Footer / Status Bar */}
              <div className="border-t border-[#F1E4E1] bg-[#FFF9F7]/60 divide-y divide-[#F1E4E1]">
                {docQueueSkipped.length > 0 && (
                  <div className="p-3 bg-amber-50/60">
                    <div className="text-[10px] uppercase font-bold text-amber-800 mb-1.5">
                      Skipped / Stepped Out ({docQueueSkipped.length}):
                    </div>
                    <div className="space-y-1">
                      {docQueueSkipped.map((sq) => (
                        <div key={sq.id} className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded border border-amber-200">
                          <span className="font-mono font-bold text-amber-800">{sq.token} — {sq.patientName}</span>
                          <button
                            onClick={() => handleAction(sq.id, 'recall', sq.token)}
                            className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer"
                          >
                            Recall to Queue
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-4 py-2 flex items-center justify-between text-[10px] text-[#667085] font-mono">
                  <span>Completed: <strong className="text-emerald-700 font-bold">{docQueueCompleted.length}</strong></span>
                  <span>Shift: {doc.schedule.startTime} – {doc.schedule.endTime}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Safety Notice regarding clinical permissions */}
      <div className="p-3.5 bg-white rounded-xl border border-[#F1E4E1] text-[11px] text-[#667085] flex items-center justify-between">
        <span>Reception role has front-desk queue management authority only. Clinical examination notes and prescriptions remain strictly doctor-confidential.</span>
        <span className="font-mono text-[#F76762] font-semibold">HIPAA / Data Protected</span>
      </div>

    </div>
  );
};
