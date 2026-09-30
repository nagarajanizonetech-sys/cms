import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Repeat, 
  CreditCard, 
  TrendingUp, 
  Stethoscope,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { api } from '../../../services/api';

interface DoctorReportsViewProps {
  onNavigate: (route: string) => void;
}

export const DoctorReportsView: React.FC<DoctorReportsViewProps> = () => {
  const { consultations, appointments, followUps, bills, currentDoctorId, doctors } = useReception();
  const currentDoctor = doctors.find((d) => d.id === currentDoctorId || d.id === `doc-${currentDoctorId}`) || doctors[0] || {
    id: '1',
    name: 'Dr. Sarah Khan',
    code: 'DOC-1',
    room: 'Room 101',
    schedule: { days: ['Monday', 'Tuesday'], startTime: '09:00 AM', endTime: '05:00 PM', slotDurationMins: 20 },
    consultationFee: 50,
  };
  const cleanDocId = (currentDoctor?.id || '1').replace('doc-', '');
  const [docReport, setDocReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadDoctorReport = async () => {
    if (!currentDoctor?.id) return;
    setIsLoading(true);
    try {
      const res = await api.getDoctorReport(cleanDocId);
      if (res) {
        setDocReport(res);
      }
    } catch (err) {
      console.warn('Failed to load DB doctor report, using local context:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorReport();
  }, [cleanDocId]);

  // Doctor-isolated local fallbacks
  const myAppointments = appointments.filter((a) => a.doctorId === currentDoctor?.id || a.doctorId === cleanDocId);
  const myConsultations = consultations.filter((c) => c.doctorId === currentDoctor?.id || c.doctorId === cleanDocId);
  const myFollowUps = followUps.filter((f) => f.doctorId === currentDoctor?.id || f.doctorId === cleanDocId);

  // Derived metrics from DB report, falling back to local context
  const totalConsultations = docReport ? docReport.total_consultations : myConsultations.length;
  const completedCount = docReport ? docReport.completed_appointments : myAppointments.filter((a) => a.status === 'Completed').length;
  const totalAppointmentsCount = docReport ? docReport.total_appointments : myAppointments.length;
  const completionRate = docReport ? docReport.completion_rate : (totalAppointmentsCount > 0 ? Math.round((completedCount / totalAppointmentsCount) * 100) : 100);
  const scheduledFollowUpsCount = docReport ? docReport.scheduled_follow_ups : myFollowUps.length;
  const totalCollectedByDoctor = docReport ? docReport.total_collected : (() => {
    const myBills = bills.filter((b) => 
      b.payments.some((p) => p.collectedBy === 'Doctor' && p.collectorName?.includes(currentDoctor?.name || ''))
    );
    return myBills.reduce((acc, b) => {
      const docPayments = b.payments.filter((p) => p.collectedBy === 'Doctor');
      return acc + docPayments.reduce((pSum, pay) => pSum + pay.amount, 0);
    }, 0);
  })();

  const caseDistribution = docReport?.case_distribution || [
    { label: 'Follow-up & Review', count: myAppointments.filter((a) => a.type === 'Follow-up' || a.type === 'Review').length, color: 'bg-emerald-500' },
    { label: 'New Clinical Consultations', count: myAppointments.filter((a) => a.type === 'New Consultation').length, color: 'bg-[#F76762]' },
    { label: 'Walk-in Acute Intake', count: myAppointments.filter((a) => a.type === 'Walk-in').length, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#18212F] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#F76762]" />
            <span>Clinical Throughput & Physician Report — {currentDoctor.name}</span>
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Real-time analytics directly from PostgreSQL: care continuity, throughput, and collections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDoctorReport}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF9F7] text-[#18212F] border border-[#F1E4E1] hover:border-[#F76762]/40 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#F76762] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync DB'}</span>
          </button>
          <div className="text-xs font-semibold px-3 py-1.5 bg-[#FFF9F7] text-[#18212F] border border-[#F1E4E1] rounded-xl self-start sm:self-auto">
            Physician Code: <span className="text-[#F76762] font-bold">{currentDoctor.code}</span> · {currentDoctor.room}
          </div>
        </div>
      </div>

      {/* Primary Clinical KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-xs font-semibold">Total Consultations</span>
            <Stethoscope className="w-4 h-4 text-[#F76762]" />
          </div>
          <div className="text-2xl font-bold text-[#18212F]">
            {totalConsultations}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Clinical visits documented in DB
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-xs font-semibold">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#18212F]">
            {completionRate}%
          </div>
          <div className="text-[11px] text-[#667085]">
            {completedCount} of {totalAppointmentsCount} appointments seen
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-xs font-semibold">Scheduled Follow-ups</span>
            <Repeat className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-[#18212F]">
            {scheduledFollowUpsCount}
          </div>
          <div className="text-[11px] text-blue-600 font-medium">
            Active patient continuity plans
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-xs font-semibold">In-Room Collections</span>
            <CreditCard className="w-4 h-4 text-[#F76762]" />
          </div>
          <div className="text-2xl font-bold text-[#18212F] font-mono">
            ₹{totalCollectedByDoctor.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#667085]">
            Directly receipted by physician
          </div>
        </div>

      </div>

      {/* Detailed Clinical Summary Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Consultations by Type */}
        <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#18212F] uppercase tracking-wider">
            Patient Case Distribution
          </h3>
          <div className="space-y-3">
            {caseDistribution.map((cat: any) => {
              const pct = totalAppointmentsCount > 0 ? Math.round((cat.count / totalAppointmentsCount) * 100) : 0;
              return (
                <div key={cat.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-[#18212F]">{cat.label}</span>
                    <span className="font-bold">{cat.count} cases ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Practice Overview */}
        <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#18212F] uppercase tracking-wider">
            Workstation Schedule & Session Metrics
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-[#FFF9F7] border border-[#F1E4E1] flex justify-between">
              <span className="text-[#667085]">Assigned Consultation Room:</span>
              <span className="font-bold text-[#18212F]">{currentDoctor.room || 'Room 101'}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FFF9F7] border border-[#F1E4E1] flex justify-between">
              <span className="text-[#667085]">Daily Clinic Shift Hours:</span>
              <span className="font-bold text-[#18212F]">{currentDoctor.schedule?.startTime || '09:00 AM'} – {currentDoctor.schedule?.endTime || '05:00 PM'}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FFF9F7] border border-[#F1E4E1] flex justify-between">
              <span className="text-[#667085]">Average Consultation Duration:</span>
              <span className="font-bold text-[#18212F]">{currentDoctor.schedule?.slotDurationMins ?? 20} Minutes / Patient</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FFF9F7] border border-[#F1E4E1] flex justify-between">
              <span className="text-[#667085]">Standard Consultation Fee:</span>
              <span className="font-bold text-[#18212F] font-mono">₹{(currentDoctor.consultationFee ?? 50).toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
