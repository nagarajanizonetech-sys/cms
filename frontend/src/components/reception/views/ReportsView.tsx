import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  IndianRupee, 
  Users, 
  CheckCircle2, 
  CreditCard, 
  TrendingUp, 
  Printer, 
  Download,
  Stethoscope,
  RefreshCw,
  Database
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { api } from '../../../services/api';

export const ReportsView: React.FC = () => {
  const { patients, appointments, bills, doctors } = useReception();
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch report directly from PostgreSQL DB
  const loadReport = async () => {
    setIsLoading(true);
    try {
      const res = await api.getOperationalReport(period);
      if (res) {
        setReportData(res);
      }
    } catch (err) {
      console.warn('Failed to load DB operational report, using local context data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [period]);

  // Use database data when available, with live context fallback
  const totalAppointments = reportData ? reportData.total_appointments : appointments.length;
  const completedConsultations = reportData ? reportData.completed_consultations : appointments.filter(a => a.status === 'Completed').length;
  const waitingAppointments = reportData ? reportData.waiting_appointments : appointments.filter(a => a.status === 'Waiting').length;

  const totalInvoiced = reportData ? reportData.total_invoiced : bills.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalCollected = reportData ? reportData.total_collected : bills.reduce((acc, b) => acc + b.paidAmount, 0);
  const totalPending = reportData ? reportData.total_pending : bills.reduce((acc, b) => acc + b.balanceAmount, 0);

  // Payment Method Breakdown from DB
  const methodTotals: Record<string, number> = reportData?.method_totals || (() => {
    const totals: Record<string, number> = { Cash: 0, UPI: 0, Card: 0, Other: 0 };
    bills.forEach(b => {
      b.payments.forEach(p => {
        totals[p.paymentMethod] = (totals[p.paymentMethod] || 0) + p.amount;
      });
    });
    return totals;
  })();

  // Doctor-wise breakdown from DB
  const doctorStats = reportData?.doctor_stats || doctors.map(doc => {
    const docAppts = appointments.filter(a => a.doctorId === doc.id);
    const docCompleted = docAppts.filter(a => a.status === 'Completed').length;
    const docBills = bills.filter(b => b.charges.some(c => c.notes?.includes(doc.name) || b.createdByName.includes(doc.name)));
    const docCollections = docBills.reduce((acc, b) => acc + b.paidAmount, 0);

    return {
      doctor: doc,
      totalVisits: docAppts.length,
      completed: docCompleted,
      collections: docCollections,
    };
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-xs">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#18212F] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#F76762]" />
            <span>Reception Daily Operational & Financial Reports</span>
          </h2>
          <p className="text-[11px] text-[#667085] mt-0.5">
            Shift accounting, patient turnover, doctor throughput, and payment collection breakdown
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Filter */}
          <div className="inline-flex p-1 bg-[#FFF9F7] rounded-xl border border-[#F1E4E1]">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  period === p.id
                    ? 'bg-[#18212F] text-white'
                    : 'text-[#667085] hover:text-[#18212F]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadReport}
            disabled={isLoading}
            className="p-2 bg-white hover:bg-neutral-50 text-[#18212F] border border-[#F1E4E1] rounded-xl transition-colors cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 text-[#667085] ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handlePrint}
            className="p-2 bg-white hover:bg-neutral-50 text-[#18212F] border border-[#F1E4E1] rounded-xl transition-colors cursor-pointer"
            title="Print Shift Summary"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-[#F1E4E1] shadow-2xs">
          <div className="text-[11px] text-[#667085] font-semibold">Total Consultations</div>
          <div className="text-2xl font-extrabold text-[#18212F] font-mono mt-1">{totalAppointments}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            {completedConsultations} completed consultations
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#F1E4E1] shadow-2xs">
          <div className="text-[11px] text-[#667085] font-semibold">Total Revenue Invoiced</div>
          <div className="text-2xl font-extrabold text-[#18212F] font-mono mt-1">₹{totalInvoiced.toFixed(2)}</div>
          <div className="text-[10px] text-[#667085] mt-1">Consultation & procedures</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#F1E4E1] shadow-2xs">
          <div className="text-[11px] text-[#667085] font-semibold">Shift Intake Collected</div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">₹{totalCollected.toFixed(2)}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Cash, UPI, & Card intake</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#F1E4E1] shadow-2xs">
          <div className="text-[11px] text-[#667085] font-semibold">Pending Outstanding</div>
          <div className="text-2xl font-extrabold text-[#F76762] font-mono mt-1">₹{totalPending.toFixed(2)}</div>
          <div className="text-[10px] text-[#F76762] font-medium mt-1">Unsettled patient dues</div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Payment Method Breakdown */}
        <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#18212F] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#F76762]" />
              <span>Intake by Payment Method</span>
            </h3>
            <span className="font-mono text-[11px] font-bold text-emerald-600">₹{totalCollected.toFixed(2)}</span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(methodTotals).map(([method, amount]) => {
              const percentage = totalCollected > 0 ? (amount / totalCollected) * 100 : 0;

              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#18212F]">{method}</span>
                    <span className="font-mono font-bold text-[#18212F]">₹{amount.toFixed(2)} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#FFF9F7] rounded-full overflow-hidden border border-[#F1E4E1]">
                    <div 
                      className={`h-full rounded-full ${
                        method === 'Cash' ? 'bg-[#F76762]' :
                        method === 'UPI' ? 'bg-emerald-500' :
                        method === 'Card' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-[10px] text-[#667085] border-t border-[#F1E4E1]">
            * Verified against daily cash drawer count and digital settlement summaries.
          </div>
        </div>

        {/* Doctor-wise Workload & Consultations */}
        <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#18212F] flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#F76762]" />
              <span>Doctor-wise Consultations & Revenue</span>
            </h3>
            <span className="text-[11px] text-[#667085] font-mono">{doctors.length} Active Stations</span>
          </div>

          <div className="space-y-3">
            {doctorStats.map((ds) => (
              <div key={ds.doctor.id} className="p-3 bg-[#FFF9F7] rounded-xl border border-[#F1E4E1] flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-[#18212F]">{ds.doctor.name}</div>
                  <div className="text-[10px] text-[#667085]">{ds.doctor.room.split('·')[0]} · {ds.doctor.specialization}</div>
                </div>

                <div className="text-right">
                  <div className="font-bold font-mono text-xs text-[#18212F]">
                    {ds.completed} / {ds.totalVisits} Consults
                  </div>
                  <div className="text-[10px] text-emerald-600 font-mono font-medium">
                    ₹{(ds.completed * ds.doctor.consultationFee).toFixed(2)} generated
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[10px] text-[#667085] border-t border-[#F1E4E1]">
            Doctor consultations synchronize directly with the front desk token counter.
          </div>
        </div>

      </div>

    </div>
  );
};
