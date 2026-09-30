import React, { useState } from 'react';
import { X, Calendar, Clock, Stethoscope, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { AppointmentType } from '../../../types/reception';

interface NewAppointmentModalProps {
  onClose: () => void;
  preselectedPatientId?: string;
  preselectedDate?: string;
  onSuccess?: () => void;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  onClose,
  preselectedPatientId,
  preselectedDate,
  onSuccess,
}) => {
  const { patients, doctors, bookAppointment } = useReception();

  const [patientId, setPatientId] = useState<string>(preselectedPatientId || patients[0]?.id || '');
  const [doctorId, setDoctorId] = useState<string>(doctors[0]?.id || '');
  const [date, setDate] = useState<string>(() => {
    if (preselectedDate) return preselectedDate;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [time, setTime] = useState<string>('10:00 AM');
  const [type, setType] = useState<AppointmentType>('New Consultation');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  // Time slots generator (within doctor schedule e.g. 09:00 AM - 01:00 PM)
  const timeSlots = [
    '09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM',
    '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
    '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
    '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
    '02:00 PM', '02:20 PM', '02:40 PM', '03:00 PM', '03:20 PM', '03:40 PM'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!patientId) {
      setError('Please select a patient.');
      return;
    }

    if (!doctorId) {
      setError('Please select a doctor.');
      return;
    }

    if (!date) {
      setError('Please select an appointment date.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a brief reason or chief complaint for the visit.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await bookAppointment({
        patientId,
        doctorId,
        date,
        time,
        type,
        reason: reason.trim(),
      });

      setIsSubmitting(false);

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to book appointment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18212F]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#F1E4E1] shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-[#F1E4E1] flex items-center justify-between bg-[#FFF9F7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F76762]/10 text-[#F76762] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#18212F]">Book Clinical Appointment</div>
              <div className="text-[11px] text-[#667085]">Scheduled consultation with doctor availability validation</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#667085] hover:text-[#18212F] rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Patient Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#18212F] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#667085]" />
              <span>Select Patient</span>
            </label>
            <select
              required
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.uhid}) · {p.mobile}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#18212F] flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-[#667085]" />
              <span>Consulting Doctor</span>
            </label>
            <select
              required
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialization} ({d.schedule.startTime} - {d.schedule.endTime})
                </option>
              ))}
            </select>
            {selectedDoctor && (
              <div className="text-[10px] text-[#667085] bg-[#FFF9F7] p-2 rounded-lg border border-[#F1E4E1]">
                Schedule: <strong>{selectedDoctor.schedule.days.join(', ')}</strong> ({selectedDoctor.schedule.startTime} – {selectedDoctor.schedule.endTime})
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-[#18212F]">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-[#18212F]">Time Slot</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
              >
                {timeSlots.map((ts) => (
                  <option key={ts} value={ts}>{ts}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Appointment Type */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#18212F]">Appointment Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['New Consultation', 'Follow-up', 'Review'] as AppointmentType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer text-center ${
                    type === t
                      ? 'bg-[#18212F] text-white border-[#18212F]'
                      : 'bg-white text-[#667085] border-[#F1E4E1] hover:text-[#18212F]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Reason / Symptoms */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#18212F]">Chief Complaint / Visit Reason *</label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Hypertension medication review, chronic knee pain"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-[#F1E4E1]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-[#F1E4E1] text-[#667085] hover:text-[#18212F] font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white font-semibold rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>{isSubmitting ? 'Booking...' : 'Confirm Appointment'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
