import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  LogOut, 
  Circle,
  ChevronDown,
  X
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { DoctorStatus, Doctor } from '../../../types/reception';
import { NotificationsDropdown } from '../../reception/header/NotificationsDropdown';
import { getPatientAgeDisplay } from '../../../utils/validation';

const FALLBACK_DOCTOR: Doctor = {
  id: '1',
  name: 'Dr. Sarah Jenkins',
  email: 'doctor.sarah@auracms.com',
  code: 'DOC-001',
  specialization: 'Cardiology & General Medicine',
  room: 'Room 102',
  status: 'Available',
  schedule: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    slotDurationMins: 20,
  },
  waitingCount: 0,
  consultationFee: 75,
};

interface DoctorHeaderProps {
  title: string;
  description: string;
  onToggleSidebarMobile: () => void;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const DoctorHeader: React.FC<DoctorHeaderProps> = ({
  title,
  description,
  onToggleSidebarMobile,
  onNavigate,
  onLogout,
}) => {
  const { doctors, currentDoctorId, setCurrentDoctorId, setDoctorAvailability, notifications, searchPatients } = useReception();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDoctorSwitchOpen, setIsDoctorSwitchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Identify current logged-in doctor with resilient fallback
  const currentDoctor = doctors.find((d) => d.id === currentDoctorId || d.id === `doc-${currentDoctorId}`) || doctors[0] || FALLBACK_DOCTOR;

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const searchResults = searchQuery.trim() ? searchPatients(searchQuery).slice(0, 4) : [];

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
        setIsDoctorSwitchOpen(false);
      }
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status?: DoctorStatus) => {
    switch (status) {
      case 'Available':
        return 'text-emerald-500 fill-emerald-500';
      case 'In Consultation':
        return 'text-amber-500 fill-amber-500';
      case 'Not Available':
      case 'On Leave':
        return 'text-neutral-400 fill-neutral-400';
      default:
        return 'text-emerald-500 fill-emerald-500';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#F1E4E1] transition-all">
      <div className="px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Left: Mobile hamburger & Page Title / Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebarMobile}
            className="lg:hidden p-2 rounded-xl text-[#18212F] hover:bg-[#FFF9F7] border border-[#F1E4E1] cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="text-lg sm:text-xl font-bold text-[#18212F] tracking-tight truncate leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Right: Quick Search, Doctor Availability, Notifications & Doctor Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          
          {/* Global Clinical Search */}
          <div ref={searchBoxRef} className="relative hidden md:block">
            <div className={`relative flex items-center transition-all ${isSearchFocused ? 'w-72' : 'w-56'}`}>
              <Search className="w-4 h-4 text-[#667085] absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patient, UHID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full h-10 pl-9 pr-8 bg-[#FFF9F7] hover:bg-white focus:bg-white text-xs sm:text-sm text-[#18212F] rounded-xl border border-[#F1E4E1] focus:border-[#F76762] focus:outline-none transition-all placeholder:text-[#667085]/70"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-[#667085] hover:text-[#18212F] p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Search Results Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 right-0 mt-1 bg-white rounded-xl border border-[#F1E4E1] shadow-xl overflow-hidden z-50 animate-in fade-in duration-150">
                <div className="p-2 border-b border-[#F1E4E1] text-[10px] font-bold text-[#667085] uppercase tracking-wider bg-[#FFF9F7]">
                  Clinical Search Results
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-[#F1E4E1]/60">
                  {searchResults.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        onNavigate('/doctor/patients');
                        setIsSearchFocused(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-2.5 hover:bg-[#FFF9F7] flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-[#18212F]">{patient.fullName}</div>
                        <div className="text-[10px] text-[#667085] font-mono">{patient.uhid} · {getPatientAgeDisplay(patient)}/{patient.gender}</div>
                      </div>
                      <span className="text-[10px] text-[#F76762] font-semibold bg-[#F76762]/10 px-1.5 py-0.5 rounded">
                        View
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Availability Status Toggle */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 h-10 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs font-semibold text-[#18212F] shrink-0">
              <Circle className={`w-2.5 h-2.5 ${getStatusColor(currentDoctor?.status)}`} />
              <select
                value={currentDoctor?.status || 'Available'}
                onChange={(e) => {
                  if (currentDoctor?.id) {
                    setDoctorAvailability(currentDoctor.id, e.target.value as DoctorStatus);
                  }
                }}
                className="bg-transparent border-none text-xs font-semibold text-[#18212F] focus:outline-none cursor-pointer pr-1"
                aria-label="Doctor Availability Status"
              >
                <option value="Available">Available</option>
                <option value="In Consultation">In Consultation</option>
                <option value="Not Available">Away</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          {/* Notifications Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative w-10 h-10 rounded-xl text-[#18212F] hover:bg-[#FFF9F7] border border-[#F1E4E1] hover:border-[#F76762]/30 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Doctor Notifications"
              title="Clinic Notifications"
            >
              <Bell className="w-4 h-4 text-[#667085]" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#F76762] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>

            <NotificationsDropdown
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              onNavigate={onNavigate}
              title="Doctor Notifications"
              portal="doctor"
            />
          </div>

          {/* Doctor Profile Badge & Workstation Menu */}
          <div ref={profileMenuRef} className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2.5 h-10 px-2.5 sm:px-3 rounded-xl border border-[#F1E4E1] hover:bg-[#FFF9F7] hover:border-[#F76762]/30 transition-all cursor-pointer shrink-0"
              aria-label="User profile menu"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                {currentDoctor?.name ? currentDoctor.name.replace('Dr. ', '').charAt(0) : 'D'}
              </div>
              <div className="hidden sm:flex flex-col text-left whitespace-nowrap">
                <span className="text-xs font-bold text-[#18212F] leading-tight flex items-center gap-1">
                  <span>{currentDoctor?.name || 'Dr. Sarah K.'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#667085] shrink-0" />
                </span>
                <span className="text-[11px] text-[#667085] leading-none mt-0.5 font-mono">
                  {currentDoctor?.room ? currentDoctor.room.split('·')[0].trim() : 'Room 101'}
                </span>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#F1E4E1] shadow-xl py-2 z-50 animate-in fade-in duration-150">
                <div className="px-4 py-3 border-b border-[#F1E4E1] bg-[#FFF9F7]/60">
                  <div className="text-xs font-bold text-[#18212F]">{currentDoctor?.name}</div>
                  <div className="text-[11px] text-[#667085]">{currentDoctor?.specialization}</div>
                  <div className="text-[10px] font-mono text-[#F76762] mt-1 font-semibold">
                    {currentDoctor?.email || 'doctor1@gmail.com'}
                  </div>
                  <div className="text-[10px] text-[#667085] mt-0.5">
                    {currentDoctor?.room}
                  </div>
                </div>

                {/* Quick Doctor Account Switcher (allows instant testing of Doctor 1 vs Doctor 2 vs Doctor 3) */}
                <div className="px-3 py-2 border-b border-[#F1E4E1]">
                  <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Active Doctor Account</span>
                    <span className="text-[#F76762]">Isolated</span>
                  </div>
                  <div className="space-y-1">
                    {doctors.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setCurrentDoctorId(doc.id);
                          setIsProfileMenuOpen(false);
                          onNavigate('/doctor/dashboard');
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          doc.id === currentDoctor?.id
                            ? 'bg-[#F76762]/10 text-[#F76762] font-bold'
                            : 'text-[#18212F] hover:bg-[#FFF9F7]'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-[11px]">{doc.name}</div>
                          <div className="text-[9px] text-[#667085] font-mono">{doc.email}</div>
                        </div>
                        {doc.id === currentDoctor?.id && (
                          <span className="text-[10px] font-bold">Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-1 pt-1.5">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out of Doctor Workstation</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
