import React, { useState } from 'react';
import { ReceptionSidebar } from './sidebar/ReceptionSidebar';
import { ReceptionHeader } from './header/ReceptionHeader';

interface ReceptionLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  onOpenRegisterModal: () => void;
  onOpenWalkInModal: () => void;
  children: React.ReactNode;
}

export const ReceptionLayout: React.FC<ReceptionLayoutProps> = ({
  currentRoute,
  onNavigate,
  onLogout,
  onOpenRegisterModal,
  onOpenWalkInModal,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Compute page title & description based on route
  const getHeaderInfo = (route: string) => {
    if (route.startsWith('/reception/patients/')) {
      return {
        title: 'Patient Electronic Health Profile',
        description: 'Comprehensive patient demographics, visit history, billing, and journey timeline',
      };
    }

    switch (route) {
      case '/reception':
      case '/reception/dashboard':
        return {
          title: 'Reception Daily Command Center',
          description: 'Front-desk operations, real-time doctor availability, queue status, and today\'s consultations',
        };
      case '/reception/patients':
        return {
          title: 'Master Patient Records',
          description: 'Electronic patient directory with fast search by UHID, patient name, and mobile number',
        };
      case '/reception/appointments':
      case '/reception/calendar':
        return {
          title: 'Clinical Appointment Calendar',
          description: 'Manage doctor-validated consultation slots, patient check-ins, and schedule modifications',
        };
      case '/reception/queue':
        return {
          title: 'Live Doctor Queue Board',
          description: 'Multi-doctor waiting lounge orchestration, live tokens, and calling room active status',
        };
      case '/reception/payments':
        return {
          title: 'Payment Desk & Receipts',
          description: 'Itemized clinic charges, partial payment collection, and instant receipt generation',
        };
      case '/reception/patient-history':
        return {
          title: 'Patient Historical Records',
          description: 'Look up past visits, previous prescriptions, payment receipts, and follow-up history',
        };
      case '/reception/follow-ups':
        return {
          title: 'Patient Follow-up Care & Monitoring',
          description: 'Front-desk tracking of doctor-allocated review dates, patient contact outreach, and revisit scheduling',
        };
      case '/reception/reports':
        return {
          title: 'Daily Shift & Revenue Reports',
          description: 'Front desk intake, doctor workload throughput, and payment method reconciliations',
        };
      default:
        return {
          title: 'Clinic Reception Portal',
          description: 'Front-desk medical management workspace',
        };
    }
  };

  const { title, description } = getHeaderInfo(currentRoute);

  return (
    <div className="min-h-screen bg-[#FFF9F7] text-[#18212F] flex flex-col antialiased selection:bg-[#F76762]/20 selection:text-[#F76762]">
      
      {/* Collapsible Left Sidebar */}
      <ReceptionSidebar
        currentRoute={currentRoute}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onNavigate={onNavigate}
        onOpenRegisterModal={onOpenRegisterModal}
        onOpenWalkInModal={onOpenWalkInModal}
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
        <ReceptionHeader
          title={title}
          description={description}
          onToggleSidebarMobile={() => setIsMobileSidebarOpen(true)}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
};
