import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CalendarPlus, 
  Zap, 
  Wallet, 
  Edit3, 
  Clock, 
  FileText, 
  CreditCard, 
  Activity, 
  Phone, 
  MapPin, 
  AlertTriangle,
  Heart,
  Shield,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { Patient, Bill } from '../../../types/reception';
import { EditBillModal } from '../modals/EditBillModal';
import { getPatientAgeDisplay } from '../../../utils/validation';

interface PatientProfileViewProps {
  patientId: string;
  onBack: () => void;
  onBookAppointment: (patientId: string) => void;
  onWalkIn: (patientId: string) => void;
  onCollectPayment: () => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  patientId,
  onBack,
  onBookAppointment,
  onWalkIn,
  onCollectPayment,
}) => {
  const { patients, appointments, bills, timeline } = useReception();
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'timeline' | 'payments' | 'prescriptions'>('overview');
  const [selectedBillForEdit, setSelectedBillForEdit] = useState<Bill | null>(null);

  const patient = patients.find(p => p.id === patientId);

  if (!patient) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-[#F1E4E1] text-center space-y-3">
        <h3 className="text-base font-bold text-[#18212F]">Patient Record Not Found</h3>
        <p className="text-xs text-[#667085]">The requested UHID or record may have been archived.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#F76762] text-white rounded-xl text-xs font-semibold"
        >
          Return to Patient Directory
        </button>
      </div>
    );
  }

  const patientAppointments = appointments.filter(a => a.patientId === patient.id);
  const patientBills = bills.filter(b => b.patientId === patient.id);
  const patientTimeline = timeline.filter(t => t.patientId === patient.id);

  return (
    <div className="space-y-5 text-xs">
      
      {/* Top Breadcrumb & Return */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#18212F] bg-white border border-[#F1E4E1] py-1.5 px-3 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Patients</span>
        </button>

        <span className="text-[11px] text-[#667085] font-mono">
          Registered: {patient.registeredAt}
        </span>
      </div>

      {/* Patient Profile Card Header */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F76762] to-[#FB866E] text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-sm">
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-extrabold text-[#18212F] tracking-tight">
                  {patient.fullName}
                </h1>
                <span className="font-mono font-bold text-xs bg-[#F76762]/10 text-[#F76762] px-2.5 py-0.5 rounded-full border border-[#F76762]/20">
                  {patient.uhid}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[#667085] text-xs">
                <span>{getPatientAgeDisplay(patient)} · {patient.gender}</span>
                <span>•</span>
                <span className="font-mono">{patient.mobile}</span>
                <span>•</span>
                <span>Blood: <strong className="text-[#18212F]">{patient.bloodGroup || 'N/A'}</strong></span>
                <span>•</span>
                <span>{patient.city || 'Metro City'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons on Profile */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <button
              onClick={() => onBookAppointment(patient.id)}
              className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-[#18212F] border border-[#F1E4E1] rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-blue-500" />
              <span>Book Appointment</span>
            </button>
            <button
              onClick={() => onWalkIn(patient.id)}
              className="px-3.5 py-2 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-2xs hover:opacity-90 transition-all cursor-pointer text-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Walk-in Check-in</span>
            </button>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-t border-[#F1E4E1] mt-5 pt-3 overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'Overview & Medical Profile', icon: Activity },
            { id: 'timeline', label: `Timeline Journey (${patientTimeline.length})`, icon: Clock },
            { id: 'appointments', label: `Appointments (${patientAppointments.length})`, icon: Calendar },
            { id: 'payments', label: `Billing & Invoices (${patientBills.length})`, icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#18212F] text-white'
                  : 'text-[#667085] hover:text-[#18212F] hover:bg-[#FFF9F7]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Medical Alerts & Allergies */}
          <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-xs text-[#18212F] uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Medical Alerts & Allergies</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wide">
                  Known Drug & Food Allergies:
                </div>
                <div className="font-bold text-amber-900 mt-1">
                  {patient.allergies || 'No known allergies reported.'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF9F7] border border-[#F1E4E1]">
                <div className="text-[10px] uppercase font-bold text-[#667085] tracking-wide">
                  Existing Medical Conditions:
                </div>
                <div className="font-semibold text-[#18212F] mt-1">
                  {patient.medicalConditions || 'No chronic conditions reported.'}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact & Demographics */}
          <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-xs text-[#18212F] uppercase tracking-wide">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Emergency Contact & Details</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#FFF9F7] border border-[#F1E4E1] space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#667085]">Emergency Contact</div>
                <div className="font-bold text-[#18212F]">{patient.emergencyContact.name} ({patient.emergencyContact.relationship})</div>
                <div className="font-mono text-[#667085]">{patient.emergencyContact.phone}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF9F7] border border-[#F1E4E1] space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#667085]">Residential Address</div>
                <div className="font-medium text-[#18212F]">{patient.address || 'Address not recorded'}</div>
                <div className="text-[#667085]">{patient.city}, Postal Area</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CHRONOLOGICAL TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-[#F1E4E1] p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-[#18212F]">Patient Clinic Journey Timeline</h3>
            <p className="text-[11px] text-[#667085]">Chronological record of clinic arrivals, consultations, and payment collections</p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#F1E4E1]">
            {patientTimeline.length === 0 ? (
              <div className="py-4 text-[#667085]">No activity logged yet.</div>
            ) : (
              patientTimeline.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#F76762] border-2 border-white shadow-xs" />
                  <div className="bg-[#FFF9F7] p-3.5 rounded-xl border border-[#F1E4E1]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#18212F]">{item.title}</span>
                      <span className="text-[10px] text-[#667085] font-mono">{item.timestamp}</span>
                    </div>
                    <p className="text-[#667085] text-xs mt-1">{item.description}</p>
                    <div className="text-[10px] text-[#667085] mt-2 pt-1 border-t border-[#F1E4E1]/80">
                      Logged by: <strong className="text-[#18212F]">{item.actorName}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm text-[#18212F]">Appointment History</h3>
            <button
              onClick={() => onBookAppointment(patient.id)}
              className="px-3 py-1.5 bg-[#F76762] text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Book New
            </button>
          </div>

          <div className="divide-y divide-[#F1E4E1]">
            {patientAppointments.length === 0 ? (
              <div className="py-6 text-center text-[#667085]">No appointments found for this patient.</div>
            ) : (
              patientAppointments.map((apt) => (
                <div key={apt.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#18212F] flex items-center gap-2">
                      <span>{apt.date} · {apt.time}</span>
                      <span className="font-mono text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded">{apt.type}</span>
                    </div>
                    <div className="text-[#667085] text-xs mt-0.5">{apt.doctorName} · {apt.reason}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF9F7] border border-[#F1E4E1] text-[#18212F]">
                    {apt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BILLING & INVOICES */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm text-[#18212F]">Financial Invoices & Payment Receipts</h3>
            <button
              onClick={onCollectPayment}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Open Payment Desk
            </button>
          </div>

          <div className="divide-y divide-[#F1E4E1]">
            {patientBills.length === 0 ? (
              <div className="py-6 text-center text-[#667085]">No billing records found.</div>
            ) : (
              patientBills.map((b) => (
                <div key={b.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-mono font-bold text-xs text-[#18212F]">{b.billNumber} · {b.createdAt}</div>
                    <div className="text-[11px] text-[#667085] mt-0.5">
                      Services: {b.charges.map(c => `${c.serviceName} (₹${c.amount})`).join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="font-bold font-mono text-[#18212F]">₹{b.totalAmount.toFixed(2)}</div>
                      <div className="text-[10px] text-emerald-600 font-medium">Paid: ₹{b.paidAmount.toFixed(2)}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      b.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {b.status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => setSelectedBillForEdit(b)}
                      className="px-2.5 py-1 bg-white hover:bg-[#FFF9F7] text-[#18212F] hover:text-[#F76762] border border-[#F1E4E1] hover:border-[#F76762]/40 rounded-lg font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                      title="Edit this invoice"
                    >
                      <Edit3 className="w-3 h-3 text-[#F76762]" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Bill Modal */}
      {selectedBillForEdit && (
        <EditBillModal
          bill={selectedBillForEdit}
          onClose={() => setSelectedBillForEdit(null)}
          onSuccess={() => setSelectedBillForEdit(null)}
        />
      )}

    </div>
  );
};
