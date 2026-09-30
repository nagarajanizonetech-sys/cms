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
              className="bg-white rounded-2xl border border-[#F1E4E1] shadow-xs overflow-hidden flex flex-col justify-between"
            >
              
              {/* Doctor Lane Header */}
              <div className="p-4 bg-[#FFF9F7] border-b border-[#F1E4E1] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F76762] to-[#FB866E] text-white flex items-center justify-center font-bold text-xs">
                    {doc.code}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#18212F]">{doc.name}</h3>
                    <div className="text-[10px] text-[#667085] font-mono">{doc.room}</div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      doc.status === 'In Consultation' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-neutral-100 text-neutral-600'
                    }`}>
                      {doc.status}
                    </span>
                    <button
                      onClick={() => onOpenWalkInModal(doc.id)}
                      className="px-2 py-0.5 bg-white hover:bg-[#F76762]/10 text-[#F76762] border border-[#F76762]/30 hover:border-[#F76762] rounded-md text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                      title={`Register walk-in token for ${doc.name}`}
                    >
                      <Zap className="w-3 h-3 text-[#F76762]" />
                      <span>+ Walk-in</span>
                    </button>
                  </div>
                  <div className="text-[10px] text-[#667085] mt-0.5 font-mono">
                    Waiting: <strong className="text-[#F76762]">{docQueueWaiting.length}</strong>
                  </div>
                </div>
              </div>

              {/* Current Active Patient In Consultation Room */}
              <div className="p-4 bg-gradient-to-r from-[#FFF9F7] to-white border-b border-[#F1E4E1]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#667085] mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#F76762]" />
                  <span>Currently in Room (Active Consultation)</span>
                </div>

                {docActiveInRoom ? (
                  <div className="p-3 bg-white rounded-xl border border-[#F76762]/30 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold font-mono text-[#F76762]">
                          {docActiveInRoom.token}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div 
                        onClick={() => onSelectPatient(docActiveInRoom.patientId)}
                        className="font-bold text-xs text-[#18212F] hover:text-[#F76762] cursor-pointer mt-0.5"
                      >
                        {docActiveInRoom.patientName}
                      </div>
                      <div className="text-[10px] font-mono text-[#667085]">
                        {docActiveInRoom.patientUhid} · Called at {docActiveInRoom.calledAt || 'Just now'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAction(docActiveInRoom.id, 'complete', docActiveInRoom.token)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer"
                        title="Mark Consultation Complete"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white/60 rounded-xl border border-[#F1E4E1] text-[#667085] text-center italic">
                    Doctor is ready. No patient currently in consultation room.
                  </div>
                )}
              </div>

              {/* Waiting Patients List */}
              <div className="p-4 flex-1 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#18212F]">
                  <span>Waiting Lounge ({docQueueWaiting.length} Patients)</span>
                  <span className="text-[10px] text-[#667085] font-normal">Next in order</span>
                </div>

                {docQueueWaiting.length === 0 ? (
                  <div className="py-7 text-center text-[#667085] bg-[#FFF9F7]/40 rounded-xl border border-dashed border-[#F1E4E1] space-y-2">
                    <p className="text-[11px]">Queue empty. No patients currently waiting for {doc.name}.</p>
                    <button
                      onClick={() => onOpenWalkInModal(doc.id)}
                      className="px-3 py-1.5 bg-white border border-[#F1E4E1] hover:border-[#F76762] text-[#18212F] hover:text-[#F76762] rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#F76762]" />
                      <span>Register Walk-in for {doc.name}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {docQueueWaiting.map((item, idx) => (
                      <div 
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                          idx === 0 
                            ? 'bg-white border-[#F76762]/40 shadow-xs' 
                            : 'bg-white border-[#F1E4E1]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`px-2.5 py-1 min-w-[58px] h-8 rounded-lg flex items-center justify-center font-mono font-extrabold text-xs shrink-0 whitespace-nowrap ${
                            idx === 0 
                              ? 'bg-[#F76762] text-white shadow-2xs' 
                              : 'bg-neutral-100 text-[#18212F]'
                          }`}>
                            {item.token}
                          </div>

                          <div>
                            <div 
                              onClick={() => onSelectPatient(item.patientId)}
                              className="font-bold text-xs text-[#18212F] hover:text-[#F76762] cursor-pointer"
                            >
                              {item.patientName}
                            </div>
                            <div className="text-[10px] font-mono text-[#667085]">
                              {item.patientUhid} · Assigned {item.assignedAt}
                            </div>
                          </div>
                        </div>

                        {/* Queue Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAction(item.id, 'call_next', item.token)}
                            className="px-2.5 py-1 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white rounded-lg font-bold text-xs shadow-2xs hover:opacity-90 cursor-pointer"
                            title="Call Patient Into Doctor Room"
                          >
                            Call Next
                          </button>
                          <button
                            onClick={() => handleAction(item.id, 'skip', item.token)}
                            className="p-1 hover:bg-[#FFF9F7] text-[#667085] hover:text-[#18212F] rounded border border-[#F1E4E1] cursor-pointer"
                            title="Skip Patient (temporarily away)"
                          >
                            <SkipForward className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skipped / Deferred Patients (if any) */}
              {docQueueSkipped.length > 0 && (
                <div className="p-3 bg-amber-50/60 border-t border-amber-200">
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
