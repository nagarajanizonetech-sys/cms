import React, { useState } from 'react';
import { 
  Stethoscope, 
  Search, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Eye, 
  CheckCircle2, 
  Filter,
  FileText
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';

interface DoctorConsultationsViewProps {
  onNavigate: (route: string) => void;
}

export const DoctorConsultationsView: React.FC<DoctorConsultationsViewProps> = ({ onNavigate }) => {
  const { consultations, currentDoctorId, doctors } = useReception();
  const currentDoctor = doctors.find((d) => d.id === currentDoctorId || d.id === `doc-${currentDoctorId}`) || doctors[0] || {
    id: '1',
    name: 'Dr. Sarah Khan',
    room: 'Room 101',
    specialization: 'General Medicine',
  };
  const cleanDocId = (currentDoctor?.id || '1').replace('doc-', '');

  const [searchQuery, setSearchQuery] = useState('');

  // Doctor Isolation: Only consultations conducted by this doctor!
  const myConsultations = consultations.filter((c) => 
    !currentDoctor ? true : (
      c.doctorId === currentDoctor.id || 
      (cleanDocId && c.doctorId === cleanDocId) || 
      (c.doctorName && currentDoctor.name && c.doctorName.toLowerCase().includes(currentDoctor.name.toLowerCase()))
    )
  );

  const filteredConsultations = myConsultations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.patientName.toLowerCase().includes(q) ||
      c.patientUhid.toLowerCase().includes(q) ||
      c.chiefComplaint.toLowerCase().includes(q) ||
      c.diagnoses.some((d) => d.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#18212F]">
            Clinical Consultations Log — {currentDoctor.name}
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Complete archive of patient consultation notes, recorded vitals, diagnoses, and therapeutic decisions.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search diagnosis, patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
          />
        </div>
      </div>

      {/* Consultations Table */}
      {filteredConsultations.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#F1E4E1] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF9F7] text-[10px] font-bold text-[#667085] uppercase tracking-wider border-b border-[#F1E4E1]">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Patient Details</th>
                <th className="py-3 px-4">Chief Complaint & Vitals</th>
                <th className="py-3 px-4">Diagnosis</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E4E1]">
              {filteredConsultations.map((c) => (
                <tr key={c.id} className="hover:bg-[#FFF9F7]/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#18212F]">{c.date}</div>
                    <div className="text-[10px] text-[#667085]">{c.startedAt}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#18212F]">{c.patientName}</div>
                    <div className="text-[10px] font-mono text-[#667085]">{c.patientUhid}</div>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-medium text-[#18212F] truncate">{c.chiefComplaint || 'Clinical evaluation'}</div>
                    {c.vitals && (c.vitals.bloodPressureSystolic || c.vitals.pulse) ? (
                      <div className="text-[10px] text-[#667085] flex flex-wrap items-center gap-1.5 mt-0.5 font-mono">
                        {c.vitals.bloodPressureSystolic && (
                          <span className="bg-white px-1.5 py-0.2 rounded border border-[#F1E4E1]">
                            BP: {c.vitals.bloodPressureSystolic}/{c.vitals.bloodPressureDiastolic}
                          </span>
                        )}
                        {c.vitals.pulse && (
                          <span className="bg-white px-1.5 py-0.2 rounded border border-[#F1E4E1]">
                            HR: {c.vitals.pulse} bpm
                          </span>
                        )}
                        {c.vitals.spO2 && (
                          <span className="bg-white px-1.5 py-0.2 rounded border border-[#F1E4E1]">
                            SpO2: {c.vitals.spO2}%
                          </span>
                        )}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3 px-4">
                    {c.diagnoses && c.diagnoses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {c.diagnoses.map((d) => (
                          <span key={d.id} className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FFF9F7] border border-[#F1E4E1] text-[#18212F]">
                            {d.description}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#667085]">Not documented</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigate(`/doctor/consultation/${c.appointmentId}`)}
                      className="px-3.5 py-1.5 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl flex items-center gap-1 cursor-pointer ml-auto shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#F76762]" />
                      <span>{c.status === 'Completed' ? 'View & Edit' : 'Resume'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#F1E4E1] p-10 text-center text-xs text-[#667085]">
          No consultation records found.
        </div>
      )}

    </div>
  );
};
