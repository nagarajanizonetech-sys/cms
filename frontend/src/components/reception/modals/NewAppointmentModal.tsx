import React, { useState } from 'react';
import { X, Calendar, Clock, Stethoscope, AlertCircle, User } from 'lucide-react';
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
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  // Time slots generator (within doctor schedule e.g. 09:00 AM - 05:00 PM)
  const timeSlots = [
    '09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM',
    '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
    '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
    '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
    '02:00 PM', '02:20 PM', '02:40 PM', '03:00 PM', '03:20 PM', '03:40 PM',
    '04:00 PM', '04:20 PM', '04:40 PM', '05:00 PM'
  ];

  // Helper to parse "09:00 AM" into minutes of day
  const parseTimeToMins = (t: string): number => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const newErrors: { [key: string]: string } = {};

    if (!patientId) {
      newErrors.patientId = 'Patient is required.';
    }

    if (!doctorId) {
      newErrors.doctorId = 'Doctor is required.';
    }

    if (!date) {
      newErrors.date = 'Appointment date is required.';
    } else if (selectedDoctor?.schedule?.days && selectedDoctor.schedule.days.length > 0) {
      // Validate doctor working day
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        const selectedDateObj = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
        const dayName = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
        if (!selectedDoctor.schedule.days.includes(dayName)) {
          newErrors.date = `${selectedDoctor.name} does not consult on ${dayName}s. Scheduled days: ${selectedDoctor.schedule.days.join(', ')}.`;
        }
      }
    }

    if (!time) {
      newErrors.time = 'Appointment time is required.';
    } else if (selectedDoctor?.schedule?.startTime && selectedDoctor?.schedule?.endTime) {
      // Validate appointment time within doctor working hours
      const apptMins = parseTimeToMins(time);
      const startMins = parseTimeToMins(selectedDoctor.schedule.startTime);
      const endMins = parseTimeToMins(selectedDoctor.schedule.endTime);
      if (apptMins < startMins || apptMins > endMins) {
        newErrors.time = `Appointment time must be within doctor's schedule (${selectedDoctor.schedule.startTime} – ${selectedDoctor.schedule.endTime}).`;
      }
    }

    if (!reason.trim()) {
      newErrors.reason = 'Chief complaint or visit reason is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError(Object.values(newErrors)[0]);
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
        <div className="p-4 sm:p-5 border-b border-[#F1E4E1] flex items-center justify-between bg-[#FFF9F7]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F76762]/10 text-[#F76762] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-[#18212F]">Book Clinical Appointment</div>
              <div className="text-xs text-[#667085]">Scheduled consultation with doctor availability validation</div>
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm custom-scrollbar">
          
          {/* Patient Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-sm text-[#18212F] flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#667085]" />
              <span>Select Patient *</span>
            </label>
            <select
              required
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value);
                setFieldErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.patientId;
                  return copy;
                });
              }}
              className={`w-full px-3 py-2.5 bg-[#FFF9F7] border rounded-xl text-sm text-[#18212F] focus:outline-none transition-colors ${
                fieldErrors.patientId ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
              }`}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.uhid}) · {p.mobile}
                </option>
              ))}
            </select>
            {fieldErrors.patientId && (
              <p className="text-xs text-red-600 font-medium">{fieldErrors.patientId}</p>
            )}
          </div>

          {/* Doctor Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-sm text-[#18212F] flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-[#667085]" />
              <span>Consulting Doctor *</span>
            </label>
            <select
              required
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                setFieldErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.doctorId;
                  return copy;
                });
              }}
              className={`w-full px-3 py-2.5 bg-[#FFF9F7] border rounded-xl text-sm text-[#18212F] focus:outline-none transition-colors ${
                fieldErrors.doctorId ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
              }`}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialization} ({d.schedule.startTime} - {d.schedule.endTime})
                </option>
              ))}
            </select>
            {selectedDoctor && (
              <div className="text-xs text-[#667085] bg-[#FFF9F7] p-2.5 rounded-lg border border-[#F1E4E1]">
                Schedule: <strong>{selectedDoctor.schedule.days.join(', ')}</strong> ({selectedDoctor.schedule.startTime} – {selectedDoctor.schedule.endTime})
              </div>
            )}
            {fieldErrors.doctorId && (
              <p className="text-xs text-red-600 font-medium">{fieldErrors.doctorId}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-[#18212F]">Appointment Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setFieldErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.date;
                    return copy;
                  });
                }}
                className={`w-full px-3 py-2 bg-[#FFF9F7] border rounded-xl text-sm text-[#18212F] focus:outline-none transition-colors ${
                  fieldErrors.date ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
                }`}
              />
              {fieldErrors.date && (
                <p className="text-xs text-red-600 font-medium">{fieldErrors.date}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-[#18212F]">Time Slot *</label>
              <select
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setFieldErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.time;
                    return copy;
                  });
                }}
                className={`w-full px-3 py-2 bg-[#FFF9F7] border rounded-xl text-sm text-[#18212F] focus:outline-none transition-colors ${
                  fieldErrors.time ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
                }`}
              >
                {timeSlots.map((ts) => (
                  <option key={ts} value={ts}>{ts}</option>
                ))}
              </select>
              {fieldErrors.time && (
                <p className="text-xs text-red-600 font-medium">{fieldErrors.time}</p>
              )}
            </div>
          </div>

          {/* Appointment Type */}
          <div className="space-y-1.5">
            <label className="font-semibold text-sm text-[#18212F]">Appointment Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['New Consultation', 'Follow-up', 'Review'] as AppointmentType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer text-center ${
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
            <label className="font-semibold text-sm text-[#18212F]">Chief Complaint / Visit Reason *</label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Hypertension medication review, chronic knee pain"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) {
                  setFieldErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.reason;
                    return copy;
                  });
                }
              }}
              className={`w-full px-3 py-2 bg-[#FFF9F7] border rounded-xl text-sm text-[#18212F] focus:outline-none transition-colors ${
                fieldErrors.reason ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
              }`}
            />
            {fieldErrors.reason && (
              <p className="text-xs text-red-600 font-medium">{fieldErrors.reason}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-[#F1E4E1]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-[#F1E4E1] text-[#667085] hover:text-[#18212F] font-semibold rounded-xl cursor-pointer transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white font-semibold rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-sm"
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
