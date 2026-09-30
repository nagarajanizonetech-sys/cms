import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  CalendarPlus, 
  Zap, 
  Eye, 
  Phone, 
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { Patient } from '../../../types/reception';
import { getPatientAgeDisplay } from '../../../utils/validation';

interface PatientDirectoryViewProps {
  onSelectPatient: (patientId: string) => void;
  onOpenRegisterModal: () => void;
  onBookAppointment: (patientId: string) => void;
  onWalkIn: (patientId: string) => void;
}

export const PatientDirectoryView: React.FC<PatientDirectoryViewProps> = ({
  onSelectPatient,
  onOpenRegisterModal,
  onBookAppointment,
  onWalkIn,
}) => {
  const { patients, searchPatients } = useReception();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');

  const filteredPatients = searchPatients(searchQuery).filter(p => {
    if (genderFilter === 'All') return true;
    return p.gender === genderFilter;
  });

  return (
    <div className="space-y-5 text-xs">
      
      {/* Top Banner & Primary Action */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#18212F] tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-[#F76762]" />
            <span>Master Patient Directory</span>
          </h2>
          <p className="text-[11px] text-[#667085] mt-0.5">
            Total of {patients.length} registered electronic clinic records with automated UHID indexing
          </p>
        </div>

        <button
          onClick={onOpenRegisterModal}
          className="px-4 py-2.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-xs hover:opacity-90 transition-all cursor-pointer text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#667085]" />
          <input
            type="text"
            placeholder="Search by UHID (e.g. AUR-2026), Name, or Mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-sm text-[#18212F] focus:outline-none focus:border-[#F76762]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#667085] hidden md:inline font-medium">Gender:</span>
          {(['All', 'Male', 'Female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-semibold cursor-pointer transition-colors ${
                genderFilter === g
                  ? 'bg-[#18212F] text-white border-[#18212F]'
                  : 'bg-white text-[#667085] border-[#F1E4E1] hover:text-[#18212F]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F1E4E1] bg-[#FFF9F7]/70 text-[#667085] uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Patient Name</th>
                <th className="py-3 px-4 font-semibold">UHID</th>
                <th className="py-3 px-4 font-semibold">Age / Gender</th>
                <th className="py-3 px-4 font-semibold">Mobile Number</th>
                <th className="py-3 px-4 font-semibold">Blood Group</th>
                <th className="py-3 px-4 font-semibold">Last Visit</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E4E1]">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#667085]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-semibold text-[#18212F]">No patient records found</p>
                      <p className="text-[11px]">No patient matched your search query. Try another search or register as new.</p>
                      <button
                        onClick={onOpenRegisterModal}
                        className="mt-2 px-3 py-1.5 bg-[#F76762] text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Register New Patient
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-[#FFF9F7]/50 transition-colors">
                    
                    {/* Patient Name */}
                    <td className="py-3 px-4">
                      <div 
                        onClick={() => onSelectPatient(patient.id)}
                        className="font-bold text-[#18212F] hover:text-[#F76762] cursor-pointer flex items-center gap-2"
                      >
                        <span>{patient.fullName}</span>
                      </div>
                      <div className="text-[10px] text-[#667085]">{patient.city || 'Metro City'}</div>
                    </td>

                    {/* UHID */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-xs text-[#F76762] bg-[#F76762]/10 px-2 py-0.5 rounded">
                        {patient.uhid}
                      </span>
                    </td>

                    {/* Age / Gender */}
                    <td className="py-3 px-4 text-[#18212F]">
                      {getPatientAgeDisplay(patient)} · {patient.gender}
                    </td>

                    {/* Mobile */}
                    <td className="py-3 px-4 font-mono text-[#667085]">
                      {patient.mobile}
                    </td>

                    {/* Blood Group */}
                    <td className="py-3 px-4">
                      <span className="font-semibold px-2 py-0.5 bg-neutral-100 rounded text-[11px] text-[#18212F]">
                        {patient.bloodGroup || 'N/A'}
                      </span>
                    </td>

                    {/* Last Visit */}
                    <td className="py-3 px-4 text-[#667085] font-mono text-[11px]">
                      {patient.lastVisit || 'First Visit Today'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectPatient(patient.id)}
                          className="px-2.5 py-1 bg-white hover:bg-neutral-50 text-[#18212F] border border-[#F1E4E1] rounded-lg font-medium transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                          title="View Patient Profile"
                        >
                          <Eye className="w-3 h-3 text-[#667085]" />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => onBookAppointment(patient.id)}
                          className="px-2.5 py-1 bg-white hover:bg-neutral-50 text-blue-600 border border-[#F1E4E1] rounded-lg font-medium transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                          title="Book Clinical Appointment"
                        >
                          <CalendarPlus className="w-3 h-3" />
                          <span>Book</span>
                        </button>
                        <button
                          onClick={() => onWalkIn(patient.id)}
                          className="px-2.5 py-1 bg-[#F76762]/10 hover:bg-[#F76762]/20 text-[#F76762] rounded-lg font-bold transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                          title="Fast Walk-in Registration"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Walk-in</span>
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

    </div>
  );
};
