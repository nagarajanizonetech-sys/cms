import React, { useRef, useEffect } from 'react';
import { Bell, Check, Clock, Calendar, AlertCircle, CreditCard, Stethoscope, ChevronRight } from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { ClinicNotification } from '../../../types/reception';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  title?: string;
  portal?: 'reception' | 'doctor';
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onClose,
  onNavigate,
  title,
  portal = 'reception',
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useReception();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: ClinicNotification['type']) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'queue':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'doctor':
        return <Stethoscope className="w-4 h-4 text-[#F76762]" />;
      default:
        return <AlertCircle className="w-4 h-4 text-purple-500" />;
    }
  };

  const handleItemClick = (n: ClinicNotification) => {
    markNotificationAsRead(n.id);
    if (n.linkRoute) {
      let target = n.linkRoute;
      if (portal === 'doctor') {
        if (target.startsWith('/reception/appointments') || target.startsWith('/reception/queue')) {
          target = '/doctor/appointments';
        } else if (target.startsWith('/reception/patients')) {
          target = '/doctor/patients';
        } else if (target.startsWith('/reception/')) {
          target = '/doctor/appointments';
        }
      }
      onNavigate(target);
      onClose();
    }
  };

  const displayTitle = title || (portal === 'doctor' ? 'Doctor Notifications' : 'Clinic Notifications');
  const footerButtonText = portal === 'doctor' ? "View Today's Appointments & Queue" : 'View Live Clinic Queue';
  const footerTargetRoute = portal === 'doctor' ? '/doctor/appointments' : '/reception/queue';

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl border border-[#F1E4E1] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-xs"
    >
      {/* Header */}
      <div className="p-3.5 bg-[#FFF9F7] border-b border-[#F1E4E1] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#F76762]" />
          <span className="font-bold text-[#18212F]">{displayTitle}</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#F76762] text-white text-[10px] font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="text-[11px] text-[#F76762] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <Check className="w-3 h-3" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#F1E4E1]">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-[#667085]">
            <p className="font-medium">All caught up!</p>
            <p className="text-[11px]">No active operational notifications.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                n.read ? 'bg-white hover:bg-[#FFF9F7]' : 'bg-[#FFF9F7]/70 hover:bg-[#FFF9F7]'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-[#F1E4E1] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs truncate ${n.read ? 'font-semibold text-[#18212F]' : 'font-bold text-[#18212F]'}`}>
                    {n.title}
                  </span>
                  <span className="text-[10px] text-[#667085] shrink-0 font-mono">{n.timestamp}</span>
                </div>
                <p className="text-[11px] text-[#667085] mt-0.5 leading-snug line-clamp-2">
                  {n.message}
                </p>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-[#F76762] shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-[#FFF9F7] border-t border-[#F1E4E1] text-center">
        <button
          onClick={() => {
            onNavigate(footerTargetRoute);
            onClose();
          }}
          className="text-[11px] text-[#667085] hover:text-[#18212F] font-semibold flex items-center justify-center gap-1 w-full cursor-pointer"
        >
          <span>{footerButtonText}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
