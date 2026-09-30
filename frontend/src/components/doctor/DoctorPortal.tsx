import React from 'react';
import { DoctorLayout } from './DoctorLayout';
import { DoctorDashboard } from './views/DoctorDashboard';
import { ConsultationWorkspace } from './views/ConsultationWorkspace';
import { DoctorAppointmentsView } from './views/DoctorAppointmentsView';
import { DoctorPatientsView } from './views/DoctorPatientsView';
import { DoctorConsultationsView } from './views/DoctorConsultationsView';
import { DoctorPrescriptionsView } from './views/DoctorPrescriptionsView';
import { DoctorChargesView } from './views/DoctorChargesView';
import { DoctorHistoryView } from './views/DoctorHistoryView';
import { DoctorFollowUpsView } from './views/DoctorFollowUpsView';
import { DoctorReportsView } from './views/DoctorReportsView';

import { useReception, ReceptionProvider, ReceptionContext } from '../../context/ReceptionContext';

interface DoctorPortalProps {
  currentPath: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

const DoctorPortalContent: React.FC<DoctorPortalProps> = ({
  currentPath,
  onNavigate,
  onLogout,
}) => {
  const { currentDoctorId, setCurrentDoctorId } = useReception();

  // Sync active doctor from localStorage if login selected a specific doctor
  React.useEffect(() => {
    const savedId = localStorage.getItem('auracms_doctor_id');
    if (savedId && savedId !== currentDoctorId) {
      setCurrentDoctorId(savedId);
    }
  }, [currentDoctorId, setCurrentDoctorId]);

  // Render corresponding Doctor View
  const renderCurrentView = () => {
    // 1. Consultation Workspace (/doctor/consultation/:appointmentId)
    if (currentPath.startsWith('/doctor/consultation/')) {
      const parts = currentPath.split('/');
      const appointmentId = parts[parts.length - 1];
      return (
        <ConsultationWorkspace
          appointmentId={appointmentId}
          onNavigate={onNavigate}
        />
      );
    }

    if (currentPath.startsWith('/doctor/history/')) {
      const parts = currentPath.split('/');
      const patientId = parts[parts.length - 1];
      return <DoctorHistoryView initialPatientId={patientId} onNavigate={onNavigate} />;
    }

    switch (currentPath) {
      case '/doctor/queue':
      case '/doctor/appointments':
        return <DoctorAppointmentsView onNavigate={onNavigate} />;
      case '/doctor/patients':
        return <DoctorPatientsView onNavigate={onNavigate} />;
      case '/doctor/consultations':
        return <DoctorConsultationsView onNavigate={onNavigate} />;
      case '/doctor/prescriptions':
        return <DoctorPrescriptionsView onNavigate={onNavigate} />;
      case '/doctor/charges':
        return <DoctorChargesView onNavigate={onNavigate} />;
      case '/doctor/history':
        return <DoctorHistoryView onNavigate={onNavigate} />;
      case '/doctor/follow-ups':
        return <DoctorFollowUpsView onNavigate={onNavigate} />;
      case '/doctor/reports':
        return <DoctorReportsView onNavigate={onNavigate} />;
      case '/doctor':
      case '/doctor/dashboard':
      default:
        return <DoctorDashboard onNavigate={onNavigate} />;
    }
  };

  return (
    <DoctorLayout
      currentRoute={currentPath}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      {renderCurrentView()}
    </DoctorLayout>
  );
};

export const DoctorPortal: React.FC<DoctorPortalProps> = (props) => {
  const context = React.useContext(ReceptionContext);
  if (context) {
    return <DoctorPortalContent {...props} />;
  }
  return (
    <ReceptionProvider>
      <DoctorPortalContent {...props} />
    </ReceptionProvider>
  );
};
