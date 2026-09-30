import React, { useRef } from 'react';
import { X, Printer, Stethoscope, Download, CheckCircle2, ShieldCheck, Plus } from 'lucide-react';
import { Prescription } from '../../../types/doctor';
import { useReception } from '../../../context/ReceptionContext';

interface PrescriptionA4ModalProps {
  prescription: Prescription | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrescriptionA4Modal: React.FC<PrescriptionA4ModalProps> = ({
  prescription,
  isOpen,
  onClose,
}) => {
  const { printPrescription } = useReception();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !prescription) return null;

  const handlePrint = () => {
    printPrescription(prescription.id);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#18212F]/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white animate-in fade-in duration-150">
      
      {/* Modal Dialog Container */}
      <div className="bg-[#FFF9F7] rounded-3xl border border-[#F1E4E1] shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="px-6 py-4 bg-white border-b border-[#F1E4E1] flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white shadow-xs">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#18212F]">
                Standardized Clinical Prescription Preview
              </h2>
              <p className="text-[11px] text-[#667085]">
                A4 Medical Record Format · Ready for Patient Print & Dispensing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white text-xs font-semibold rounded-xl hover:opacity-95 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Prescription</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#667085] hover:text-[#18212F] hover:bg-[#FFF9F7] rounded-xl border border-[#F1E4E1] cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable A4 Sheet Body */}
        <div className="p-4 sm:p-8 overflow-y-auto flex justify-center print:p-0 print:overflow-visible">
          
          {/* Real A4 Prescription Paper Card */}
          <div 
            ref={printRef}
            className="w-full max-w-[760px] bg-white rounded-2xl border border-[#F1E4E1] p-8 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-6 print:w-full text-[#18212F] relative"
            style={{ minHeight: '900px' }}
          >
            
            {/* Header: Clinic Logo & Doctor Info */}
            <div className="border-b-2 border-[#18212F] pb-4 flex justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F76762] text-white flex items-center justify-center font-bold text-sm">
                    +
                  </div>
                  <div>
                    <span className="text-base font-extrabold text-[#18212F] tracking-tight uppercase block leading-tight">
                      AuraCare Community Health Clinic
                    </span>
                    <span className="text-[10px] font-semibold text-[#F76762] tracking-wider uppercase">
                      Clinical Excellence & Family Health Center
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-[#667085] leading-relaxed pt-1">
                  104 Medical Plaza Blvd, Suite 2A · Phone: +1 (555) 019-4820 · License #MED-2026-9921
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[11px] font-mono text-[#667085]">Rx ID: <span className="font-bold text-[#18212F]">{prescription.rxNumber}</span></div>
                <div className="text-xs font-semibold text-[#18212F] mt-0.5">{prescription.date}</div>
                <div className="mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified Electronic Rx
                </div>
              </div>
            </div>

            {/* Attending Doctor Line */}
            <div className="py-2.5 px-3.5 bg-[#FFF9F7] rounded-xl border border-[#F1E4E1] my-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-[#667085] text-[11px]">Attending Physician: </span>
                <span className="font-bold text-[#18212F]">{prescription.doctorName}</span>
                <span className="text-[#667085] text-[11px] ml-2">({prescription.doctorSpecialization})</span>
              </div>
              <div className="text-[11px] text-[#667085] font-medium">
                {prescription.doctorRoom}
              </div>
            </div>

            {/* Patient Metadata Grid */}
            <div className="mb-5 py-2.5 px-3.5 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#667085] uppercase tracking-wider block">Patient Name:</span>
                <span className="font-bold text-[#18212F]">{prescription.patientName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#667085] uppercase tracking-wider block">UHID:</span>
                <span className="font-mono font-bold text-[#18212F]">{prescription.patientUhid}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#667085] uppercase tracking-wider block">Age / Gender:</span>
                <span className="font-medium text-[#18212F]">{prescription.patientAge} Years · {prescription.patientGender}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#667085] uppercase tracking-wider block">Date of Service:</span>
                <span className="font-medium text-[#18212F]">{prescription.date}</span>
              </div>
            </div>

            {/* Clinical Diagnosis Section */}
            {prescription.diagnoses && prescription.diagnoses.length > 0 && (
              <div className="mb-6 p-3 rounded-xl bg-[#FFF9F7] border border-[#F1E4E1]">
                <div className="text-[10px] font-bold text-[#F76762] uppercase tracking-wider mb-1">
                  Clinical Diagnosis
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {prescription.diagnoses.map((diag, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 bg-white border border-[#F1E4E1] text-xs font-semibold text-[#18212F] rounded-lg shadow-2xs"
                    >
                      {diag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rx Heading & Medication Table */}
            <div className="my-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-serif font-black text-[#F76762] leading-none">℞</span>
                <div>
                  <h3 className="text-xs font-bold text-[#18212F] uppercase tracking-wider">
                    Prescribed Medications
                  </h3>
                  <span className="text-[10px] text-[#667085]">Take medications strictly as instructed by your attending physician</span>
                </div>
              </div>

              <div className="border border-[#F1E4E1] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FFF9F7] border-b border-[#F1E4E1] text-[10px] font-bold text-[#667085] uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Medicine & Strength</th>
                      <th className="py-2.5 px-3">Dosage</th>
                      <th className="py-2.5 px-3">Frequency</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Timing & Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1E4E1]">
                    {prescription.medicines.map((med, index) => (
                      <tr key={med.id || index} className="hover:bg-[#FFF9F7]/50 transition-colors">
                        <td className="py-3 px-3 text-[#667085] font-mono font-medium">{index + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#18212F]">{med.name}</div>
                          <div className="text-[10px] text-[#667085] font-mono">{med.strength} · {med.route}</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-[#18212F]">{med.dosage}</td>
                        <td className="py-3 px-3 font-semibold text-[#F76762] font-mono">{med.frequency}</td>
                        <td className="py-3 px-3 text-[#667085]">{med.duration}</td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-[#18212F]">{med.timing}</div>
                          {med.instructions && (
                            <div className="text-[10px] text-[#667085] italic">{med.instructions}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* General Advice & Lifestyle Instructions */}
            {prescription.generalAdvice && (
              <div className="my-5 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
                <div className="text-[10px] font-bold text-[#18212F] uppercase tracking-wider">
                  Physician Advice & Lifestyle Recommendations:
                </div>
                <p className="text-neutral-700 leading-relaxed text-[11px]">
                  {prescription.generalAdvice}
                </p>
                {prescription.dietAndLifestyle && (
                  <p className="text-neutral-600 text-[10px] italic pt-1 border-t border-neutral-200 mt-1">
                    Diet & Lifestyle: {prescription.dietAndLifestyle}
                  </p>
                )}
              </div>
            )}

            {/* Follow-up Note */}
            {prescription.followUpDate && (
              <div className="my-4 py-2 px-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between text-amber-900">
                <span className="font-semibold">Next Scheduled Follow-up:</span>
                <span className="font-bold">{prescription.followUpDate} {prescription.followUpNotes ? `(${prescription.followUpNotes})` : ''}</span>
              </div>
            )}

            {/* Prescription Footer & Signature Stamp */}
            <div className="mt-12 pt-6 border-t border-[#F1E4E1] flex justify-between items-end">
              <div className="space-y-1">
                <div className="text-[10px] text-[#667085] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F76762]" />
                  <span>Valid for 30 days from date of issue unless specified</span>
                </div>
                <div className="text-[9px] text-neutral-400 font-mono">
                  Electronically generated via AuraCMS Clinical Suite · Ref #{prescription.id}
                </div>
              </div>

              {/* Digital Doctor Signature Box */}
              <div className="text-right space-y-1">
                <div className="w-44 border-b border-dashed border-[#18212F] pb-2 font-serif italic text-sm text-[#18212F] text-center font-bold">
                  {prescription.doctorName}
                </div>
                <div className="text-[10px] font-bold text-[#18212F] text-center">
                  Medical Practitioner Seal
                </div>
                <div className="text-[9px] text-[#667085] text-center">
                  Registration #MCI-2026-7781
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
