import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Shield, Phone, MapPin, Activity } from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { Patient } from '../../../types/reception';
import { 
  isValidIndianMobile, 
  sanitizeMobileInput, 
  isValidEmail, 
  calculateAgeFromDOB, 
  isFutureDate, 
  getTodayDateString, 
  isValidPatientName 
} from '../../../utils/validation';

interface PatientRegistrationModalProps {
  onClose: () => void;
  onSuccess?: (newPatient: Patient) => void;
}

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { registerPatient } = useReception();

  // Basic Information
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [ageDisplay, setAgeDisplay] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  // Additional Information
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Metro City');

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');

  // Medical Information
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto calculate age when DOB changes (DOB is source of truth)
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);

    if (!val) {
      setAge('');
      setAgeDisplay('');
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.dob;
        return copy;
      });
      return;
    }

    if (isFutureDate(val)) {
      setFieldErrors((prev) => ({ ...prev, dob: 'Date of birth cannot be in the future.' }));
      setAge('');
      setAgeDisplay('');
      return;
    }

    const calc = calculateAgeFromDOB(val);
    if (calc) {
      setAge(calc.years);
      setAgeDisplay(calc.displayText);
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.dob;
        delete copy.age;
        return copy;
      });
    } else {
      setFieldErrors((prev) => ({ ...prev, dob: 'Date of birth cannot be in the future.' }));
      setAge('');
      setAgeDisplay('');
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeMobileInput(e.target.value);
    setMobile(sanitized);
    if (sanitized.length === 10 && isValidIndianMobile(sanitized)) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.mobile;
        return copy;
      });
    }
  };

  const handleEmergencyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeMobileInput(e.target.value);
    setEmergencyPhone(sanitized);
    if (sanitized.length === 10 && isValidIndianMobile(sanitized)) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.emergencyPhone;
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const newErrors: { [key: string]: string } = {};

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      newErrors.fullName = 'Full name is required.';
    } else if (!isValidPatientName(trimmedName)) {
      newErrors.fullName = 'Please enter a valid patient name.';
    }

    if (!mobile.trim()) {
      newErrors.mobile = 'Phone number is required.';
    } else if (!isValidIndianMobile(mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number.';
    }

    if (!dob) {
      newErrors.dob = 'Date of birth is required.';
    } else if (isFutureDate(dob)) {
      newErrors.dob = 'Date of birth cannot be in the future.';
    }

    if (email.trim() && !isValidEmail(email)) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (emergencyPhone.trim() && !isValidIndianMobile(emergencyPhone)) {
      newErrors.emergencyPhone = 'Enter a valid 10-digit mobile number.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError(Object.values(newErrors)[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      const calculatedAgeValue = typeof age === 'number' ? age : 0;
      const res = await registerPatient({
        fullName: trimmedName,
        gender,
        dob,
        age: calculatedAgeValue,
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        bloodGroup,
        address: address.trim() || undefined,
        city: city.trim() || 'Metro City',
        emergencyContact: {
          name: emergencyName.trim() || 'N/A',
          phone: emergencyPhone.trim() || mobile.trim(),
          relationship: emergencyRelation,
        },
        allergies: allergies.trim() || 'None reported',
        medicalConditions: medicalConditions.trim() || 'None reported',
      });

      setIsSubmitting(false);

      if (res.success && res.patient) {
        if (onSuccess) {
          onSuccess(res.patient);
        }
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to register patient');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18212F]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#F1E4E1] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F1E4E1] flex items-center justify-between bg-[#FFF9F7]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F76762] to-[#FB866E] text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-[#18212F]">New Patient Registration</div>
              <div className="text-xs text-[#667085]">Create official medical record with verified UHID</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#667085] hover:text-[#18212F] rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm custom-scrollbar">
          
          {/* Section 1: Demographics */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-[#F76762] font-bold text-xs uppercase tracking-wider">
              <UserPlus className="w-3.5 h-3.5" />
              <span>1. Basic Information</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-semibold text-[#18212F]">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Jessica Miller"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (e.target.value.trim()) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.fullName;
                        return copy;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 bg-[#FFF9F7] border rounded-xl text-[#18212F] focus:outline-none transition-colors ${
                    fieldErrors.fullName ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="text-xs text-red-600 font-medium">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="font-semibold text-[#18212F]">Phone Number (10 digits) *</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={mobile}
                  onChange={handleMobileChange}
                  className={`w-full px-3 py-2 bg-[#FFF9F7] border rounded-xl text-[#18212F] focus:outline-none transition-colors font-mono ${
                    fieldErrors.mobile ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
                  }`}
                />
                {fieldErrors.mobile && (
                  <p className="text-xs text-red-600 font-medium">{fieldErrors.mobile}</p>
                )}
              </div>

              {/* Gender, Blood Group */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-[#18212F]">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-2 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#18212F]">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-2 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              {/* Date of Birth (Source of Truth) & Calculated Age */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-[#18212F]">Date of Birth *</label>
                  <input
                    type="date"
                    max={getTodayDateString()}
                    value={dob}
                    onChange={handleDobChange}
                    className={`w-full px-2.5 py-2 bg-[#FFF9F7] border rounded-xl text-[#18212F] focus:outline-none transition-colors ${
                      fieldErrors.dob ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
                    }`}
                  />
                  {fieldErrors.dob && (
                    <p className="text-xs text-red-600 font-medium">{fieldErrors.dob}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#18212F]">Age (Calculated)</label>
                  <div className="w-full px-3 py-2 bg-[#FFF9F7]/60 border border-[#F1E4E1] rounded-xl text-[#18212F] font-medium flex items-center justify-between">
                    <span>{ageDisplay || (dob ? 'Calculating...' : 'Select DOB')}</span>
                    {ageDisplay && (
                      <span className="text-[11px] font-semibold text-[#F76762] bg-[#F76762]/10 px-1.5 py-0.5 rounded">Auto</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-[#18212F]">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.email;
                        return copy;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 bg-[#FFF9F7] border rounded-xl text-[#18212F] focus:outline-none transition-colors ${
                    fieldErrors.email ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-600 font-medium">{fieldErrors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Residential Address */}
          <div className="space-y-3 border-t border-[#F1E4E1] pt-4">
            <div className="flex items-center gap-2 text-[#F76762] font-bold text-xs uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>2. Address & Location</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-[#18212F]">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. 142 Riverwalk Crescent, Apt 2B"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#18212F]">City / Town</label>
                <input
                  type="text"
                  placeholder="Metro City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Emergency Contact */}
          <div className="space-y-3 border-t border-[#F1E4E1] pt-4">
            <div className="flex items-center gap-2 text-[#F76762] font-bold text-xs uppercase tracking-wider">
              <Phone className="w-3.5 h-3.5" />
              <span>3. Emergency Contact</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-[#18212F]">Contact Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mark Miller"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#18212F]">Emergency Phone (10 digits)</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={emergencyPhone}
                  onChange={handleEmergencyPhoneChange}
                  className={`w-full px-3 py-2 bg-[#FFF9F7] border rounded-xl text-[#18212F] focus:outline-none transition-colors font-mono ${
                    fieldErrors.emergencyPhone ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#F1E4E1] focus:border-[#F76762]'
                  }`}
                />
                {fieldErrors.emergencyPhone && (
                  <p className="text-xs text-red-600 font-medium">{fieldErrors.emergencyPhone}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#18212F]">Relationship</label>
                <select
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Friend">Friend</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Medical Information */}
          <div className="space-y-3 border-t border-[#F1E4E1] pt-4">
            <div className="flex items-center gap-2 text-[#F76762] font-bold text-xs uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              <span>4. Medical History & Known Alerts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-[#18212F]">Known Drug / Food Allergies</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Aspirin, Shellfish (or None)"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#18212F]">Existing Medical Conditions</label>
                <input
                  type="text"
                  placeholder="e.g. Hypertension, Asthma, Diabetes (or None)"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
              </div>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* UHID note */}
          <div className="text-xs text-[#667085] flex items-center gap-1.5 bg-[#FFF9F7] p-2.5 rounded-xl border border-[#F1E4E1]">
            <Shield className="w-4 h-4 text-[#F76762] shrink-0" />
            <span>A unique permanent UHID will be assigned immediately and added to the clinic database.</span>
          </div>

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
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering Patient...' : 'Register Patient'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
