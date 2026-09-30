import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2, Heart, Shield, Phone, MapPin, Activity } from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { Patient } from '../../../types/reception';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto calculate age when DOB changes
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
    if (val) {
      const birthDate = new Date(val);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge >= 0 && calculatedAge < 130) {
        setAge(calculatedAge);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please provide the patient full name.');
      return;
    }

    if (!mobile.trim() || mobile.replace(/\D/g, '').length < 7) {
      setError('Please enter a valid mobile number (min 7 digits).');
      return;
    }

    if (age === '' || Number(age) < 0) {
      setError('Please enter a valid age or date of birth.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerPatient({
        fullName: fullName.trim(),
        gender,
        dob: dob || '1990-01-01',
        age: Number(age),
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
        <div className="p-4 border-b border-[#F1E4E1] flex items-center justify-between bg-[#FFF9F7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F76762] to-[#FB866E] text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#18212F]">Register New Patient</div>
              <div className="text-[11px] text-[#667085]">Automatic UHID generation & electronic clinic record</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#667085] hover:text-[#18212F] rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#F76762] font-bold text-xs uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5" />
              <span>1. Basic Personal Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-[#18212F]">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Miller"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#18212F]">Mobile Number (Required for UHID) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
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
                  <label className="font-semibold text-[#18212F]">Age *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="125"
                    placeholder="e.g. 34"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full px-2 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                  />
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

              <div className="space-y-1">
                <label className="font-semibold text-[#18212F]">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={handleDobChange}
                  className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-[#18212F]">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
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
                <label className="font-semibold text-[#18212F]">Emergency Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-[#18212F] focus:outline-none focus:border-[#F76762]"
                />
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
          <div className="text-[11px] text-[#667085] flex items-center gap-1.5 bg-[#FFF9F7] p-2.5 rounded-xl border border-[#F1E4E1]">
            <Shield className="w-4 h-4 text-[#F76762] shrink-0" />
            <span>A unique permanent UHID will be assigned immediately and added to the clinic database.</span>
          </div>

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
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering Patient...' : 'Register Patient'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
