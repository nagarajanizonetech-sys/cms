import React, { useState } from 'react';
import { 
  Stethoscope, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CalendarDays, 
  Clock, 
  CreditCard, 
  History, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Repeat,
  X
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';

interface ReceptionSidebarProps {
  currentRoute: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onNavigate: (route: string) => void;
  onOpenRegisterModal?: () => void;
  onOpenWalkInModal?: () => void;
  onLogout: () => void;
}

export const ReceptionSidebar: React.FC<ReceptionSidebarProps> = ({
  currentRoute,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onNavigate,
  onOpenRegisterModal,
  onOpenWalkInModal,
  onLogout,
}) => {
  const [appointmentsSubOpen, setAppointmentsSubOpen] = useState(true);
  const { followUps } = useReception();
  const followUpsCount = followUps.filter((f) => f.status === 'Scheduled').length;

  const isActive = (route: string) => {
    if (route === '/reception/dashboard' && (currentRoute === '/reception' || currentRoute === '/reception/dashboard')) {
      return true;
    }
    if (route === '/reception/patients' && currentRoute.startsWith('/reception/patients')) {
      return true;
    }
    return currentRoute === route;
  };

  const navItemClass = (active: boolean) => `
    flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative group
    ${active 
      ? 'bg-[#F76762]/10 text-[#F76762] font-bold' 
      : 'text-[#667085] hover:text-[#18212F] hover:bg-[#FFF9F7]'
    }
  `;

  const handleLinkClick = (route: string) => {
    onNavigate(route);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#18212F]/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-[#F1E4E1] flex flex-col justify-between transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-18' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Top Header & Logo */}
        <div>
          <div className="h-16 px-4 border-b border-[#F1E4E1] flex items-center justify-between">
            <div 
              onClick={() => handleLinkClick('/reception/dashboard')}
              className={`flex items-center gap-2.5 cursor-pointer ${isCollapsed ? 'justify-center w-full' : ''}`}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white shrink-0 shadow-xs">
                <Stethoscope className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-sm font-extrabold tracking-tight text-[#18212F]">
                    Aura<span className="text-[#F76762]">CMS</span>
                  </div>
                  <div className="text-[10px] text-[#667085] font-medium leading-none">
                    Clinic Management
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg border border-[#F1E4E1] hover:bg-[#FFF9F7] text-[#667085] hover:text-[#18212F] transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-[#667085] hover:text-[#18212F] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)]">
            
            {/* Dashboard */}
            <button
              onClick={() => handleLinkClick('/reception/dashboard')}
              className={`w-full ${navItemClass(isActive('/reception/dashboard'))}`}
              title={isCollapsed ? 'Dashboard' : undefined}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
              {isCollapsed && (
                <div className="absolute left-16 bg-[#18212F] text-white text-[11px] py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                  Dashboard
                </div>
              )}
            </button>

            {/* All Patients */}
            <button
              onClick={() => handleLinkClick('/reception/patients')}
              className={`w-full ${navItemClass(isActive('/reception/patients'))}`}
              title={isCollapsed ? 'All Patients' : undefined}
            >
              <Users className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>All Patients</span>}
              {isCollapsed && (
                <div className="absolute left-16 bg-[#18212F] text-white text-[11px] py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                  All Patients
                </div>
              )}
            </button>

            {/* Appointments section */}
            <div>
              <button
                onClick={() => {
                  if (isCollapsed) {
                    handleLinkClick('/reception/appointments');
                  } else {
                    setAppointmentsSubOpen(!appointmentsSubOpen);
                  }
                }}
                className={`w-full ${navItemClass(isActive('/reception/appointments') || isActive('/reception/calendar'))}`}
                title={isCollapsed ? 'Appointments' : undefined}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">Appointments</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${appointmentsSubOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
                {isCollapsed && (
                  <div className="absolute left-16 bg-[#18212F] text-white text-[11px] py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                    Appointments
                  </div>
                )}
              </button>

              {!isCollapsed && appointmentsSubOpen && (
                <div className="pl-6 pr-2 py-1 space-y-1">
                  <button
                    onClick={() => handleLinkClick('/reception/appointments')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer ${
                      currentRoute === '/reception/appointments'
                        ? 'text-[#F76762] font-bold bg-[#F76762]/5'
                        : 'text-[#667085] hover:text-[#18212F]'
                    }`}
                  >
                    • Today's Appointments
                  </button>
                  <button
                    onClick={() => handleLinkClick('/reception/calendar')}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer ${
                      currentRoute === '/reception/calendar'
                        ? 'text-[#F76762] font-bold bg-[#F76762]/5'
                        : 'text-[#667085] hover:text-[#18212F]'
                    }`}
                  >
                    • Calendar View
                  </button>
                </div>
              )}
            </div>

            {/* Queue Management */}
            <button
              onClick={() => handleLinkClick('/reception/queue')}
              className={`w-full ${navItemClass(isActive('/reception/queue'))}`}
              title={isCollapsed ? 'Doctor Queue' : undefined}
            >
              <Clock className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Queue</span>}
              {isCollapsed && (
                <div className="absolute left-16 bg-[#18212F] text-white text-[11px] py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                  Queue
                </div>
              )}
            </button>

            {/* Payment Desk */}
            <button
              onClick={() => handleLinkClick('/reception/payments')}
              className={`w-full ${navItemClass(isActive('/reception/payments'))}`}
              title={isCollapsed ? 'Payments' : undefined}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Payments</span>}
              {isCollapsed && (
                <div className="absolute left-16 bg-[#18212F] text-white text-[11px] py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                  Payments
                </div>
              )}
            </button>

            {/* Patient History */}
            <button
              onClick={() => handleLinkClick('/reception/patient-history')}
              className={`w-full ${navItemClass(isActive('/reception/patient-history'))}`}
              title={isCollapsed ? 'Patient History' : undefined}
            >
              <History className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Patient History</span>}
              {isCollapsed && (
                <div className="absolute left-16 bg-[#18212F] text-white text-[11px] py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                  Patient History
                </div>
              )}
            </button>

            {/* Follow-ups */}
            <button
              onClick={() => handleLinkClick('/reception/follow-ups')}
              className={`w-full ${navItemClass(isActive('/reception/follow-ups'))}`}
              title={isCollapsed ? 'Follow-ups' : undefined}
            >
              <Repeat className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Follow-ups</span>
                  {followUpsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 shrink-0">
                      {followUpsCount}
                    </span>
                  )}
                </>
              )}
              {isCollapsed && (
                <div className="absolute left-16 bg-[#18212F] text-white text-[11px] py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                  Follow-ups {followUpsCount > 0 ? `(${followUpsCount})` : ''}
                </div>
              )}
            </button>

            {/* Reports */}
            <button
              onClick={() => handleLinkClick('/reception/reports')}
              className={`w-full ${navItemClass(isActive('/reception/reports'))}`}
              title={isCollapsed ? 'Daily Reports' : undefined}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Reports</span>}
              {isCollapsed && (
                <div className="absolute left-16 bg-[#18212F] text-white text-[11px] py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                  Reports
                </div>
              )}
            </button>

          </nav>
        </div>

        {/* Bottom Utility & Logout */}
        <div className="p-3 border-t border-[#F1E4E1] space-y-1">
          <button
            onClick={() => handleLinkClick('/reception/reports')}
            className={`w-full ${navItemClass(false)}`}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </button>

          <button
            onClick={() => handleLinkClick('/reception/dashboard')}
            className={`w-full ${navItemClass(false)}`}
            title={isCollapsed ? 'Help & Support' : undefined}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Help & Support</span>}
          </button>

          <div className="border-t border-[#F1E4E1] my-1"></div>

          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

      </aside>
    </>
  );
};
