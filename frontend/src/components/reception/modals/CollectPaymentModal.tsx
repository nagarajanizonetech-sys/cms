import React, { useState } from 'react';
import { X, CreditCard, IndianRupee, AlertCircle, CheckCircle2, ShieldCheck, Wallet } from 'lucide-react';
import { Bill, PaymentMethod, PaymentRecord } from '../../../types/reception';
import { useReception } from '../../../context/ReceptionContext';

interface CollectPaymentModalProps {
  bill: Bill;
  onClose: () => void;
  onPaymentSuccess: (receipt: PaymentRecord) => void;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  bill,
  onClose,
  onPaymentSuccess,
}) => {
  const { collectPayment } = useReception();
  const [amount, setAmount] = useState<number>(bill.balanceAmount);
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError('Please enter a payment amount greater than zero.');
      return;
    }

    if (amount > bill.balanceAmount) {
      setError(`Payment amount (₹${amount}) cannot exceed the remaining balance (₹${bill.balanceAmount}).`);
      return;
    }

    setIsProcessing(true);

    try {
      const res = await collectPayment(bill.id, amount, method, note);
      setIsProcessing(false);

      if (res.success && res.receipt) {
        onPaymentSuccess(res.receipt);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Payment processing failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18212F]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#F1E4E1] shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-[#F1E4E1] flex items-center justify-between bg-[#FFF9F7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F76762]/10 text-[#F76762] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#18212F]">Collect Payment</div>
              <div className="text-[11px] text-[#667085]">Invoice #{bill.billNumber}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#667085] hover:text-[#18212F] rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Patient Details & Status */}
          <div className="bg-[#FFF9F7] p-3.5 rounded-xl border border-[#F1E4E1] flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#667085]">Patient Details</div>
              <div className="font-bold text-[#18212F] text-sm">{bill.patientName}</div>
              <div className="font-mono text-[#667085] text-[11px]">{bill.patientUhid}</div>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                bill.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                bill.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {bill.status.toUpperCase()}
              </span>
              <div className="text-[10px] text-[#667085] mt-1">Created by {bill.createdByName}</div>
            </div>
          </div>

          {/* Itemized Services Summary */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-[#18212F] uppercase tracking-wide">
              Services Rendered
            </div>
            <div className="divide-y divide-[#F1E4E1] border border-[#F1E4E1] rounded-xl bg-white px-3 py-1">
              {bill.charges.map((c) => (
                <div key={c.id} className="py-2 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-medium text-[#18212F]">{c.serviceName}</span>
                    {c.notes && <span className="text-[10px] text-[#667085] block">{c.notes}</span>}
                  </div>
                  <span className="font-mono font-medium text-[#18212F]">₹{c.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Amount Balance Card */}
          <div className="grid grid-cols-3 gap-2 bg-[#FFF9F7] p-3 rounded-xl border border-[#F1E4E1] text-center">
            <div>
              <div className="text-[10px] text-[#667085]">Total Bill</div>
              <div className="font-bold font-mono text-[#18212F]">₹{bill.totalAmount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#667085]">Already Paid</div>
              <div className="font-bold font-mono text-emerald-600">₹{bill.paidAmount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#667085]">Remaining Balance</div>
              <div className="font-bold font-mono text-[#F76762]">₹{bill.balanceAmount.toFixed(2)}</div>
            </div>
          </div>

          {/* Payment Amount Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-[#18212F]">Amount to Collect (₹)</label>
              <button
                type="button"
                onClick={() => setAmount(bill.balanceAmount)}
                className="text-[11px] text-[#F76762] font-semibold hover:underline cursor-pointer"
              >
                Pay Full Balance (₹{bill.balanceAmount})
              </button>
            </div>
            <div className="relative">
              <IndianRupee className="w-4 h-4 absolute left-3 top-2.5 text-[#667085]" />
              <input
                type="number"
                step="0.01"
                min="1"
                max={bill.balanceAmount}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-sm font-bold text-[#18212F] focus:outline-none focus:border-[#F76762]"
                required
              />
            </div>
            {amount < bill.balanceAmount && amount > 0 && (
              <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                Partial payment: remaining balance will be ₹{(bill.balanceAmount - amount).toFixed(2)}.
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#18212F]">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Cash', 'UPI', 'Card', 'Other'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 px-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                    method === m
                      ? 'bg-[#18212F] text-white border-[#18212F] shadow-xs'
                      : 'bg-white text-[#667085] border-[#F1E4E1] hover:text-[#18212F]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note / Reference */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#18212F]">Transaction Reference / Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. UPI ref #8291, Cash received at front desk"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Ownership Notice */}
          <div className="text-[11px] text-[#667085] flex items-center gap-1.5 bg-[#FFF9F7] p-2 rounded-lg border border-[#F1E4E1]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F76762] shrink-0" />
            <span>Logged as collected by <strong>Reception Desk (Receptionist)</strong> with instant receipt.</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-[#F1E4E1] text-[#667085] hover:text-[#18212F] font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white font-semibold rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Wallet className="w-4 h-4" />
              <span>{isProcessing ? 'Processing...' : `Collect ₹${amount.toFixed(2)}`}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
