import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CalendarPlus, 
  Clock, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Eye, 
  Stethoscope, 
  User,
  AlertCircle,
  CalendarDays,
  List
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { AppointmentStatus } from '../../../types/reception';
import { AppointmentCalendar } from './AppointmentCalendar';

interface AppointmentsViewProps {
  initialView?: 'list' | 'calendar';
  onOpenNewAppointmentModal: (date?: string) => void;
  onSelectPatient: (patientId: string) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  initialView = 'list',
  onOpenNewAppointmentModal,
  onSelectPatient,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(initialView);

  useEffect(() => {
    if (initialView) {
      setViewMode(initialView);
    }
  }, [initialView]);
  const { 
    appointments, 
    doctors, 
    checkInAppointment, 
    cancelAppointment, 
    rescheduleAppointment 
  } = useReception();

  const [dateFilter, setDateFilter] = useState<'today' | 'upcoming' | 'all'>('today');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reschedule mini-modal state
  const [reschedulingAptId, setReschedulingAptId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('11:00 AM');

  // Cancel reason prompt state
  const [cancellingAptId, setCancellingAptId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Patient requested cancellation');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter((apt) => {
    // Date filter
    if (dateFilter === 'today' && apt.date !== todayStr) return false;
    if (dateFilter === 'upcoming' && apt.date <= todayStr) return false;

    // Doctor filter
    if (selectedDoctorId !== 'All' && apt.doctorId !== selectedDoctorId) return false;

    // Status filter
    if (statusFilter !== 'All' && apt.status !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        apt.patientName.toLowerCase().includes(q) ||
        apt.patientUhid.toLowerCase().includes(q) ||
        apt.patientPhone.includes(q) ||
        (apt.token && apt.token.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const handleCheckIn = (id: string) => {
    const res = checkInAppointment(id);
    if (res.success) {
      setToastMessage(`Patient checked in! Token ${res.token} issued.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (reschedulingAptId && newDate) {
      rescheduleAppointment(reschedulingAptId, newDate, newTime);
      setReschedulingAptId(null);
      setToastMessage('Appointment successfully rescheduled.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleConfirmCancel = () => {
    if (cancellingAptId) {
      cancelAppointment(cancellingAptId, cancelReason);
      setCancellingAptId(null);
      setToastMessage('Appointment cancelled.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-5 text-xs">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18212F] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs border border-neutral-700 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#18212F] tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#F76762]" />
            <span>Clinical Appointments Management</span>
          </h2>
          <p className="text-[11px] text-[#667085] mt-0.5">
            Manage consultations, walk-in tokens, front-desk check-ins, and schedule changes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle: List vs Calendar */}
          <div className="flex items-center bg-[#FFF9F7] p-1 border border-[#F1E4E1] rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#18212F] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#18212F]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-[#18212F] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#18212F]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar View</span>
            </button>
          </div>

          <button
            onClick={() => onOpenNewAppointmentModal()}
            className="px-4 py-2.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-xs hover:opacity-90 transition-all cursor-pointer text-xs"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Book New Appointment</span>
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <AppointmentCalendar
          onOpenNewAppointmentModal={onOpenNewAppointmentModal}
          onSelectPatient={onSelectPatient}
        />
      ) : (
        <>
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-[#F1E4E1] p-3.5 shadow-xs space-y-3">
        
        {/* Date Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1E4E1] pb-3">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'today', label: "Today's Schedule" },
              { id: 'upcoming', label: 'Upcoming Consultations' },
              { id: 'all', label: 'All Records' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                  dateFilter === tab.id
                    ? 'bg-[#18212F] text-white border-[#18212F]'
                    : 'bg-white text-[#667085] border-[#F1E4E1] hover:text-[#18212F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-[#667085] font-mono">
            Showing {filteredAppointments.length} matching appointments
          </div>
        </div>

        {/* Secondary Filters: Doctor & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#667085]" />
            <input
              type="text"
              placeholder="Search by patient, UHID, or token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Doctor Filter */}
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="px-2.5 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs font-medium text-[#18212F] focus:outline-none"
            >
              <option value="All">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>

            {/* Status Filter */}
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
          </div>
        </div>

      </div>

      {/* Table List */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F1E4E1] bg-[#FFF9F7]/70 text-[#667085] uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3.5 font-semibold">Date & Time</th>
                <th className="py-3 px-3.5 font-semibold">Token</th>
                <th className="py-3 px-3.5 font-semibold">Patient Information</th>
                <th className="py-3 px-3.5 font-semibold">Doctor Assigned</th>
                <th className="py-3 px-3.5 font-semibold">Reason for Visit</th>
                <th className="py-3 px-3.5 font-semibold">Status</th>
                <th className="py-3 px-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E4E1]">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#667085]">
                    No appointments found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-[#FFF9F7]/50 transition-colors">
                    
                    {/* Date & Time */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-[#18212F]">{apt.time}</div>
                      <div className="text-[10px] font-mono text-[#667085]">{apt.date}</div>
                    </td>

                    {/* Token */}
                    <td className="py-3 px-3.5">
                      {apt.token ? (
                        <span className="font-mono font-bold text-[#F76762] bg-[#F76762]/10 px-2 py-0.5 rounded">
                          {apt.token}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#667085] italic">—</span>
                      )}
                    </td>

                    {/* Patient */}
                    <td className="py-3 px-3.5">
                      <div 
                        onClick={() => onSelectPatient(apt.patientId)}
                        className="font-bold text-[#18212F] hover:text-[#F76762] cursor-pointer"
                      >
                        {apt.patientName}
                      </div>
                      <div className="text-[10px] font-mono text-[#667085]">
                        {apt.patientUhid} · {apt.patientPhone}
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-[#18212F]">{apt.doctorName}</div>
                      <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] text-[#667085]">
                        {apt.type}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-3.5 text-[#667085] max-w-xs truncate">
                      {apt.reason}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        apt.status === 'Waiting' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        apt.status === 'In Consultation' ? 'bg-[#F76762]/10 text-[#F76762] border border-[#F76762]/20 animate-pulse' :
                        apt.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {apt.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {apt.status === 'Scheduled' && (
                          <button
                            onClick={() => handleCheckIn(apt.id)}
                            className="px-2.5 py-1 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white rounded-lg font-bold text-xs shadow-2xs hover:opacity-90 cursor-pointer"
                          >
                            Check-in
                          </button>
                        )}

                        {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              setReschedulingAptId(apt.id);
                              setNewDate(apt.date);
                              setNewTime(apt.time);
                            }}
                            className="p-1.5 hover:bg-[#FFF9F7] text-[#667085] hover:text-[#18212F] rounded-lg border border-[#F1E4E1] cursor-pointer"
                            title="Reschedule appointment"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        )}

                        {apt.status === 'Scheduled' && (
                          <button
                            onClick={() => setCancellingAptId(apt.id)}
                            className="p-1.5 hover:bg-red-50 text-[#667085] hover:text-red-600 rounded-lg border border-[#F1E4E1] cursor-pointer"
                            title="Cancel appointment"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          onClick={() => onSelectPatient(apt.patientId)}
                          className="p-1.5 hover:bg-[#FFF9F7] text-[#667085] hover:text-[#18212F] rounded-lg border border-[#F1E4E1] cursor-pointer"
                          title="View patient history"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule Modal */}
      {reschedulingAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18212F]/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-[#18212F]">Reschedule Appointment</h3>
            <form onSubmit={handleConfirmReschedule} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#18212F]">New Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#18212F]">New Time</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs"
                >
                  {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingAptId(null)}
                  className="flex-1 py-2 bg-white border border-[#F1E4E1] text-[#667085] rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#18212F] text-white rounded-xl font-semibold cursor-pointer"
                >
                  Save Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancellingAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18212F]/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>Confirm Appointment Cancellation</span>
            </h3>
            <p className="text-[#667085] text-xs">
              Are you sure you want to cancel this scheduled appointment?
            </p>
            <div className="space-y-1">
              <label className="font-semibold text-[#18212F]">Cancellation Reason</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingAptId(null)}
                className="flex-1 py-2 bg-white border border-[#F1E4E1] text-[#667085] rounded-xl font-semibold cursor-pointer"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl font-semibold cursor-pointer"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

        </>
      )}

    </div>
  );
};
