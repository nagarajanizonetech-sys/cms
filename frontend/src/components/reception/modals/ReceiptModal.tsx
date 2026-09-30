import React from 'react';
import { Printer, X, CheckCircle2, Stethoscope, FileText, Download } from 'lucide-react';
import { Bill, PaymentRecord, ServiceChargeItem } from '../../../types/reception';

interface ReceiptModalProps {
  bill: Bill;
  payment: PaymentRecord;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ bill, payment, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18212F]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#F1E4E1] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Action Header (Non-printable controls) */}
        <div className="p-4 border-b border-[#F1E4E1] flex items-center justify-between bg-[#FFF9F7] print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#18212F]">Payment Received & Receipt Generated</div>
              <div className="text-[11px] text-[#667085]">Receipt #{payment.receiptNumber}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#18212F] hover:bg-[#2B3545] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#667085] hover:text-[#18212F] rounded-lg hover:bg-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[#18212F] print:p-0">
          
          {/* Clinic Header */}
          <div className="flex justify-between items-start border-b border-[#F1E4E1] pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F76762] to-[#FB866E] text-white flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="text-base font-extrabold tracking-tight text-[#18212F]">
                  Aura<span className="text-[#F76762]">Clinic</span>
                </div>
              </div>
              <div className="text-[11px] text-[#667085]">
                Primary Care & Outpatient Medical Centre
              </div>
              <div className="text-[11px] text-[#667085]">
                100 Medical Center Blvd · Suite 101 · Metro City
              </div>
              <div className="text-[11px] text-[#667085]">
                Phone: +1 (555) 019-2831 · reception@auraclinic.com
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-mono font-bold border border-emerald-200">
                OFFICIAL RECEIPT
              </span>
              <div className="mt-1.5 text-xs font-mono text-[#667085]">
                #{payment.receiptNumber}
              </div>
              <div className="text-[11px] text-[#667085]">
                Date: {payment.paidAt}
              </div>
            </div>
          </div>

          {/* Patient & Bill Information */}
          <div className="grid grid-cols-2 gap-4 bg-[#FFF9F7] p-3.5 rounded-xl border border-[#F1E4E1] text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-[#667085] tracking-wider">Patient Details</div>
              <div className="font-bold text-[#18212F] mt-0.5">{bill.patientName}</div>
              <div className="text-[#667085] font-mono text-[11px]">UHID: {bill.patientUhid}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#667085] tracking-wider">Billing Reference</div>
              <div className="font-mono text-[#18212F] font-semibold mt-0.5">{bill.billNumber}</div>
              <div className="text-[#667085] text-[11px]">Created By: {bill.createdByName}</div>
            </div>
          </div>

          {/* Itemized Service Charges */}
          <div>
            <div className="text-xs font-bold text-[#18212F] mb-2 uppercase tracking-wide">
              Services & Procedures Rendered
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#F1E4E1] text-left text-[#667085]">
                  <th className="py-2 font-semibold">Service Description</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1E4E1]">
                {bill.charges.map((charge: ServiceChargeItem) => (
                  <tr key={charge.id}>
                    <td className="py-2.5">
                      <div className="font-medium text-[#18212F]">{charge.serviceName}</div>
                      {charge.notes && (
                        <div className="text-[11px] text-[#667085]">{charge.notes}</div>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-mono font-medium text-[#18212F]">
                      ₹{charge.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Breakdown */}
          <div className="border-t border-[#F1E4E1] pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-[#667085]">
              <span>Total Service Charges</span>
              <span className="font-mono">₹{bill.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-[#18212F] text-sm pt-1 border-t border-[#F1E4E1]">
              <span>Amount Paid This Receipt</span>
              <span className="font-mono text-[#F76762]">₹{payment.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#667085] text-[11px]">
              <span>Payment Method</span>
              <span className="font-medium text-[#18212F]">{payment.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-[#667085] text-[11px]">
              <span>Remaining Balance</span>
              <span className="font-mono font-semibold text-[#18212F]">₹{bill.balanceAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Collector Ownership & Signature */}
          <div className="pt-4 border-t border-dashed border-[#F1E4E1] flex justify-between items-end text-[11px]">
            <div>
              <div className="text-[#667085]">Payment Collected By:</div>
              <div className="font-bold text-[#18212F]">{payment.collectorName} ({payment.collectedBy})</div>
              {payment.note && <div className="text-[#667085] italic mt-0.5">Note: {payment.note}</div>}
            </div>
            <div className="text-right">
              <div className="w-32 border-b border-[#18212F] mb-1"></div>
              <div className="text-[10px] text-[#667085]">Authorized Signature</div>
            </div>
          </div>

          {/* Receipt Footer Notice */}
          <div className="text-center text-[10px] text-[#667085] pt-2">
            Thank you for choosing AuraClinic. Please retain this receipt for insurance and reimbursement claims.
          </div>

        </div>

        {/* Modal Close Button */}
        <div className="p-3 bg-[#FFF9F7] border-t border-[#F1E4E1] flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-neutral-50 text-[#18212F] border border-[#F1E4E1] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Done & Close
          </button>
        </div>

      </div>
    </div>
  );
};
