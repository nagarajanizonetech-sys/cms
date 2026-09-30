import React, { useState } from 'react';
import { DoctorSidebar } from './sidebar/DoctorSidebar';
import { DoctorHeader } from './header/DoctorHeader';

interface DoctorLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const DoctorLayout: React.FC<DoctorLayoutProps> = ({
  currentRoute,
  onNavigate,
  onLogout,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Compute page title & description based on route
  const getHeaderInfo = (route: string) => {
    if (route.startsWith('/doctor/consultation/')) {
      return {
        title: 'Active Clinical Consultation',
        description: 'Vitals, symptoms, clinical examination, charges, digital prescription & follow-up',
      };
    }

    switch (route) {
      case '/doctor':
      case '/doctor/dashboard':
        return {
          title: "Today's Clinical Command Center",
          description: "Patient queue, active consults, remaining slots, and priority clinical tasks",
        };
      case '/doctor/queue':
      case '/doctor/appointments':
        return {
          title: 'Patient Appointments & Live Queue',
          description: 'Checked-in waiting lounge patients, scheduled time slots, and direct consultation entry',
        };
      case '/doctor/patients':
        return {
          title: 'My Clinical Patient Directory',
          description: 'Electronic medical profiles, longitudinal health history, and previous visits',
        };
      case '/doctor/consultations':
        return {
          title: 'Consultation Records',
          description: 'Chronological clinical visit notes, diagnoses, and documented examination findings',
        };
      case '/doctor/prescriptions':
        return {
          title: 'Prescription Workspace & History',
          description: 'Digital A4 prescriptions issued, active medication courses, and printable formats',
        };
      case '/doctor/charges':
        return {
          title: 'Doctor Service Charges & Collections',
          description: 'Services ordered in room, doctor-collected payments, and pending front-desk charges',
        };
      case '/doctor/history':
        return {
          title: 'Patient Clinical History & Timeline',
          description: 'Longitudinal consultation records, past vitals progression, and therapeutic history',
        };
      case '/doctor/follow-ups':
        return {
          title: 'Follow-up Care & Monitoring',
          description: 'Review dates, chronic disease re-evaluations, and overdue patient monitoring',
        };
      case '/doctor/reports':
        return {
          title: 'Clinical Care & Throughput Reports',
          description: 'Daily consultations completed, average consultation duration, and follow-up metrics',
        };
      default:
        return {
          title: 'Doctor Clinical Workspace',
          description: 'Professional physician suite',
        };
    }
  };

  const { title, description } = getHeaderInfo(currentRoute);

  return (
    <div className="min-h-screen bg-[#FFF9F7] text-[#18212F] flex flex-col antialiased selection:bg-[#F76762]/20 selection:text-[#F76762]">
      
      {/* Collapsible Left Sidebar */}
      <DoctorSidebar
        currentRoute={currentRoute}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* Main Workspace Frame */}
      <div 
        className={`
          flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'lg:pl-18' : 'lg:pl-64'}
        `}
      >
        {/* Top Header */}
        <DoctorHeader
          title={title}
          description={description}
          onToggleSidebarMobile={() => setIsMobileSidebarOpen(true)}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        {/* View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
};
