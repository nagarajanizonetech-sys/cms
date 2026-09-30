import React, { useState } from 'react';
import { X, IndianRupee, Sliders, CheckCircle2, AlertCircle, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';

interface SetDefaultFeeModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const SetDefaultFeeModal: React.FC<SetDefaultFeeModalProps> = ({ onClose, onSuccess }) => {
  const { defaultConsultationFee, setDefaultConsultationFee, bills } = useReception();
  const [fee, setFee] = useState<number>(defaultConsultationFee);
  const [applyToPending, setApplyToPending] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingBillsCount = bills.filter(b => b.status !== 'Paid').length;
  const presets = [100, 250, 350, 500, 600, 750, 1000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fee <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await setDefaultConsultationFee(fee, applyToPending);
      setIsSaving(false);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setIsSaving(false);
      setError(err?.message || 'Failed to update default fee.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18212F]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#F1E4E1] shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-[#F1E4E1] flex items-center justify-between bg-[#FFF9F7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F76762] to-[#FB866E] text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#18212F]">Default Patient Fee Settings</div>
              <div className="text-[11px] text-[#667085]">Standard consultation & visit charge tariff</div>
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
          
          {/* Current vs New Setting Card */}
          <div className="bg-[#FFF9F7] p-3.5 rounded-xl border border-[#F1E4E1] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#667085] block">Current Clinic Tariff</span>
              <span className="text-base font-extrabold font-mono text-[#18212F]">
                ₹{defaultConsultationFee.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#667085] block">Pending Invoices</span>
              <span className="text-xs font-bold text-amber-700 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {pendingBillsCount} Unsettled
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#18212F] block">Quick Presets</label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFee(p)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${
                    fee === p
                      ? 'bg-[#18212F] text-white border-[#18212F] shadow-xs'
                      : 'bg-white text-[#667085] border-[#F1E4E1] hover:text-[#18212F] hover:bg-[#FFF9F7]'
                  }`}
                >
                  ₹{p}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#18212F] block">Default Consultation Fee (₹) *</label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 absolute left-3 top-2.5 text-[#667085]" />
              <input
                type="number"
                step="1"
                min="1"
                required
                value={fee || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFee(isNaN(val) ? 0 : Math.max(0, val));
                }}
                className="w-full pl-9 pr-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-base font-bold font-mono text-[#18212F] focus:outline-none focus:border-[#F76762]"
                placeholder="500"
              />
            </div>
          </div>

          {/* Retroactive bulk update checkbox */}
          <div className="p-3 bg-white rounded-xl border border-[#F1E4E1] hover:border-[#F76762]/30 transition-colors">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={applyToPending}
                onChange={(e) => setApplyToPending(e.target.checked)}
                className="mt-0.5 rounded text-[#F76762] focus:ring-[#F76762] cursor-pointer"
              />
              <div className="text-[11px] leading-tight">
                <span className="font-bold text-[#18212F] block">
                  Update All Pending Invoices ({pendingBillsCount} bills)
                </span>
                <span className="text-[#667085] block mt-0.5">
                  Automatically adjust all unsettled consultation bills to ₹{fee.toFixed(2)}. Paid receipts remain untouched.
                </span>
              </div>
            </label>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Policy Info */}
          <div className="text-[11px] text-[#667085] flex items-center gap-1.5 bg-[#FFF9F7] p-2.5 rounded-xl border border-[#F1E4E1]">
            <ShieldCheck className="w-4 h-4 text-[#F76762] shrink-0" />
            <span>Future walk-ins and consultation bookings will default to this amount automatically.</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-[#F1E4E1]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-[#F1E4E1] text-[#667085] hover:text-[#18212F] font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white font-semibold rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSaving ? 'Updating Tariff...' : `Save Default (₹${fee})`}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
