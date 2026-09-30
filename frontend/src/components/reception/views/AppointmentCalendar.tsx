import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Stethoscope, 
  Plus, 
  Search, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Eye,
  RefreshCw,
  CalendarDays,
  CalendarRange
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { Appointment, AppointmentStatus } from '../../../types/reception';

interface AppointmentCalendarProps {
  defaultDoctorId?: string;
  onOpenNewAppointmentModal?: (date?: string) => void;
  onSelectPatient?: (patientId: string) => void;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  defaultDoctorId,
  onOpenNewAppointmentModal,
  onSelectPatient,
}) => {
  const { 
    appointments, 
    doctors, 
    checkInAppointment, 
    cancelAppointment, 
    rescheduleAppointment 
  } = useReception();

  // Current viewed date cursor
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(defaultDoctorId || 'All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarSubMode, setCalendarSubMode] = useState<'month' | 'week'>('month');

  // Selected appointment for detail popover/modal
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newRescheduleDate, setNewRescheduleDate] = useState('');
  const [newRescheduleTime, setNewRescheduleTime] = useState('10:00 AM');

  // Cancel state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('Patient requested cancellation');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper date strings
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (selectedDoctorId !== 'All' && apt.doctorId !== selectedDoctorId) return false;
      if (statusFilter !== 'All' && apt.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          apt.patientName.toLowerCase().includes(q) ||
          apt.patientUhid.toLowerCase().includes(q) ||
          (apt.token && apt.token.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [appointments, selectedDoctorId, statusFilter, searchQuery]);

  // Appointments grouped by date (YYYY-MM-DD)
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const apt of filteredAppointments) {
      if (!map[apt.date]) {
        map[apt.date] = [];
      }
      map[apt.date].push(apt);
    }
    // Sort by time within each day
    for (const d in map) {
      map[d].sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [filteredAppointments]);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevPeriod = () => {
    if (calendarSubMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const prev = new Date(currentDate);
      prev.setDate(prev.getDate() - 7);
      setCurrentDate(prev);
    }
  };

  const nextPeriod = () => {
    if (calendarSubMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
      setCurrentDate(next);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Month grid generation
  const monthGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({ dateStr, dayNum, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Next month padding to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    const totalCells = days.length + remaining < 35 ? 35 : (days.length + remaining <= 42 ? days.length + remaining : 42);
    const needNext = totalCells - days.length;
    for (let n = 1; n <= needNext; n++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: n, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // Week days generation (Sun - Sat)
  const weekDays = useMemo(() => {
    const current = new Date(currentDate);
    const dayOfWeek = current.getDay(); // 0=Sun
    const startOfWeek = new Date(current);
    startOfWeek.setDate(current.getDate() - dayOfWeek);

    const days: { dateStr: string; dateObj: Date; dayName: string; dayNum: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        dateStr,
        dateObj: d,
        dayName: d.toLocaleDateString('default', { weekday: 'short' }),
        dayNum: d.getDate(),
      });
    }
    return days;
  }, [currentDate]);

  // Status badge styling helper
  const getStatusBadgeStyle = (status: AppointmentStatus | string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100';
      case 'Checked-in':
      case 'Waiting':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'In Consultation':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'Cancelled':
      case 'No-show':
        return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Actions
  const handleCheckIn = (apt: Appointment) => {
    const res = checkInAppointment(apt.id);
    if (res.success) {
      showToast(`Patient checked in! Token ${res.token} issued.`);
      setActiveAppointment({ ...apt, status: 'Waiting', token: res.token });
    }
  };

  const handleConfirmReschedule = () => {
    if (!activeAppointment || !newRescheduleDate) return;
    rescheduleAppointment(activeAppointment.id, newRescheduleDate, newRescheduleTime);
    setIsRescheduling(false);
    setActiveAppointment(null);
    showToast('Appointment rescheduled successfully.');
  };

  const handleConfirmCancel = () => {
    if (!activeAppointment) return;
    cancelAppointment(activeAppointment.id, cancelReason);
    setIsCancelling(false);
    setActiveAppointment(null);
    showToast('Appointment cancelled.');
  };

  return (
    <div className="space-y-4 text-xs">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18212F] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs border border-neutral-700 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Calendar Toolbar */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Navigation and Date Heading */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl p-1 shadow-xs">
            <button
              onClick={prevPeriod}
              className="p-1.5 hover:bg-white text-[#18212F] rounded-lg transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold text-[#18212F] hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={nextPeriod}
              className="p-1.5 hover:bg-white text-[#18212F] rounded-lg transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#18212F] tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#F76762]" />
              <span>
                {calendarSubMode === 'month' ? `${monthName} ${year}` : `Week of ${weekDays[0].dayName}, ${weekDays[0].dateStr}`}
              </span>
            </h2>
            <span className="text-[11px] text-[#667085]">
              {filteredAppointments.length} appointments scheduled
            </span>
          </div>
        </div>

        {/* Right: Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Sub-view toggle: Month vs Week */}
          <div className="flex items-center bg-[#FFF9F7] p-1 border border-[#F1E4E1] rounded-xl">
            <button
              onClick={() => setCalendarSubMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                calendarSubMode === 'month'
                  ? 'bg-[#18212F] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#18212F]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setCalendarSubMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                calendarSubMode === 'week'
                  ? 'bg-[#18212F] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#18212F]'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#667085]" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-3 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762] w-36 sm:w-44"
            />
          </div>

          {/* Doctor Selector */}
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="px-2.5 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs font-medium text-[#18212F] focus:outline-none"
          >
            <option value="All">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs font-medium text-[#18212F] focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Waiting">Waiting</option>
            <option value="In Consultation">In Consultation</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Book Action */}
          {onOpenNewAppointmentModal && (
            <button
              onClick={() => onOpenNewAppointmentModal(todayStr)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-xs hover:opacity-95 transition-all cursor-pointer text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book</span>
            </button>
          )}
        </div>

      </div>

      {/* ─── MONTH VIEW ──────────────────────────────────────────────────────── */}
      {calendarSubMode === 'month' && (
        <div className="bg-white rounded-2xl border border-[#F1E4E1] shadow-xs overflow-hidden">
          
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-[#F1E4E1] bg-[#FFF9F7]/80 text-center font-bold text-[#667085] text-[11px] py-2.5 uppercase tracking-wider">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#F1E4E1]">
            {monthGridDays.map((cell, idx) => {
              const dayApts = appointmentsByDate[cell.dateStr] || [];
              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  className={`min-h-[110px] sm:min-h-[125px] p-1.5 sm:p-2 transition-colors flex flex-col justify-between group relative ${
                    cell.isCurrentMonth ? 'bg-white hover:bg-[#FFF9F7]/40' : 'bg-[#FAF6F4]/50 opacity-60'
                  }`}
                >
                  {/* Cell Header: Day Number & Quick Add Button */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                        isToday
                          ? 'bg-[#F76762] text-white font-bold shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-[#18212F]'
                          : 'text-[#98A2B3]'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Hover "+" button to book on this exact date */}
                    {onOpenNewAppointmentModal && (
                      <button
                        onClick={() => onOpenNewAppointmentModal(cell.dateStr)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-[#FFF9F7] border border-[#F1E4E1] text-[#F76762] hover:bg-[#F76762] hover:text-white transition-all cursor-pointer"
                        title={`Book appointment for ${cell.dateStr}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Appointments List within Day Cell */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px] flex-1">
                    {dayApts.slice(0, 3).map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => setActiveAppointment(apt)}
                        className={`w-full text-left px-1.5 py-0.5 rounded border text-[10px] font-medium truncate flex items-center gap-1 cursor-pointer transition-all ${getStatusBadgeStyle(
                          apt.status
                        )}`}
                        title={`${apt.time} - ${apt.patientName} (${apt.doctorName})`}
                      >
                        <span className="font-mono text-[9px] shrink-0 opacity-80">{apt.time.split(' ')[0]}</span>
                        <span className="truncate">{apt.patientName}</span>
                      </button>
                    ))}

                    {/* "+X more" chip */}
                    {dayApts.length > 3 && (
                      <div className="text-[10px] font-semibold text-[#F76762] px-1 py-0.5 text-center bg-[#F76762]/10 rounded">
                        +{dayApts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ─── WEEK VIEW ───────────────────────────────────────────────────────── */}
      {calendarSubMode === 'week' && (
        <div className="bg-white rounded-2xl border border-[#F1E4E1] shadow-xs overflow-hidden">
          
          {/* Week Day Header Columns */}
          <div className="grid grid-cols-7 border-b border-[#F1E4E1] bg-[#FFF9F7] text-center divide-x divide-[#F1E4E1]">
            {weekDays.map((w) => {
              const isToday = w.dateStr === todayStr;
              const count = (appointmentsByDate[w.dateStr] || []).length;

              return (
                <div key={w.dateStr} className={`p-3 ${isToday ? 'bg-[#F76762]/5' : ''}`}>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">{w.dayName}</div>
                  <div className="mt-1 flex items-center justify-center gap-1.5">
                    <span
                      className={`text-sm font-extrabold w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-[#F76762] text-white shadow-xs' : 'text-[#18212F]'
                      }`}
                    >
                      {w.dayNum}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#667085] mt-1 font-mono">{count} appts</div>
                </div>
              );
            })}
          </div>

          {/* Week Day Columns Content */}
          <div className="grid grid-cols-7 divide-x divide-[#F1E4E1] min-h-[380px]">
            {weekDays.map((w) => {
              const dayApts = appointmentsByDate[w.dateStr] || [];

              return (
                <div key={w.dateStr} className="p-2 space-y-2 bg-white flex flex-col justify-between">
                  <div className="space-y-1.5 overflow-y-auto max-h-[360px]">
                    {dayApts.length === 0 ? (
                      <div className="text-center py-6 text-[11px] text-[#98A2B3] italic">
                        No appointments
                      </div>
                    ) : (
                      dayApts.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => setActiveAppointment(apt)}
                          className={`p-2 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-xs ${getStatusBadgeStyle(
                            apt.status
                          )}`}
                        >
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="font-bold">{apt.time}</span>
                            {apt.token && (
                              <span className="bg-white/70 px-1 rounded text-[9px] font-bold border border-current">
                                {apt.token}
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-[#18212F] truncate mt-1">{apt.patientName}</div>
                          <div className="text-[10px] opacity-75 truncate">{apt.doctorName}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {onOpenNewAppointmentModal && (
                    <button
                      onClick={() => onOpenNewAppointmentModal(w.dateStr)}
                      className="w-full py-1.5 border border-dashed border-[#F1E4E1] hover:border-[#F76762] hover:text-[#F76762] rounded-lg text-[10px] font-semibold text-[#667085] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ─── APPOINTMENT DETAILS DIALOG ─────────────────────────────────────── */}
      {activeAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18212F]/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#F1E4E1] shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="p-4 border-b border-[#F1E4E1] flex items-center justify-between bg-[#FFF9F7]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F76762]/10 text-[#F76762] flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#18212F]">Appointment Details</div>
                  <div className="text-[11px] text-[#667085]">
                    {activeAppointment.date} at {activeAppointment.time}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveAppointment(null);
                  setIsRescheduling(false);
                  setIsCancelling(false);
                }}
                className="p-1.5 text-[#667085] hover:text-[#18212F] rounded-lg hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              
              {/* Status & Token Bar */}
              <div className="flex items-center justify-between bg-[#FFF9F7] p-3 rounded-xl border border-[#F1E4E1]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#667085] block">Current Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${getStatusBadgeStyle(activeAppointment.status)}`}>
                    {activeAppointment.status.toUpperCase()}
                  </span>
                </div>
                {activeAppointment.token && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-[#667085] block">Token Number</span>
                    <span className="text-sm font-mono font-bold text-[#F76762]">{activeAppointment.token}</span>
                  </div>
                )}
              </div>

              {/* Patient Info Card */}
              <div className="p-3 bg-white border border-[#F1E4E1] rounded-xl space-y-1.5">
                <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Patient</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#18212F] text-sm">{activeAppointment.patientName}</div>
                    <div className="font-mono text-[11px] text-[#667085]">{activeAppointment.patientUhid} • {activeAppointment.patientPhone}</div>
                  </div>
                  {onSelectPatient && (
                    <button
                      onClick={() => {
                        onSelectPatient(activeAppointment.patientId);
                        setActiveAppointment(null);
                      }}
                      className="p-1.5 text-[#667085] hover:text-[#18212F] border border-[#F1E4E1] hover:border-[#18212F] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Doctor & Consultation Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-white border border-[#F1E4E1] rounded-xl">
                  <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Doctor</div>
                  <div className="font-bold text-[#18212F] mt-0.5">{activeAppointment.doctorName}</div>
                </div>
                <div className="p-3 bg-white border border-[#F1E4E1] rounded-xl">
                  <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Visit Type</div>
                  <div className="font-bold text-[#18212F] mt-0.5">{activeAppointment.type}</div>
                </div>
              </div>

              {/* Reason */}
              {activeAppointment.reason && (
                <div className="p-3 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl">
                  <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Chief Complaint / Reason</div>
                  <p className="text-xs text-[#18212F] mt-0.5">{activeAppointment.reason}</p>
                </div>
              )}

              {/* Reschedule View */}
              {isRescheduling && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="font-bold text-amber-900 text-xs">Select New Appointment Schedule</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-amber-900 block mb-1">New Date</label>
                      <input
                        type="date"
                        value={newRescheduleDate}
                        onChange={(e) => setNewRescheduleDate(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-amber-900 block mb-1">New Time</label>
                      <input
                        type="text"
                        value={newRescheduleTime}
                        onChange={(e) => setNewRescheduleTime(e.target.value)}
                        placeholder="11:00 AM"
                        className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmReschedule}
                      disabled={!newRescheduleDate}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs cursor-pointer"
                    >
                      Confirm Reschedule
                    </button>
                    <button
                      onClick={() => setIsRescheduling(false)}
                      className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Cancel View */}
              {isCancelling && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="font-bold text-red-900 text-xs">Cancellation Reason</div>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-red-300 rounded-lg text-xs focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmCancel}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs cursor-pointer"
                    >
                      Confirm Cancel
                    </button>
                    <button
                      onClick={() => setIsCancelling(false)}
                      className="px-3 py-1.5 bg-white border border-red-300 text-red-900 rounded-lg text-xs cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!isRescheduling && !isCancelling && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1E4E1]">
                  {activeAppointment.status === 'Scheduled' && (
                    <button
                      onClick={() => handleCheckIn(activeAppointment)}
                      className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs hover:opacity-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Check-In Patient</span>
                    </button>
                  )}

                  {activeAppointment.status !== 'Completed' && activeAppointment.status !== 'Cancelled' && (
                    <>
                      <button
                        onClick={() => {
                          setNewRescheduleDate(activeAppointment.date);
                          setNewRescheduleTime(activeAppointment.time);
                          setIsRescheduling(true);
                        }}
                        className="px-3 py-2 bg-white border border-[#F1E4E1] hover:border-[#18212F] text-[#18212F] font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reschedule</span>
                      </button>

                      <button
                        onClick={() => setIsCancelling(true)}
                        className="px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-xl text-xs cursor-pointer ml-auto"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
