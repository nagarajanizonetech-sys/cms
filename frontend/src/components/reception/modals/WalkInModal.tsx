import React, { useState, useEffect } from 'react';
import { X, Zap, Search, UserCheck, Stethoscope, CheckCircle2, AlertCircle, Plus, Clock } from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { Patient } from '../../../types/reception';
import { 
  isValidIndianMobile, 
  sanitizeMobileInput, 
  calculateAgeFromDOB, 
  isFutureDate, 
  getTodayDateString, 
  isValidPatientName,
  getPatientAgeDisplay 
} from '../../../utils/validation';

interface WalkInModalProps {
  onClose: () => void;
  onSuccess?: (token: string) => void;
  preselectedDoctorId?: string;
  preselectedPatientId?: string;
}

export const WalkInModal: React.FC<WalkInModalProps> = ({ 
  onClose, 
  onSuccess,
  preselectedDoctorId,
  preselectedPatientId,
}) => {
  const { patients, doctors, createWalkIn } = useReception();

  // Mode: 'existing' or 'new'
  const [patientMode, setPatientMode] = useState<'existing' | 'new'>(preselectedPatientId ? 'existing' : 'existing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || '');
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // For Quick New Patient
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newAge, setNewAge] = useState<number | ''>('');
  const [newAgeDisplay, setNewAgeDisplay] = useState('');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  // Doctor & Visit
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(preselectedDoctorId || doctors[0]?.id || '');
  const [reason, setReason] = useState('Acute consultation / Walk-in checkup');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedDoctorId) {
      setSelectedDoctorId(preselectedDoctorId);
    }
  }, [preselectedDoctorId]);

  useEffect(() => {
    if (preselectedPatientId) {
      setSelectedPatientId(preselectedPatientId);
      setPatientMode('existing');
    }
  }, [preselectedPatientId]);

  // Filter existing patients
  const filteredPatients = patients.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.mobile.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    );
  }).slice(0, 5);

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewDob(val);

    if (!val) {
      setNewAge('');
      setNewAgeDisplay('');
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.newDob;
        return copy;
      });
      return;
    }

    if (isFutureDate(val)) {
      setFieldErrors((prev) => ({ ...prev, newDob: 'Date of birth cannot be in the future.' }));
      setNewAge('');
      setNewAgeDisplay('');
      return;
    }

    const calc = calculateAgeFromDOB(val);
    if (calc) {
      setNewAge(calc.years);
      setNewAgeDisplay(calc.displayText);
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.newDob;
        delete copy.newAge;
        return copy;
      });
    } else {
      setFieldErrors((prev) => ({ ...prev, newDob: 'Date of birth cannot be in the future.' }));
      setNewAge('');
      setNewAgeDisplay('');
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeMobileInput(e.target.value);
    setNewMobile(sanitized);
    if (sanitized.length === 10 && isValidIndianMobile(sanitized)) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.newMobile;
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const newErrs: { [key: string]: string } = {};

    if (patientMode === 'existing' && !selectedPatientId) {
      setError('Please select an existing patient from the list, or switch to Quick Register.');
      return;
    }

    if (patientMode === 'new') {
      const cleanFirst = newFirstName.trim();
      if (!cleanFirst) {
        newErrs.newFirstName = 'Full name is required.';
      } else if (!isValidPatientName(cleanFirst)) {
        newErrs.newFirstName = 'Please enter a valid patient name.';
      }

      if (!newMobile.trim()) {
        newErrs.newMobile = 'Phone number is required.';
      } else if (!isValidIndianMobile(newMobile)) {
        newErrs.newMobile = 'Enter a valid 10-digit mobile number.';
      }

      if (newDob && isFutureDate(newDob)) {
        newErrs.newDob = 'Date of birth cannot be in the future.';
      }

      if (newAge === '' || Number(newAge) < 0) {
        newErrs.newAge = 'Age or Date of birth is required.';
      }
    }

    if (!selectedDoctorId) {
      setError('Doctor is required.');
      return;
    }

    if (Object.keys(newErrs).length > 0) {
      setFieldErrors(newErrs);
      setError(Object.values(newErrs)[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      const finalReason = reason.trim() || 'General Consultation';
      if (patientMode === 'existing') {
        result = await createWalkIn({
          existingPatientId: selectedPatientId,
          doctorId: selectedDoctorId,
          reason: finalReason,
        });
      } else {
        const cleanFirst = newFirstName.trim();
        const cleanLast = newLastName.trim() === '.' ? '' : newLastName.trim();
        const computedFullName = [cleanFirst, cleanLast].filter(Boolean).join(' ');

        result = await createWalkIn({
          newPatient: {
            firstName: cleanFirst,
            lastName: cleanLast,
            fullName: computedFullName,
            mobile: newMobile.trim(),
            age: Number(newAge) || 0,
            gender: newGender,
            dob: newDob || '1995-01-01',
            bloodGroup: 'O+',
            emergencyContact: {
              name: 'N/A',
              phone: newMobile.trim(),
              relationship: 'Family',
            },
            allergies: 'None reported',
            medicalConditions: 'None reported',
          },
          doctorId: selectedDoctorId,
          reason: finalReason,
        });
      }

      setIsSubmitting(false);

      if (result.success) {
        if (onSuccess) {
          onSuccess(result.token);
        }
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to check in walk-in patient');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18212F]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#F1E4E1] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-[#F1E4E1] flex items-center justify-between bg-[#FFF9F7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F76762] to-[#FB866E] text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#18212F]">Fast Walk-in Registration</div>
              <div className="text-[11px] text-[#667085]">Instant token generation & queue placement</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#667085] hover:text-[#18212F] rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Step 1: Patient Selection Mode */}
          <div className="space-y-2">
            <label className="font-bold text-[#18212F] uppercase tracking-wider text-[11px]">
              1. Patient Identification
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setPatientMode('existing'); setError(null); }}
                className={`py-2 px-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  patientMode === 'existing'
                    ? 'bg-[#18212F] text-white border-[#18212F]'
                    : 'bg-white text-[#667085] border-[#F1E4E1] hover:text-[#18212F]'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Existing Patient</span>
              </button>
              <button
                type="button"
                onClick={() => { setPatientMode('new'); setError(null); }}
                className={`py-2 px-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  patientMode === 'new'
                    ? 'bg-[#18212F] text-white border-[#18212F]'
                    : 'bg-white text-[#667085] border-[#F1E4E1] hover:text-[#18212F]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Register New</span>
              </button>
            </div>
          </div>

          {/* Mode A: Select Existing Patient */}
          {patientMode === 'existing' && (
            <div className="space-y-2 bg-[#FFF9F7] p-3.5 rounded-xl border border-[#F1E4E1]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#667085]" />
                <input
                  type="text"
                  placeholder="Search by UHID, Name, or Mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-[#F1E4E1] pt-1">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full p-2 rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer ${
                      selectedPatientId === p.id
                        ? 'bg-[#F76762]/10 border border-[#F76762] text-[#18212F]'
                        : 'hover:bg-white text-[#667085]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[#18212F] text-xs">{p.fullName}</div>
                      <div className="text-[10px] font-mono text-[#667085]">{p.uhid} · {p.mobile}</div>
                    </div>
                    {selectedPatientId === p.id && (
                      <CheckCircle2 className="w-4 h-4 text-[#F76762] shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {selectedPatient && (
                <div className="pt-2 border-t border-[#F1E4E1] text-[11px] text-[#18212F]">
                  Selected: <strong>{selectedPatient.fullName}</strong> ({getPatientAgeDisplay(selectedPatient)}/{selectedPatient.gender}) · {selectedPatient.bloodGroup || 'Blood: N/A'}
                </div>
              )}
            </div>
          )}

          {/* Mode B: Quick Register New Patient */}
          {patientMode === 'new' && (
            <div className="space-y-3 bg-[#FFF9F7] p-3.5 rounded-xl border border-[#F1E4E1]">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-[#18212F]">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria"
                    value={newFirstName}
                    onChange={(e) => {
                      setNewFirstName(e.target.value);
                      if (e.target.value.trim()) {
                        setFieldErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.newFirstName;
                          return copy;
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-[#18212F] focus:outline-none transition-colors ${
                      fieldErrors.newFirstName ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
                    }`}
                  />
                  {fieldErrors.newFirstName && (
                    <p className="text-xs text-red-600 font-medium">{fieldErrors.newFirstName}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#18212F]">
                    Last Name <span className="text-xs text-[#667085] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gonzalez"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-[#18212F]">Mobile Number (10 digits) *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="9876543210"
                    value={newMobile}
                    onChange={handleMobileChange}
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-[#18212F] focus:outline-none transition-colors font-mono ${
                      fieldErrors.newMobile ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
                    }`}
                  />
                  {fieldErrors.newMobile && (
                    <p className="text-xs text-red-600 font-medium">{fieldErrors.newMobile}</p>
                  )}
                </div>

                {/* Date of Birth (Source of Truth) & Calculated Age */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#18212F]">Date of Birth</label>
                  <input
                    type="date"
                    max={getTodayDateString()}
                    value={newDob}
                    onChange={handleDobChange}
                    className={`w-full px-2.5 py-2 bg-white border rounded-xl text-[#18212F] focus:outline-none transition-colors ${
                      fieldErrors.newDob ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
                    }`}
                  />
                  {fieldErrors.newDob && (
                    <p className="text-xs text-red-600 font-medium">{fieldErrors.newDob}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#18212F]">
                    Age * {newAgeDisplay && <span className="text-xs text-[#F76762] font-semibold">(Auto)</span>}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="125"
                    required
                    placeholder="e.g. 28"
                    value={newAge}
                    onChange={(e) => {
                      setNewAge(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                      if (e.target.value !== '') {
                        setFieldErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.newAge;
                          return copy;
                        });
                      }
                    }}
                    className={`w-full px-2 py-2 bg-white border rounded-xl text-[#18212F] focus:outline-none transition-colors ${
                      fieldErrors.newAge ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
                    }`}
                  />
                  {fieldErrors.newAge && (
                    <p className="text-xs text-red-600 font-medium">{fieldErrors.newAge}</p>
                  )}
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-[#18212F]">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full px-2 py-2 bg-white border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Doctor & Room */}
          <div className="space-y-2">
            <label className="font-bold text-[#18212F] uppercase tracking-wider text-[11px]">
              2. Select Doctor Station
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {doctors.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDoctorId(doc.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedDoctorId === doc.id
                      ? 'bg-white border-[#F76762] shadow-sm ring-1 ring-[#F76762]'
                      : 'bg-[#FFF9F7] border-[#F1E4E1] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#18212F]">{doc.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      doc.status === 'Available' ? 'bg-emerald-100 text-emerald-700' :
                      doc.status === 'In Consultation' ? 'bg-amber-100 text-amber-700' :
                      'bg-neutral-100 text-neutral-600'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#667085] truncate">{doc.specialization}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#667085] font-mono border-t border-[#F1E4E1] pt-1.5">
                    <span>{doc.room.split('·')[0]}</span>
                    <span>Waiting: {doc.waitingCount}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Visit Reason */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#18212F] flex items-center justify-between">
              <span>Consultation Reason</span>
              <span className="text-xs font-normal text-[#667085]">Optional</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Fever, minor injury, prescription refill (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Instant actions summary */}
          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Clicking below instantly generates token, marks patient checked-in, routes to doctor queue, and creates consultation invoice.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-[#F1E4E1]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-[#F1E4E1] text-[#667085] hover:text-[#18212F] font-semibold rounded-xl cursor-pointer transition-colors text-sm shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white font-semibold rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm whitespace-nowrap"
            >
              <Zap className="w-4 h-4 shrink-0" />
              <span>{isSubmitting ? 'Generating Token...' : 'Generate Token & Send to Queue'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
