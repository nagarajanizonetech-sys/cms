import React, { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Wallet, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  IndianRupee, 
  Clock, 
  ShieldCheck, 
  FileText,
  Sliders,
  Edit3
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { Bill, BillStatus, PaymentRecord } from '../../../types/reception';
import { CollectPaymentModal } from '../modals/CollectPaymentModal';
import { ReceiptModal } from '../modals/ReceiptModal';
import { SetDefaultFeeModal } from '../modals/SetDefaultFeeModal';
import { EditBillModal } from '../modals/EditBillModal';

interface PaymentDeskViewProps {
  onSelectPatient: (patientId: string) => void;
}

export const PaymentDeskView: React.FC<PaymentDeskViewProps> = ({ onSelectPatient }) => {
  const { bills, defaultConsultationFee } = useReception();

  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'paid'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [selectedBillForEdit, setSelectedBillForEdit] = useState<Bill | null>(null);
  const [isDefaultFeeModalOpen, setIsDefaultFeeModalOpen] = useState(false);
  const [receiptModalData, setReceiptModalData] = useState<{ bill: Bill; payment: PaymentRecord } | null>(null);

  // Financial aggregates
  const totalInvoiced = bills.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalCollected = bills.reduce((acc, b) => acc + b.paidAmount, 0);
  const totalPending = bills.reduce((acc, b) => acc + b.balanceAmount, 0);

  const filteredBills = bills.filter((b) => {
    // Tab filter
    if (activeTab === 'pending' && b.status === 'Paid') return false;
    if (activeTab === 'paid' && b.status !== 'Paid') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        b.patientName.toLowerCase().includes(q) ||
        b.patientUhid.toLowerCase().includes(q) ||
        b.billNumber.toLowerCase().includes(q) ||
        b.charges.some(c => c.serviceName.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const handleOpenCollect = (bill: Bill) => {
    setSelectedBillForPayment(bill);
  };

  const handlePaymentSuccess = (receipt: PaymentRecord) => {
    if (selectedBillForPayment) {
      // Find the refreshed bill state
      const currentBill = bills.find(b => b.id === selectedBillForPayment.id) || selectedBillForPayment;
      setSelectedBillForPayment(null);
      setReceiptModalData({ bill: currentBill, payment: receipt });
    }
  };

  const handleViewReceipt = (bill: Bill) => {
    if (bill.payments.length > 0) {
      setReceiptModalData({ bill, payment: bill.payments[bill.payments.length - 1] });
    }
  };

  return (
    <div className="space-y-6 text-xs">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#18212F] tracking-tight flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#F76762]" />
            <span>Front Desk Billing & Payment Desk</span>
          </h2>
          <p className="text-[11px] text-[#667085] mt-0.5">
            Collect itemized patient fees, track doctor-initiated charges, and issue receipts
          </p>
        </div>

        {/* Financial Badges & Action */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="bg-[#FFF9F7] px-3 py-1.5 rounded-xl border border-[#F1E4E1] hidden lg:block">
            <span className="text-[10px] text-[#667085] block">Default Fee</span>
            <span className="text-xs font-bold font-mono text-[#18212F]">₹{defaultConsultationFee.toFixed(2)}</span>
          </div>
          <div className="bg-[#FFF9F7] px-3 py-1.5 rounded-xl border border-[#F1E4E1]">
            <span className="text-[10px] text-[#667085] block">Shift Intake</span>
            <span className="text-xs font-bold font-mono text-emerald-600">₹{totalCollected.toFixed(2)}</span>
          </div>
          <div className="bg-[#FFF9F7] px-3 py-1.5 rounded-xl border border-[#F1E4E1]">
            <span className="text-[10px] text-[#667085] block">Outstanding Dues</span>
            <span className="text-xs font-bold font-mono text-[#F76762]">₹{totalPending.toFixed(2)}</span>
          </div>

          <button
            onClick={() => setIsDefaultFeeModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 shadow-xs hover:opacity-90 transition-all cursor-pointer text-xs shrink-0"
            title="Configure default patient consultation amount"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Set Default Amount</span>
          </button>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'pending', label: `Pending & Partial (${bills.filter(b => b.status !== 'Paid').length})` },
            { id: 'paid', label: `Settled Receipts (${bills.filter(b => b.status === 'Paid').length})` },
            { id: 'all', label: `All Invoices (${bills.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#18212F] text-white border-[#18212F]'
                  : 'bg-white text-[#667085] border-[#F1E4E1] hover:text-[#18212F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#667085]" />
          <input
            type="text"
            placeholder="Search by Patient, UHID, or Invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
          />
        </div>

      </div>

      {/* Itemized Bills Table */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F1E4E1] bg-[#FFF9F7]/70 text-[#667085] uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3.5 font-semibold">Invoice & Date</th>
                <th className="py-3 px-3.5 font-semibold">Patient</th>
                <th className="py-3 px-3.5 font-semibold">Itemized Service Charges</th>
                <th className="py-3 px-3.5 font-semibold">Total Fee</th>
                <th className="py-3 px-3.5 font-semibold">Paid / Balance</th>
                <th className="py-3 px-3.5 font-semibold">Ownership</th>
                <th className="py-3 px-3.5 font-semibold">Status</th>
                <th className="py-3 px-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E4E1]">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#667085]">
                    No invoices match the current filter.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FFF9F7]/50 transition-colors">
                    
                    {/* Invoice & Date */}
                    <td className="py-3.5 px-3.5">
                      <div className="font-mono font-bold text-[#18212F]">{b.billNumber}</div>
                      <div className="text-[10px] text-[#667085]">{b.createdAt}</div>
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-3.5">
                      <div 
                        onClick={() => onSelectPatient(b.patientId)}
                        className="font-bold text-[#18212F] hover:text-[#F76762] cursor-pointer"
                      >
                        {b.patientName}
                      </div>
                      <div className="font-mono text-[10px] text-[#667085]">{b.patientUhid}</div>
                    </td>

                    {/* Itemized Services */}
                    <td className="py-3.5 px-3.5 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {b.charges.map((c) => (
                          <span 
                            key={c.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-[#F1E4E1] text-[10px] text-[#18212F]"
                            title={c.notes}
                          >
                            <span>{c.serviceName}</span>
                            <span className="font-mono text-[#667085]">(₹{c.amount})</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-3.5 font-mono font-bold text-xs text-[#18212F]">
                      ₹{b.totalAmount.toFixed(2)}
                    </td>

                    {/* Paid vs Balance */}
                    <td className="py-3.5 px-3.5">
                      <div className="text-emerald-600 font-mono font-semibold">
                        Paid: ₹{b.paidAmount.toFixed(2)}
                      </div>
                      {b.balanceAmount > 0 && (
                        <div className="text-[#F76762] font-mono font-bold text-[11px]">
                          Due: ₹{b.balanceAmount.toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Ownership: Charge Created By vs Payment Collected By */}
                    <td className="py-3.5 px-3.5 text-[11px]">
                      <div className="text-[#667085]">
                        Charge: <strong className="text-[#18212F]">{b.createdByName}</strong>
                      </div>
                      {b.payments.length > 0 && (
                        <div className="text-[#667085] mt-0.5">
                          Paid to: <strong className="text-[#18212F]">{b.payments[0].collectedBy}</strong> ({b.payments[0].paymentMethod})
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        b.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {b.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBillForEdit(b)}
                          className="px-2.5 py-1.5 bg-white hover:bg-[#FFF9F7] text-[#18212F] hover:text-[#F76762] border border-[#F1E4E1] hover:border-[#F76762]/40 rounded-lg font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          title={`Edit payment & charges for ${b.patientName}`}
                        >
                          <Edit3 className="w-3 h-3 text-[#F76762]" />
                          <span>Edit</span>
                        </button>

                        {b.balanceAmount > 0 ? (
                          <button
                            onClick={() => handleOpenCollect(b)}
                            className="px-3 py-1.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white rounded-lg font-bold text-xs shadow-2xs hover:opacity-90 cursor-pointer"
                          >
                            Collect ₹{b.balanceAmount.toFixed(2)}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleViewReceipt(b)}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-50 text-[#18212F] border border-[#F1E4E1] rounded-lg font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3 text-[#667085]" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {selectedBillForPayment && (
        <CollectPaymentModal
          bill={selectedBillForPayment}
          onClose={() => setSelectedBillForPayment(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Receipt Modal */}
      {receiptModalData && (
        <ReceiptModal
          bill={receiptModalData.bill}
          payment={receiptModalData.payment}
          onClose={() => setReceiptModalData(null)}
        />
      )}

      {/* Set Default Patient Fee Modal */}
      {isDefaultFeeModalOpen && (
        <SetDefaultFeeModal
          onClose={() => setIsDefaultFeeModalOpen(false)}
        />
      )}

      {/* Edit Patient Bill Modal */}
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
