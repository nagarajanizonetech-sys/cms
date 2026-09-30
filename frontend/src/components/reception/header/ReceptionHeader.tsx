import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  ShieldCheck, 
  Circle,
  HelpCircle,
  Sparkles,
  ChevronDown,
  X
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { NotificationsDropdown } from './NotificationsDropdown';

interface ReceptionHeaderProps {
  title: string;
  description: string;
  onToggleSidebarMobile: () => void;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const ReceptionHeader: React.FC<ReceptionHeaderProps> = ({
  title,
  description,
  onToggleSidebarMobile,
  onNavigate,
  onLogout,
}) => {
  const { notifications, searchPatients } = useReception();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const searchResults = searchQuery.trim() ? searchPatients(searchQuery).slice(0, 4) : [];

  // Close profile menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#F1E4E1] px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Hamburger & Page Context */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebarMobile}
            className="lg:hidden p-2 rounded-xl border border-[#F1E4E1] hover:bg-[#FFF9F7] text-[#18212F] cursor-pointer"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-[#18212F] truncate tracking-tight">
              {title}
            </h1>
            <p className="text-[11px] text-[#667085] truncate hidden sm:block">
              {description}
            </p>
          </div>
        </div>

        {/* Right Side: Global Search, Live Status, Notification, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Global Quick Patient Search */}
          <div ref={searchBoxRef} className="relative hidden md:block w-64 lg:w-72">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#667085]" />
              <input
                type="text"
                placeholder="Search UHID, Patient, Mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-8 pr-7 py-1.5 bg-[#FFF9F7] hover:bg-white focus:bg-white border border-[#F1E4E1] focus:border-[#F76762] rounded-xl text-xs text-[#18212F] transition-all focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[#667085] hover:text-[#18212F]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Search Popover Results */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-10 left-0 right-0 bg-white rounded-xl border border-[#F1E4E1] shadow-xl z-50 overflow-hidden divide-y divide-[#F1E4E1] animate-in fade-in duration-150">
                <div className="p-2 bg-[#FFF9F7] text-[10px] font-bold text-[#667085] uppercase tracking-wider">
                  Matching Patients
                </div>
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onNavigate(`/reception/patients/${p.id}`);
                      setIsSearchFocused(false);
                      setSearchQuery('');
                    }}
                    className="w-full p-2.5 text-left hover:bg-[#FFF9F7] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#18212F]">{p.fullName}</div>
                      <div className="text-[10px] font-mono text-[#667085]">{p.uhid} · {p.mobile}</div>
                    </div>
                    <span className="text-[10px] text-[#F76762] font-semibold">View</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Operational Reception Status Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[11px] font-medium font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Station #01 Online</span>
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl border border-[#F1E4E1] hover:bg-[#FFF9F7] text-[#18212F] relative transition-colors cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F76762] text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <NotificationsDropdown
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              onNavigate={onNavigate}
            />
          </div>

          {/* User Profile / Receptionist Session */}
          <div ref={profileMenuRef} className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#F1E4E1] hover:bg-[#FFF9F7] transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#F76762] to-[#FB866E] text-white flex items-center justify-center text-xs font-bold shrink-0">
                R
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-[#18212F] leading-tight flex items-center gap-1">
                  <span>Receptionist</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                </div>
                <div className="text-[10px] text-[#667085] leading-none">
                  Front Desk Desk #1
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#667085] hidden sm:block" />
            </button>

            {/* Profile Menu Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl border border-[#F1E4E1] shadow-2xl z-50 p-1.5 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2 border-b border-[#F1E4E1] mb-1">
                  <div className="font-bold text-[#18212F]">Front Desk Operator</div>
                  <div className="text-[10px] text-[#667085]">reception@auraclinic.com</div>
                  <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active Session</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onNavigate('/reception/dashboard');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-[#FFF9F7] text-[#18212F] flex items-center gap-2 cursor-pointer font-medium"
                >
                  <User className="w-3.5 h-3.5 text-[#667085]" />
                  <span>My Workstation</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onNavigate('/reception/reports');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-[#FFF9F7] text-[#18212F] flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Settings className="w-3.5 h-3.5 text-[#667085]" />
                  <span>Daily Shift Reports</span>
                </button>

                <div className="border-t border-[#F1E4E1] my-1"></div>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
