import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Clock, 
  CreditCard, 
  FileText, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  Stethoscope, 
  LogOut, 
  X,
  History,
  Repeat,
  HeartPulse,
  Receipt
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';

interface DoctorSidebarProps {
  currentRoute: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const DoctorSidebar: React.FC<DoctorSidebarProps> = ({
  currentRoute,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onNavigate,
  onLogout,
}) => {
  const { currentDoctorId, queues, appointments, followUps } = useReception();

  // Filter queues & appointments for badge counts
  const cleanDocId = currentDoctorId?.replace('doc-', '');
  const doctorWaitingCount = queues.filter(q => (q.doctorId === currentDoctorId || q.doctorId === cleanDocId) && q.status === 'Waiting').length;
  const doctorTodayAptCount = appointments.filter(a => (a.doctorId === currentDoctorId || a.doctorId === cleanDocId) && (a.status === 'Scheduled' || a.status === 'Waiting')).length;
  const doctorFollowUpCount = followUps.filter(f => (f.doctorId === currentDoctorId || f.doctorId === cleanDocId) && f.status === 'Scheduled').length;

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      route: '/doctor/dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'appointments',
      label: 'Appointments',
      route: '/doctor/appointments',
      icon: Calendar,
      badge: doctorWaitingCount > 0 
        ? `${doctorWaitingCount} waiting` 
        : (doctorTodayAptCount > 0 ? `${doctorTodayAptCount}` : undefined),
      badgeColor: doctorWaitingCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-[#F76762]/10 text-[#F76762]',
    },
    {
      id: 'patients',
      label: 'Patients',
      route: '/doctor/patients',
      icon: Users,
    },
    {
      id: 'consultations',
      label: 'Consultations',
      route: '/doctor/consultations',
      icon: Stethoscope,
    },
    {
      id: 'prescriptions',
      label: 'Prescriptions',
      route: '/doctor/prescriptions',
      icon: FileText,
    },
    {
      id: 'charges',
      label: 'Charges',
      route: '/doctor/charges',
      icon: Receipt,
    },
    {
      id: 'history',
      label: 'Patient History',
      route: '/doctor/history',
      icon: History,
    },
    {
      id: 'followups',
      label: 'Follow-ups',
      route: '/doctor/follow-ups',
      icon: Repeat,
      badge: doctorFollowUpCount > 0 ? `${doctorFollowUpCount}` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'reports',
      label: 'Reports',
      route: '/doctor/reports',
      icon: BarChart3,
    },
  ];

  const handleNavClick = (route: string) => {
    onNavigate(route);
    onCloseMobile();
  };

  const isItemActive = (route: string) => {
    if (route === '/doctor/dashboard') {
      return currentRoute === '/doctor' || currentRoute === '/doctor/dashboard';
    }
    return currentRoute.startsWith(route);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#18212F]/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50
          bg-white border-r border-[#F1E4E1]
          flex flex-col justify-between
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-18' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Top: Brand Wordmark & Collapse Toggle */}
        <div className={`h-18 sm:h-20 border-b border-[#F1E4E1] flex items-center transition-all ${isCollapsed ? 'justify-center px-2 relative' : 'justify-between px-4'}`}>
          {!isCollapsed && (
            <>
              <button
                onClick={() => handleNavClick('/doctor/dashboard')}
                className="flex items-center gap-2.5 text-[#18212F] text-left cursor-pointer group min-w-0"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-extrabold tracking-tight text-[#18212F] leading-tight">
                    Aura<span className="text-[#F76762]">CMS</span>
                  </div>
                  <div className="text-[10.5px] font-bold tracking-wider text-[#475467] uppercase whitespace-nowrap leading-none mt-1">
                    Doctor Workstation
                  </div>
                </div>
              </button>

              {/* Desktop Collapse Toggle */}
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-[#667085] hover:text-[#18212F] hover:bg-[#FFF9F7] border border-transparent hover:border-[#F1E4E1] transition-all cursor-pointer shrink-0"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}

          {isCollapsed && (
            <div className="flex items-center justify-center relative w-full">
              <button
                onClick={() => handleNavClick('/doctor/dashboard')}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white shadow-xs hover:scale-105 transition-transform cursor-pointer"
                title="AuraCMS Doctor Workstation"
              >
                <HeartPulse className="w-5 h-5" />
              </button>

              {/* Desktop Expand Toggle */}
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-[#F1E4E1] shadow-xs items-center justify-center text-[#667085] hover:text-[#18212F] hover:border-[#F76762] transition-all cursor-pointer z-50"
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Mobile Close Button */}
          {!isCollapsed && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#667085] hover:text-[#18212F] hover:bg-[#FFF9F7] cursor-pointer shrink-0"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Middle: Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-xs font-bold text-[#667085] tracking-wider uppercase">
              Clinical Navigation
            </div>
          )}

          {navigationItems.map((item) => {
            const active = isItemActive(item.route);
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.route)}
                title={isCollapsed ? item.label : undefined}
                className={`
                  w-full flex items-center rounded-xl text-sm font-semibold
                  transition-all duration-150 cursor-pointer group relative
                  ${isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5 gap-3'}
                  ${
                    active
                      ? 'bg-[#F76762]/10 text-[#F76762] font-bold border-l-3 border-[#F76762]'
                      : 'text-[#667085] hover:text-[#18212F] hover:bg-[#FFF9F7]'
                  }
                `}
              >
                <Icon
                  className={`
                    w-4 h-4 shrink-0 transition-transform group-hover:scale-105
                    ${active ? 'text-[#F76762]' : 'text-[#667085] group-hover:text-[#18212F]'}
                  `}
                />

                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">
                    {item.label}
                  </span>
                )}

                {!isCollapsed && item.badge && (
                  <span
                    className={`
                      px-2 py-0.5 rounded-full text-xs font-bold shrink-0
                      ${item.badgeColor || 'bg-[#F76762]/10 text-[#F76762]'}
                    `}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <span className="sr-only">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section: Logout */}
        <div className="p-3 border-t border-[#F1E4E1] space-y-1">
          <button
            onClick={onLogout}
            title={isCollapsed ? 'Logout' : undefined}
            className={`
              w-full flex items-center rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer
              ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-3'}
            `}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
