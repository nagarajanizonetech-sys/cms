import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Calendar, 
  Clock, 
  FileText, 
  History, 
  Phone, 
  ArrowRight,
  Eye,
  AlertTriangle,
  Stethoscope
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { Patient } from '../../../types/reception';
import { getPatientAgeDisplay } from '../../../utils/validation';

interface DoctorPatientsViewProps {
  onNavigate: (route: string) => void;
}

export const DoctorPatientsView: React.FC<DoctorPatientsViewProps> = ({ onNavigate }) => {
  const { patients, appointments, consultations, followUps, currentDoctorId, doctors, prescriptions } = useReception();
  const currentDoctor = doctors.find((d) => d.id === currentDoctorId || d.id === `doc-${currentDoctorId}`) || doctors[0] || {
    id: '1',
    name: 'Dr. Sarah Khan',
    room: 'Room 101',
    specialization: 'General Medicine',
  };
  const cleanDocId = (currentDoctor?.id || '1').replace('doc-', '');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<Patient | null>(null);

  // Doctor Isolation: Patients seen by or booked with this doctor
  const myAppointments = appointments.filter((a) => a.doctorId === currentDoctor.id || a.doctorId === cleanDocId);
  const myConsultations = consultations.filter((c) => c.doctorId === currentDoctor.id || c.doctorId === cleanDocId);

  const myDoctorPatients = patients.filter((p) => 
    myAppointments.some((a) => a.patientId === p.id) ||
    myConsultations.some((c) => c.patientId === p.id)
  );

  const filteredPatients = myDoctorPatients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.mobile.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#18212F]">
            My Patient Directory — {currentDoctor.name}
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Electronic clinical records for patients under your clinical care.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, UHID, mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
          />
        </div>
      </div>

      {/* Patient Directory Table */}
      {filteredPatients.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#F1E4E1] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF9F7] text-[10px] font-bold text-[#667085] uppercase tracking-wider border-b border-[#F1E4E1]">
              <tr>
                <th className="py-3 px-4">Patient Profile</th>
                <th className="py-3 px-4">UHID</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Known Allergies</th>
                <th className="py-3 px-4">Last Consultation</th>
                <th className="py-3 px-4">Follow-up</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E4E1]">
              {filteredPatients.map((p) => {
                const patientConsults = myConsultations.filter((c) => c.patientId === p.id);
                const lastConsult = patientConsults[0];
                const patientFollowUp = followUps.find((f) => f.patientId === p.id && (f.doctorId === currentDoctor.id || f.doctorId === cleanDocId) && f.status === 'Scheduled');

                return (
                  <tr key={p.id} className="hover:bg-[#FFF9F7]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#18212F]">{p.fullName}</div>
                      <div className="text-[10px] text-[#667085] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{p.mobile}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#18212F]">
                      {p.uhid}
                    </td>
                    <td className="py-3 px-4 text-[#667085]">
                      {getPatientAgeDisplay(p)} · {p.gender}
                    </td>
                    <td className="py-3 px-4">
                      {p.allergies ? (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {p.allergies}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#667085]">None reported</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {lastConsult ? (
                        <div>
                          <div className="font-semibold text-[#18212F]">{lastConsult.date}</div>
                          <div className="text-[10px] text-[#667085] truncate max-w-xs">
                            {lastConsult.diagnoses.map((d) => d.description).join(', ') || 'Consultation'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#667085]">First consultation</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {patientFollowUp ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {patientFollowUp.scheduledDate}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#667085]">None scheduled</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate(`/doctor/history/${p.id}`)}
                          className="px-3 py-1.5 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-[#F76762]/40"
                          title="View complete clinical history & aligned patient details"
                        >
                          <History className="w-3.5 h-3.5 text-[#F76762]" />
                          <span>History & Profile</span>
                        </button>
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
          No patients found in your clinical directory.
        </div>
      )}

      {/* Patient History Timeline Modal */}
      {selectedPatientForHistory && (
        <div className="fixed inset-0 z-50 bg-[#18212F]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#F1E4E1] p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[85vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#F1E4E1]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white font-bold text-sm">
                  {selectedPatientForHistory.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18212F]">
                    {selectedPatientForHistory.fullName}
                  </h3>
                  <div className="text-[11px] text-[#667085] font-mono">
                    {selectedPatientForHistory.uhid} · {getPatientAgeDisplay(selectedPatientForHistory)}/{selectedPatientForHistory.gender} · {selectedPatientForHistory.mobile}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPatientForHistory(null)}
                className="p-1.5 text-[#667085] hover:text-[#18212F] rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Medical History Tabular View */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#18212F] uppercase tracking-wider">
                Patient Consultation History
              </div>

              {myConsultations.filter((c) => c.patientId === selectedPatientForHistory.id).length > 0 ? (
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
                      {myConsultations
                        .filter((c) => c.patientId === selectedPatientForHistory.id)
                        .map((c) => {
                          const rx = prescriptions.find(
                            (p) =>
                              (c.appointmentId && p.appointmentId === c.appointmentId) ||
                              p.date === c.date
                          );
                          const symptomsList = c.symptoms && c.symptoms.length > 0 ? c.symptoms : [];

                          return (
                            <tr key={c.id} className="hover:bg-[#FFF9F7]/40 transition-colors align-top">
                              {/* Column 1: Appointment History */}
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <div className="font-semibold text-[#18212F] flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-[#F76762] shrink-0" />
                                  <span>{c.date}</span>
                                </div>
                                <div className="text-[10px] text-[#667085] mt-0.5">
                                  {c.startedAt ? `At ${c.startedAt}` : ''}
                                </div>
                                <span className={`inline-block px-1.5 py-0.5 mt-1 rounded text-[9px] font-bold ${
                                  c.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {c.status}
                                </span>
                              </td>

                              {/* Column 2: Causes (Symptoms) */}
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
                                ) : c.chiefComplaint ? (
                                  <span className="text-[11px] text-[#18212F] font-medium">
                                    {c.chiefComplaint}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#98A2B3] italic">None recorded</span>
                                )}
                              </td>

                              {/* Column 3: Prescription */}
                              <td className="py-2.5 px-3">
                                {rx && rx.medicines && rx.medicines.length > 0 ? (
                                  <div className="space-y-1">
                                    {rx.medicines.map((m, idx) => (
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
                <div className="text-xs text-[#667085] py-4 text-center bg-[#FFF9F7] rounded-xl border border-dashed border-[#F1E4E1]">
                  No historical consultations recorded yet with {currentDoctor.name}.
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedPatientForHistory(null)}
              className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-[#18212F] rounded-xl cursor-pointer"
            >
              Close Timeline
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
