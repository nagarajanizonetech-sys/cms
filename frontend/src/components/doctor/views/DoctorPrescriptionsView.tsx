import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Search, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Pill,
  Calendar
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { Prescription } from '../../../types/doctor';
import { PrescriptionA4Modal } from '../modals/PrescriptionA4Modal';

interface DoctorPrescriptionsViewProps {
  onNavigate: (route: string) => void;
}

export const DoctorPrescriptionsView: React.FC<DoctorPrescriptionsViewProps> = () => {
  const { prescriptions, currentDoctorId, doctors } = useReception();
  const currentDoctor = doctors.find((d) => d.id === currentDoctorId || d.id === `doc-${currentDoctorId}`) || doctors[0] || {
    id: '1',
    name: 'Dr. Sarah Khan',
    room: 'Room 101',
    specialization: 'General Medicine',
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRxForPrint, setSelectedRxForPrint] = useState<Prescription | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Doctor Isolation: Only prescriptions issued by this doctor!
  const myPrescriptions = prescriptions.filter((p) => p.doctorId === currentDoctor.id || p.doctorId === currentDoctor.id.replace('doc-', ''));

  const filteredPrescriptions = myPrescriptions.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.patientName.toLowerCase().includes(q) ||
      p.patientUhid.toLowerCase().includes(q) ||
      p.rxNumber.toLowerCase().includes(q) ||
      p.medicines.some((m) => m.name.toLowerCase().includes(q))
    );
  });

  const handleOpenPrint = (rx: Prescription) => {
    setSelectedRxForPrint(rx);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#18212F]">
            Prescription Workspace — {currentDoctor.name}
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Standardized A4 digital prescriptions issued from {currentDoctor.room}.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Rx ID, patient, drug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
          />
        </div>
      </div>

      {/* Prescriptions Table */}
      {filteredPrescriptions.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#F1E4E1] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF9F7] text-[10px] font-bold text-[#667085] uppercase tracking-wider border-b border-[#F1E4E1]">
              <tr>
                <th className="py-3 px-4">Rx Number</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Patient Profile</th>
                <th className="py-3 px-4">Medications</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E4E1]">
              {filteredPrescriptions.map((rx) => (
                <tr key={rx.id} className="hover:bg-[#FFF9F7]/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#F76762]">
                    {rx.rxNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#18212F]">{rx.date}</div>
                    <div className="text-[10px] text-[#667085]">{rx.createdAt.split(' ')[1]} {rx.createdAt.split(' ')[2]}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#18212F]">{rx.patientName}</div>
                    <div className="text-[10px] font-mono text-[#667085]">{rx.patientUhid} · {rx.patientAge}y/{rx.patientGender}</div>
                  </td>
                  <td className="py-3 px-4 max-w-sm">
                    <div className="space-y-0.5">
                      {rx.medicines.map((m, idx) => (
                        <div key={idx} className="text-[11px] truncate">
                          <span className="font-semibold text-[#18212F]">{m.name}</span>
                          <span className="text-[#667085] ml-1 font-mono">({m.strength} · {m.frequency})</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rx.status === 'Printed' ? 'bg-emerald-100 text-emerald-800' :
                      rx.status === 'Dispensed' ? 'bg-blue-100 text-blue-800' :
                      'bg-neutral-100 text-neutral-800'
                    }`}>
                      {rx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenPrint(rx)}
                      className="px-3.5 py-1.5 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#F76762] border border-[#F1E4E1] rounded-xl flex items-center gap-1.5 cursor-pointer ml-auto shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print A4</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#F1E4E1] p-10 text-center text-xs text-[#667085]">
          No prescriptions found matching your search.
        </div>
      )}

      {/* A4 Print Modal */}
      <PrescriptionA4Modal
        prescription={selectedRxForPrint}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  );
};
