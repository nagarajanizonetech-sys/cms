import React, { useState } from 'react';
import { 
  X, 
  Edit3, 
  Plus, 
  Trash2, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  FileText, 
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { Bill } from '../../../types/reception';
import { useReception } from '../../../context/ReceptionContext';

interface EditBillModalProps {
  bill: Bill;
  onClose: () => void;
  onSuccess?: () => void;
}

interface EditableCharge {
  id: string;
  service_name: string;
  unit_price: number;
  quantity: number;
  total: number;
  description?: string;
}

const COMMON_SERVICES = [
  { name: 'General Consultation', defaultPrice: 500 },
  { name: 'Specialist Consultation', defaultPrice: 600 },
  { name: 'Follow-up Consultation', defaultPrice: 300 },
  { name: 'Dressing & Wound Care', defaultPrice: 200 },
  { name: 'Injection Administration', defaultPrice: 100 },
  { name: 'Diagnostic ECG', defaultPrice: 400 },
  { name: 'Blood Glucose Test', defaultPrice: 150 },
  { name: 'Nebulization Therapy', defaultPrice: 250 },
  { name: 'Suture Removal', defaultPrice: 250 },
];

export const EditBillModal: React.FC<EditBillModalProps> = ({
  bill,
  onClose,
  onSuccess,
}) => {
  const { updateBill, defaultConsultationFee } = useReception();

  // Populate charges from bill
  const [items, setItems] = useState<EditableCharge[]>(() => {
    if (bill.charges.length > 0) {
      return bill.charges.map((c, i) => ({
        id: c.id || `item-${i}-${Date.now()}`,
        service_name: c.serviceName,
        unit_price: c.amount,
        quantity: 1,
        total: c.amount,
        description: c.notes,
      }));
    }
    return [{
      id: `item-0-${Date.now()}`,
      service_name: 'Consultation',
      unit_price: defaultConsultationFee,
      quantity: 1,
      total: defaultConsultationFee,
      description: 'Standard consultation fee',
    }];
  });

  const [notes, setNotes] = useState<string>(bill.notes || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0);
  const newTotal = Math.max(0, Math.round(subtotal * 100) / 100);
  const newBalance = Math.max(0, Math.round((newTotal - bill.paidAmount) * 100) / 100);

  const handleItemChange = (id: string, field: 'service_name' | 'unit_price' | 'quantity', value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'unit_price' || field === 'quantity') {
        const u = field === 'unit_price' ? Math.max(0, parseFloat(value) || 0) : item.unit_price;
        const q = field === 'quantity' ? Math.max(1, parseInt(value, 10) || 1) : item.quantity;
        updated.unit_price = u;
        updated.quantity = q;
        updated.total = Math.round(u * q * 100) / 100;
      }
      return updated;
    }));
  };

  const handleAddItem = (serviceName = 'Additional Clinical Service', price = 200) => {
    const newItem: EditableCharge = {
      id: `item-${Date.now()}-${Math.random()}`,
      service_name: serviceName,
      unit_price: price,
      quantity: 1,
      total: price,
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setError('An invoice must have at least one line item charge.');
      return;
    }
    setError(null);
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleApplyDefaultFee = () => {
    setItems(prev => {
      let hasConsult = false;
      const updated = prev.map(it => {
        if (it.service_name.toLowerCase().includes('consultation')) {
          hasConsult = true;
          return {
            ...it,
            unit_price: defaultConsultationFee,
            total: Math.round(defaultConsultationFee * it.quantity * 100) / 100,
          };
        }
        return it;
      });

      if (!hasConsult && updated.length > 0) {
        updated[0] = {
          ...updated[0],
          unit_price: defaultConsultationFee,
          total: Math.round(defaultConsultationFee * updated[0].quantity * 100) / 100,
        };
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Please add at least one charge item.');
      return;
    }

    if (items.some(it => it.unit_price < 0)) {
      setError('Item unit prices must be positive numeric amounts.');
      return;
    }

    if (items.some(it => it.quantity <= 0)) {
      setError('Item quantity must be at least 1.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateBill(bill.id, {
        items: items.map(it => ({
          service_name: it.service_name.trim() || 'Clinical Service',
          unit_price: it.unit_price,
          quantity: it.quantity,
          total: it.total,
          description: it.description,
        })),
        discount: 0,
        tax: 0,
        notes: notes.trim() || undefined,
      });

      setIsSaving(false);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setIsSaving(false);
      setError(err?.message || 'Failed to update patient invoice.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18212F]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#F1E4E1] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-[#F1E4E1] flex items-center justify-between bg-[#FFF9F7]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F76762] to-[#FB866E] text-white flex items-center justify-center shadow-xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#18212F]">Edit Patient Payment & Invoice</div>
              <div className="text-[11px] text-[#667085]">
                {bill.patientName} · <span className="font-mono text-[#F76762]">{bill.patientUhid}</span> · #{bill.billNumber}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#667085] hover:text-[#18212F] rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Top Info Banner & Quick Action */}
          <div className="bg-[#FFF9F7] p-3 rounded-xl border border-[#F1E4E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-[#667085] block">Current Bill Status</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  bill.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  bill.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {bill.status.toUpperCase()}
                </span>
                <span className="text-[11px] text-[#667085]">
                  Already Collected: <strong className="text-emerald-700 font-mono">₹{bill.paidAmount.toFixed(2)}</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyDefaultFee}
              className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-[#F76762] border border-[#F76762]/30 hover:border-[#F76762] rounded-lg font-bold text-xs cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              title="Reset consultation charge to the clinic default tariff"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply Default Fee (₹{defaultConsultationFee})</span>
            </button>
          </div>

          {/* Line Items Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#18212F] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#F76762]" />
                <span>Itemized Service Charges ({items.length})</span>
              </span>
              <span className="text-[10px] text-[#667085]">Adjust individual service fees</span>
            </div>

            <div className="border border-[#F1E4E1] rounded-xl overflow-hidden divide-y divide-[#F1E4E1] bg-white">
              <div className="grid grid-cols-12 gap-2 p-2 bg-[#FFF9F7]/70 text-[10px] font-bold text-[#667085] uppercase tracking-wide">
                <div className="col-span-6 sm:col-span-6">Service / Treatment Description</div>
                <div className="col-span-3 sm:col-span-2 text-right">Fee (₹)</div>
                <div className="col-span-1 sm:col-span-1 text-center">Qty</div>
                <div className="col-span-2 sm:col-span-2 text-right">Total</div>
                <div className="col-span-1 text-center"></div>
              </div>

              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 p-2 items-center hover:bg-[#FFF9F7]/30 transition-colors">
                  <div className="col-span-6 sm:col-span-6">
                    <input
                      type="text"
                      required
                      value={item.service_name}
                      onChange={(e) => handleItemChange(item.id, 'service_name', e.target.value)}
                      placeholder="e.g. Consultation Fee"
                      className="w-full px-2.5 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-lg text-xs font-medium text-[#18212F] focus:outline-none focus:border-[#F76762]"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        required
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(item.id, 'unit_price', e.target.value)}
                        className="w-full px-2 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-lg text-xs font-mono font-bold text-right text-[#18212F] focus:outline-none focus:border-[#F76762]"
                      />
                    </div>
                  </div>
                  <div className="col-span-1 sm:col-span-1">
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      className="w-full px-1 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-lg text-xs font-mono text-center text-[#18212F] focus:outline-none focus:border-[#F76762]"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-2 text-right font-mono font-bold text-[#18212F]">
                    ₹{(item.unit_price * item.quantity).toFixed(2)}
                  </div>
                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        title="Remove service charge"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-[#667085] font-semibold">+ Quick Add:</span>
              {COMMON_SERVICES.slice(0, 4).map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => handleAddItem(s.name, s.defaultPrice)}
                  className="px-2 py-1 bg-white hover:bg-[#FFF9F7] text-[10px] text-[#667085] hover:text-[#18212F] border border-[#F1E4E1] rounded-lg transition-colors cursor-pointer"
                >
                  + {s.name} (₹{s.defaultPrice})
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleAddItem('Custom Service', 100)}
                className="px-2 py-1 bg-[#F76762]/10 hover:bg-[#F76762]/20 text-[10px] text-[#F76762] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="bg-[#FFF9F7] p-3.5 rounded-xl border border-[#F1E4E1] grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[10px] text-[#667085] block">Total Invoiced</span>
              <span className="font-mono font-extrabold text-sm text-[#18212F]">₹{newTotal.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#667085] block">Already Paid</span>
              <span className="font-mono font-bold text-emerald-600 text-xs">₹{bill.paidAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#667085] block">New Balance Due</span>
              <span className={`font-mono font-extrabold text-sm ${newBalance > 0 ? 'text-[#F76762]' : 'text-emerald-700'}`}>
                ₹{newBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Warning if Total < Paid */}
          {newTotal < bill.paidAmount && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Revised total (₹{newTotal}) is lower than already collected amount (₹{bill.paidAmount}). Balance is ₹0.00. Excess payment may require front desk credit/refund.
              </span>
            </div>
          )}

          {/* Adjustment Reason */}
          <div className="space-y-1">
            <label className="font-semibold text-[#18212F]">Reason / Notes for Adjustment (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Standard consultation fee adjustment approved by clinic desk"
              className="w-full px-3 py-1.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
            />
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Updating Bill...' : `Save Changes (₹${newTotal})`}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
