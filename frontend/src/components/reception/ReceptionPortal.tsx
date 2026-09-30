import React, { useState } from 'react';
import { ReceptionProvider, ReceptionContext } from '../../context/ReceptionContext';
import { ReceptionLayout } from './ReceptionLayout';
import { ReceptionDashboard } from './views/ReceptionDashboard';
import { PatientDirectoryView } from './views/PatientDirectoryView';
import { PatientProfileView } from './views/PatientProfileView';
import { AppointmentsView } from './views/AppointmentsView';
import { QueueView } from './views/QueueView';
import { PaymentDeskView } from './views/PaymentDeskView';
import { PatientHistoryView } from './views/PatientHistoryView';
import { ReceptionFollowUpsView } from './views/ReceptionFollowUpsView';
import { ReportsView } from './views/ReportsView';
import { PatientRegistrationModal } from './modals/PatientRegistrationModal';
import { NewAppointmentModal } from './modals/NewAppointmentModal';
import { WalkInModal } from './modals/WalkInModal';
import { Patient } from '../../types/reception';

interface ReceptionPortalProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const ReceptionPortalContent: React.FC<ReceptionPortalProps> = ({
  currentPath,
  onNavigate,
  onLogout,
}) => {
  // Modal states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [preselectedPatientId, setPreselectedPatientId] = useState<string | undefined>(undefined);
  const [preselectedDoctorId, setPreselectedDoctorId] = useState<string | undefined>(undefined);
  const [preselectedDate, setPreselectedDate] = useState<string | undefined>(undefined);

  // Handlers
  const handleOpenAppointmentModal = (patientId?: string, date?: string) => {
    setPreselectedPatientId(patientId);
    setPreselectedDate(date);
    setIsAppointmentModalOpen(true);
  };

  const handleOpenWalkInModal = (patientId?: string, doctorId?: string) => {
    setPreselectedPatientId(patientId);
    setPreselectedDoctorId(doctorId);
    setIsWalkInModalOpen(true);
  };

  const handleSelectPatient = (patientId: string) => {
    onNavigate(`/reception/patients/${patientId}`);
  };

  // Route extraction
  const renderCurrentView = () => {
    if (currentPath.startsWith('/reception/patients/')) {
      const patientId = currentPath.replace('/reception/patients/', '');
      return (
        <PatientProfileView
          patientId={patientId}
          onBack={() => onNavigate('/reception/patients')}
          onBookAppointment={(id) => handleOpenAppointmentModal(id)}
          onWalkIn={(id) => handleOpenWalkInModal(id)}
          onCollectPayment={() => onNavigate('/reception/payments')}
        />
      );
    }

    switch (currentPath) {
      case '/reception':
      case '/reception/dashboard':
        return (
          <ReceptionDashboard
            onNavigate={onNavigate}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
            onOpenWalkInModal={() => handleOpenWalkInModal()}
            onOpenAppointmentModal={() => handleOpenAppointmentModal()}
          />
        );
      case '/reception/patients':
        return (
          <PatientDirectoryView
            onSelectPatient={handleSelectPatient}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
            onBookAppointment={(id) => handleOpenAppointmentModal(id)}
            onWalkIn={(id) => handleOpenWalkInModal(id)}
          />
        );
      case '/reception/appointments':
      case '/reception/calendar':
        return (
          <AppointmentsView
            initialView={currentPath === '/reception/calendar' ? 'calendar' : 'list'}
            onOpenNewAppointmentModal={(date) => handleOpenAppointmentModal(undefined, date)}
            onSelectPatient={handleSelectPatient}
          />
        );
      case '/reception/queue':
        return (
          <QueueView
            onOpenWalkInModal={(docId) => handleOpenWalkInModal(undefined, docId)}
            onSelectPatient={handleSelectPatient}
          />
        );
      case '/reception/payments':
        return (
          <PaymentDeskView
            onSelectPatient={handleSelectPatient}
          />
        );
      case '/reception/patient-history':
        return (
          <PatientHistoryView
            onSelectPatient={handleSelectPatient}
          />
        );
      case '/reception/follow-ups':
        return (
          <ReceptionFollowUpsView
            onSelectPatient={handleSelectPatient}
            onBookAppointment={(patientId, date) => handleOpenAppointmentModal(patientId, date)}
          />
        );
      case '/reception/reports':
        return (
          <ReportsView />
        );
      default:
        return (
          <ReceptionDashboard
            onNavigate={onNavigate}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
            onOpenWalkInModal={() => handleOpenWalkInModal()}
            onOpenAppointmentModal={() => handleOpenAppointmentModal()}
          />
        );
    }
  };

  return (
    <ReceptionLayout
      currentRoute={currentPath}
      onNavigate={onNavigate}
      onLogout={onLogout}
      onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
      onOpenWalkInModal={() => handleOpenWalkInModal()}
    >
      {renderCurrentView()}

      {/* Global Modals */}
      {isRegisterModalOpen && (
        <PatientRegistrationModal
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={(newPatient: Patient) => {
            onNavigate(`/reception/patients/${newPatient.id}`);
          }}
        />
      )}

      {isAppointmentModalOpen && (
        <NewAppointmentModal
          onClose={() => {
            setIsAppointmentModalOpen(false);
            setPreselectedPatientId(undefined);
            setPreselectedDate(undefined);
          }}
          preselectedPatientId={preselectedPatientId}
          preselectedDate={preselectedDate}
          onSuccess={() => {
            onNavigate('/reception/appointments');
          }}
        />
      )}

      {isWalkInModalOpen && (
        <WalkInModal
          preselectedPatientId={preselectedPatientId}
          preselectedDoctorId={preselectedDoctorId}
          onClose={() => {
            setIsWalkInModalOpen(false);
            setPreselectedPatientId(undefined);
            setPreselectedDoctorId(undefined);
          }}
          onSuccess={() => {
            onNavigate('/reception/queue');
          }}
        />
      )}
    </ReceptionLayout>
  );
};

export const ReceptionPortal: React.FC<ReceptionPortalProps> = (props) => {
  const context = React.useContext(ReceptionContext);
  if (context) {
    return <ReceptionPortalContent {...props} />;
  }
  return (
    <ReceptionProvider>
      <ReceptionPortalContent {...props} />
    </ReceptionProvider>
  );
};
