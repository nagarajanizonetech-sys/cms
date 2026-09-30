import React, { useState } from 'react';
import { 
  Receipt, 
  CreditCard, 
  Search, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';

interface DoctorChargesViewProps {
  onNavigate: (route: string) => void;
}

export const DoctorChargesView: React.FC<DoctorChargesViewProps> = () => {
  const { bills, appointments, consultations, currentDoctorId, doctors } = useReception();
  const currentDoctor = doctors.find((d) => d.id === currentDoctorId || d.id === `doc-${currentDoctorId}`) || doctors[0] || {
    id: '1',
    name: 'Dr. Sarah Khan',
    specialization: 'General Medicine',
    room: 'Room 101',
    code: 'DOC-1',
  };
  const cleanDocId = (currentDoctor?.id || '1').replace('doc-', '');

  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter bills created by this doctor, linked to appointments/consultations for this doctor, or all clinic bills
  const myDoctorBills = bills.filter((b) => {
    if (b.appointmentId) {
      const appt = appointments.find((a) => a.id === b.appointmentId);
      if (appt && (appt.doctorId === currentDoctor.id || appt.doctorId === cleanDocId || appt.doctorName?.toLowerCase().includes(currentDoctor.name.toLowerCase()))) {
        return true;
      }
    }
    const cons = consultations.find((c) => c.appointmentId === b.appointmentId || c.patientId === b.patientId);
    if (cons && (cons.doctorId === currentDoctor.id || cons.doctorId === cleanDocId || cons.doctorName?.toLowerCase().includes(currentDoctor.name.toLowerCase()))) {
      return true;
    }
    if (b.createdByName?.toLowerCase().includes(currentDoctor.name.toLowerCase())) {
      return true;
    }
    if (b.charges.some((c) => c.notes?.toLowerCase().includes(currentDoctor.name.toLowerCase()))) {
      return true;
    }
    if (b.payments.some((p) => p.collectorName?.toLowerCase().includes(currentDoctor.name.toLowerCase()) || p.note?.toLowerCase().includes(currentDoctor.name.toLowerCase()))) {
      return true;
    }
    return false;
  });

  const displayBills = myDoctorBills.length > 0 ? myDoctorBills : bills;

  const filteredBills = displayBills.filter((b) => {
    if (statusFilter !== 'All' && b.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        b.billNumber.toLowerCase().includes(q) ||
        b.patientName.toLowerCase().includes(q) ||
        b.patientUhid.toLowerCase().includes(q) ||
        b.charges.some((ch) => ch.serviceName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalCollected = displayBills.reduce((acc, b) => acc + b.paidAmount, 0);
  const totalPending = displayBills.filter((b) => b.status === 'Pending' || b.status === 'Partially Paid').reduce((acc, b) => acc + b.balanceAmount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#18212F]">
              Doctor Service Charges & Collections — {currentDoctor.name}
            </h2>
            {myDoctorBills.length === 0 && bills.length > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Clinic Wide
              </span>
            )}
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Accounting of clinical services ordered, doctor in-room collections, and charges sent to Reception Desk.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FFF9F7] rounded-xl border border-[#F1E4E1] text-xs">
            <span className="text-[#667085] text-[10px] uppercase font-bold block">Total Collected:</span>
            <span className="font-bold text-[#18212F] text-base font-mono">₹{totalCollected.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs">
            <span className="text-amber-800 text-[10px] uppercase font-bold block">Pending at Reception:</span>
            <span className="font-bold text-amber-900 text-base font-mono">₹{totalPending.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['All', 'Paid', 'Pending'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === status
                  ? 'bg-[#18212F] text-white shadow-xs'
                  : 'bg-white border border-[#F1E4E1] text-[#667085] hover:text-[#18212F]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search charges, patient, invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
          />
        </div>
      </div>

      {/* Charges Table */}
      {filteredBills.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#F1E4E1] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF9F7] text-[10px] font-bold text-[#667085] uppercase tracking-wider border-b border-[#F1E4E1]">
              <tr>
                <th className="py-3 px-4">Invoice / Date</th>
                <th className="py-3 px-4">Patient Profile</th>
                <th className="py-3 px-4">Services Ordered</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4">Collection Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E4E1]">
              {filteredBills.map((b) => {
                const docPayment = b.payments.find((p) => p.collectedBy === 'Doctor');
                return (
                  <tr key={b.id} className="hover:bg-[#FFF9F7]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#18212F]">{b.billNumber}</div>
                      <div className="text-[10px] text-[#667085]">{b.createdAt}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#18212F]">{b.patientName}</div>
                      <div className="text-[10px] font-mono text-[#667085]">{b.patientUhid}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {b.charges.map((ch) => (
                          <span key={ch.id} className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FFF9F7] border border-[#F1E4E1] text-[#18212F]">
                            {ch.serviceName} (₹{ch.amount.toFixed(2)})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#18212F]">
                      ₹{b.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {docPayment ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid in room ({docPayment.paymentMethod})</span>
                        </span>
                      ) : b.status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid at Reception</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>Pending at Reception</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#F1E4E1] p-10 text-center text-xs text-[#667085]">
          No clinical service charges found matching the criteria.
        </div>
      )}

    </div>
  );
};
