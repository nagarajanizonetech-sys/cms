import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Stethoscope, 
  CreditCard, 
  IndianRupee, 
  CheckCircle2, 
  UserPlus, 
  CalendarPlus, 
  Zap, 
  Search, 
  Wallet, 
  ArrowRight,
  ChevronRight,
  MoreVertical,
  Activity,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { AppointmentStatus, Appointment } from '../../../types/reception';
import { api, DashboardStats } from '../../../services/api';

interface ReceptionDashboardProps {
  onNavigate: (route: string) => void;
  onOpenRegisterModal: () => void;
  onOpenWalkInModal: () => void;
  onOpenAppointmentModal: () => void;
}

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
  onNavigate,
  onOpenRegisterModal,
  onOpenWalkInModal,
  onOpenAppointmentModal,
}) => {
  const { 
    patients, 
    doctors, 
    appointments, 
    queues, 
    bills, 
    checkInAppointment, 
    cancelAppointment 
  } = useReception();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<DashboardStats | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const loadDbStats = async () => {
    try {
      setIsSyncing(true);
      const res = await api.getDashboardStats();
      if (res) {
        setDbStats(res);
      }
    } catch (e) {
      console.warn('Dashboard stats fallback to local context data:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadDbStats();
  }, [appointments.length, bills.length, queues.length]);

  // Derived real-time statistics from DB with context fallback
  const pendingBills = bills.filter(b => b.status === 'Pending' || b.status === 'Partially Paid');
  const todayAppointmentsCount = dbStats ? dbStats.appointments_today : appointments.filter(a => a.status !== 'Cancelled').length;
  const waitingPatientsCount = dbStats ? dbStats.waiting_in_queue : queues.filter(q => q.status === 'Waiting').length;
  const availableDoctorsCount = dbStats ? dbStats.active_doctors : doctors.filter(d => d.status === 'Available' || d.status === 'In Consultation').length;
  const pendingAmountTotal = dbStats ? dbStats.pending_bills_amount : pendingBills.reduce((acc, b) => acc + b.balanceAmount, 0);

  // Calculate today's collection from DB with payment records fallback
  const todayPaidTotal = dbStats ? dbStats.revenue_today : bills.reduce((acc, b) => {
    const todayPayments = b.payments.reduce((pAcc, p) => pAcc + p.amount, 0);
    return acc + todayPayments;
  }, 0);

  const completedConsultationsCount = dbStats ? dbStats.completed_consultations_today : appointments.filter(a => a.status === 'Completed').length;

  const handleCheckIn = (aptId: string) => {
    const res = checkInAppointment(aptId);
    if (res.success) {
      setSuccessToast(`Patient checked in successfully! Token ${res.token} issued.`);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'Waiting':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Waiting</span>;
      case 'In Consultation':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F76762]/10 text-[#F76762] border border-[#F76762]/30 animate-pulse">In Consultation</span>;
      case 'Scheduled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Scheduled</span>;
      case 'Completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'Cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">{status}</span>;
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (statusFilter === 'All') return true;
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18212F] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-4 duration-200 border border-neutral-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 1. Summary Cards Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Card 1: Today's Appointments */}
        <div 
          onClick={() => onNavigate('/reception/appointments')}
          className="bg-white p-3.5 rounded-2xl border border-[#F1E4E1] shadow-2xs hover:border-[#F76762]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-[11px] font-semibold">Today's Total</span>
            <Users className="w-3.5 h-3.5 text-[#F76762] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#18212F] font-mono">
            {todayAppointmentsCount}
          </div>
          <div className="text-[10px] text-[#667085] mt-1 truncate">
            {appointments.filter(a => a.status === 'Scheduled').length} scheduled remaining
          </div>
        </div>

        {/* Card 2: Waiting Patients */}
        <div 
          onClick={() => onNavigate('/reception/queue')}
          className="bg-white p-3.5 rounded-2xl border border-[#F1E4E1] shadow-2xs hover:border-[#F76762]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-[11px] font-semibold">Waiting Patients</span>
            <Clock className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#18212F] font-mono">
            {waitingPatientsCount}
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-1 truncate">
            In waiting lounge
          </div>
        </div>

        {/* Card 3: Doctors Available */}
        <div 
          onClick={() => onNavigate('/reception/queue')}
          className="bg-white p-3.5 rounded-2xl border border-[#F1E4E1] shadow-2xs hover:border-[#F76762]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-[11px] font-semibold">Doctors On Duty</span>
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#18212F] font-mono">
            {availableDoctorsCount}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1 truncate">
            Active in consultation suites
          </div>
        </div>

        {/* Card 4: Pending Payments */}
        <div 
          onClick={() => onNavigate('/reception/payments')}
          className="bg-white p-3.5 rounded-2xl border border-[#F1E4E1] shadow-2xs hover:border-[#F76762]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-[11px] font-semibold">Pending Dues</span>
            <CreditCard className="w-3.5 h-3.5 text-[#F76762] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#F76762] font-mono">
            ₹{pendingAmountTotal.toFixed(0)}
          </div>
          <div className="text-[10px] text-[#667085] mt-1 truncate">
            {pendingBills.length} unpaid / partial invoices
          </div>
        </div>

        {/* Card 5: Today's Collection */}
        <div 
          onClick={() => onNavigate('/reception/reports')}
          className="bg-white p-3.5 rounded-2xl border border-[#F1E4E1] shadow-2xs hover:border-[#F76762]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-[11px] font-semibold">Today's Collected</span>
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 font-mono">
            ₹{todayPaidTotal.toFixed(0)}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1 truncate">
            Shift cash & digital intake
          </div>
        </div>

        {/* Card 6: Completed Consultations */}
        <div 
          onClick={() => onNavigate('/reception/appointments')}
          className="bg-white p-3.5 rounded-2xl border border-[#F1E4E1] shadow-2xs hover:border-[#F76762]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-[11px] font-semibold">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#18212F] font-mono">
            {completedConsultationsCount}
          </div>
          <div className="text-[10px] text-[#667085] mt-1 truncate">
            Consultations completed
          </div>
        </div>

      </section>

      {/* 2. Primary Quick Actions Banner */}
      <section className="bg-white rounded-2xl border border-[#F1E4E1] p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#F76762]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#18212F]">
              Front Desk Quick Actions
            </h2>
          </div>
          <span className="text-[11px] text-[#667085] hidden sm:block">
            Frequently performed receptionist workflows
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          
          <button
            onClick={onOpenRegisterModal}
            className="p-3 bg-[#FFF9F7] hover:bg-[#F76762]/10 border border-[#F1E4E1] hover:border-[#F76762]/40 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F76762] to-[#FB866E] text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
              <UserPlus className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-xs text-[#18212F]">Register Patient</div>
            <div className="text-[10px] text-[#667085] mt-0.5 truncate">New clinic record & UHID</div>
          </button>

          <button
            onClick={onOpenAppointmentModal}
            className="p-3 bg-[#FFF9F7] hover:bg-[#F76762]/10 border border-[#F1E4E1] hover:border-[#F76762]/40 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
              <CalendarPlus className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-xs text-[#18212F]">New Appointment</div>
            <div className="text-[10px] text-[#667085] mt-0.5 truncate">Schedule consultation slot</div>
          </button>

          <button
            onClick={onOpenWalkInModal}
            className="p-3 bg-[#FFF9F7] hover:bg-[#F76762]/10 border border-[#F1E4E1] hover:border-[#F76762]/40 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-xs text-[#18212F]">Walk-in Patient</div>
            <div className="text-[10px] text-[#667085] mt-0.5 truncate">Fast check-in & token</div>
          </button>

          <button
            onClick={() => onNavigate('/reception/patients')}
            className="p-3 bg-[#FFF9F7] hover:bg-[#F76762]/10 border border-[#F1E4E1] hover:border-[#F76762]/40 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-neutral-800 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
              <Search className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-xs text-[#18212F]">Search Patient</div>
            <div className="text-[10px] text-[#667085] mt-0.5 truncate">Find by UHID or phone</div>
          </button>

          <button
            onClick={() => onNavigate('/reception/payments')}
            className="p-3 bg-[#FFF9F7] hover:bg-[#F76762]/10 border border-[#F1E4E1] hover:border-[#F76762]/40 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-xs text-[#18212F]">Collect Payment</div>
            <div className="text-[10px] text-[#667085] mt-0.5 truncate">Settle pending patient dues</div>
          </button>

          <button
            onClick={() => onNavigate('/reception/queue')}
            className="p-3 bg-[#FFF9F7] hover:bg-[#F76762]/10 border border-[#F1E4E1] hover:border-[#F76762]/40 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-xs text-[#18212F]">View Queue</div>
            <div className="text-[10px] text-[#667085] mt-0.5 truncate">Multi-doctor wait status</div>
          </button>

        </div>
      </section>

      {/* 3. Operational Section: Doctor Availability & Queue Lanes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Doctor Availability (Col 5) */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-[#F1E4E1] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#F76762]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#18212F]">
                  Doctor Availability & Schedule
                </h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Live Status
              </span>
            </div>

            <div className="space-y-3">
              {doctors.map((doc) => (
                <div 
                  key={doc.id}
                  className="p-3.5 bg-[#FFF9F7] rounded-xl border border-[#F1E4E1] flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#18212F] flex items-center gap-1.5">
                        <span>{doc.name}</span>
                        <span className="text-[10px] text-[#667085] font-mono">({doc.room.split('·')[0]})</span>
                      </div>
                      <div className="text-[11px] text-[#667085] mt-0.5">
                        {doc.specialization}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      doc.status === 'In Consultation' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-neutral-100 text-neutral-600'
                    }`}>
                      {doc.status}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#F1E4E1] flex items-center justify-between text-[11px]">
                    <div className="text-[#667085]">
                      Shift: <strong className="text-[#18212F]">{doc.schedule.startTime} – {doc.schedule.endTime}</strong>
                    </div>
                    <div className="text-[#18212F] font-semibold">
                      Waiting: <span className="font-mono text-[#F76762] font-bold">{doc.waitingCount}</span> patients
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 text-[11px] text-[#667085] flex items-center justify-between border-t border-[#F1E4E1] mt-3">
            <span>Independent parallel queues per doctor.</span>
            <button
              onClick={() => onNavigate('/reception/queue')}
              className="text-[#F76762] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Queues</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Doctor-Specific Queue Snapshot (Col 7) */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-[#F1E4E1] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F76762]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#18212F]">
                Active Doctor Queues
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/reception/queue')}
              className="text-[11px] text-[#F76762] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full Queue Board</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {doctors.map((doc) => {
              const docQueue = queues.filter(q => q.doctorId === doc.id && q.status === 'Waiting');
              const activeInRoom = queues.find(q => q.doctorId === doc.id && q.status === 'In Consultation');

              return (
                <div key={doc.id} className="border border-[#F1E4E1] rounded-xl p-3 bg-[#FFF9F7]/60 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#F1E4E1]">
                      <span className="font-bold text-xs text-[#18212F] truncate">{doc.name}</span>
                      <span className="text-[10px] font-mono text-[#667085] bg-white px-2 py-0.5 rounded border border-[#F1E4E1]">
                        Lane {doc.code}
                      </span>
                    </div>

                    {/* Active In Consultation Token */}
                    <div className="my-2.5 bg-white p-2.5 rounded-lg border border-[#F1E4E1]">
                      <div className="text-[10px] text-[#667085] uppercase tracking-wide font-semibold">
                        Now in Room:
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-base font-extrabold font-mono text-[#F76762]">
                          {activeInRoom ? activeInRoom.token : doc.currentQueueToken || 'None'}
                        </span>
                        <span className="text-xs text-[#18212F] font-semibold truncate max-w-[120px]">
                          {activeInRoom ? activeInRoom.patientName : 'No patient called'}
                        </span>
                      </div>
                    </div>

                    {/* Upcoming in this doctor's lane */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-[#667085] font-semibold uppercase">
                        Next in Line ({docQueue.length}):
                      </div>
                      {docQueue.length === 0 ? (
                        <div className="text-[11px] text-[#667085] italic py-1">No waiting patients in this lane.</div>
                      ) : (
                        docQueue.slice(0, 3).map((q) => (
                          <div key={q.id} className="flex items-center justify-between text-xs bg-white px-2 py-1.5 rounded border border-[#F1E4E1]">
                            <span className="font-mono font-bold text-[#18212F]">{q.token}</span>
                            <span className="text-[#667085] truncate max-w-[100px]">{q.patientName}</span>
                            <span className="text-[10px] font-mono text-amber-600">Waiting</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('/reception/queue')}
                    className="mt-3 w-full py-1.5 bg-white hover:bg-neutral-50 border border-[#F1E4E1] text-[11px] font-semibold text-[#18212F] rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Manage Doctor {doc.code} Queue
                  </button>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* 4. Today's Appointments Section with Actionable States */}
      <section className="bg-white rounded-2xl border border-[#F1E4E1] p-4 sm:p-5 shadow-xs">
        
        {/* Table Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#18212F] tracking-tight">
              Today's Appointment Schedule
            </h2>
            <p className="text-[11px] text-[#667085]">
              Real-time check-in and reception workflow status
            </p>
          </div>

          {/* Status Filter Badges */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {['All', 'Scheduled', 'Waiting', 'In Consultation', 'Completed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === s
                    ? 'bg-[#18212F] text-white border-[#18212F]'
                    : 'bg-white text-[#667085] border-[#F1E4E1] hover:text-[#18212F]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#F1E4E1] text-[#667085] uppercase tracking-wider text-[10px] bg-[#FFF9F7]/70">
                <th className="py-2.5 px-3 font-semibold">Time</th>
                <th className="py-2.5 px-3 font-semibold">Token</th>
                <th className="py-2.5 px-3 font-semibold">Patient</th>
                <th className="py-2.5 px-3 font-semibold">Doctor</th>
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E4E1]">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#667085]">
                    No appointments match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-[#FFF9F7]/50 transition-colors">
                    
                    {/* Time */}
                    <td className="py-3 px-3 font-mono font-medium text-[#18212F]">
                      {apt.time}
                    </td>

                    {/* Token */}
                    <td className="py-3 px-3">
                      {apt.token ? (
                        <span className="font-mono font-bold text-[#F76762] bg-[#F76762]/10 px-2 py-0.5 rounded">
                          {apt.token}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#667085] italic">—</span>
                      )}
                    </td>

                    {/* Patient */}
                    <td className="py-3 px-3">
                      <div 
                        onClick={() => onNavigate(`/reception/patients/${apt.patientId}`)}
                        className="font-bold text-[#18212F] hover:text-[#F76762] cursor-pointer"
                      >
                        {apt.patientName}
                      </div>
                      <div className="text-[10px] font-mono text-[#667085]">
                        {apt.patientUhid} · {apt.patientPhone}
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#18212F]">{apt.doctorName}</div>
                      <div className="text-[10px] text-[#667085]">{apt.reason}</div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3 text-[#667085]">
                      <span className="px-2 py-0.5 rounded bg-white border border-[#F1E4E1] text-[10px] font-medium">
                        {apt.type}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {getStatusBadge(apt.status)}
                    </td>

                    {/* Contextual Action Button */}
                    <td className="py-3 px-3 text-right">
                      {apt.status === 'Scheduled' && (
                        <button
                          onClick={() => handleCheckIn(apt.id)}
                          className="px-3 py-1 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white font-semibold rounded-lg shadow-2xs hover:opacity-90 transition-all cursor-pointer text-xs"
                        >
                          Check-in
                        </button>
                      )}

                      {apt.status === 'Waiting' && (
                        <button
                          onClick={() => onNavigate('/reception/queue')}
                          className="px-2.5 py-1 bg-white hover:bg-neutral-50 text-[#18212F] border border-[#F1E4E1] font-medium rounded-lg text-xs cursor-pointer"
                        >
                          In Queue
                        </button>
                      )}

                      {apt.status === 'In Consultation' && (
                        <span className="text-[10px] text-amber-600 font-semibold font-mono">
                          In Room
                        </span>
                      )}

                      {apt.status === 'Completed' && (
                        <button
                          onClick={() => onNavigate('/reception/payments')}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold rounded-lg text-[11px] cursor-pointer"
                        >
                          Billing
                        </button>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </section>

    </div>
  );
};
