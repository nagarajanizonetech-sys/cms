import React, { useState, useMemo } from 'react';
import {
  Repeat,
  Calendar,
  Clock,
  User,
  PhoneCall,
  MapPin,
  Search,
  CheckCircle2,
  CalendarDays,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Stethoscope,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';
import { FollowUpRecord } from '../../../types/doctor';

interface ReceptionFollowUpsViewProps {
  onSelectPatient: (patientId: string) => void;
  onBookAppointment?: (patientId: string, date?: string) => void;
}

type CategoryFilter = 'today' | 'week' | 'month' | 'all';

export const ReceptionFollowUpsView: React.FC<ReceptionFollowUpsViewProps> = ({
  onSelectPatient,
}) => {
  const { followUps, patients, doctors, refreshFollowUps, updateFollowUpStatus } = useReception();

  // View mode: 'active' shows pending follow-ups; 'completed' shows overall marked completed patients
  const [viewMode, setViewMode] = useState<'active' | 'completed'>('active');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('today');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Date Helpers
  const today = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const weekRange = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = (currentDay + 6) % 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const toYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return { startStr: toYMD(monday), endStr: toYMD(sunday) };
  }, []);

  const currentMonthPrefix = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  // Quick category matcher
  const matchesCategory = (dateStr: string, cat: CategoryFilter): boolean => {
    if (!dateStr) return cat === 'all';
    if (cat === 'all') return true;
    if (cat === 'today') return dateStr === today;
    if (cat === 'week') return dateStr >= weekRange.startStr && dateStr <= weekRange.endStr;
    if (cat === 'month') return dateStr.startsWith(currentMonthPrefix);
    return true;
  };

  // Enriched follow-ups with patient directory & doctor details
  const enrichedFollowUps = useMemo(() => {
    return followUps.map((fu) => {
      const patient = patients.find(
        (p) => p.id === fu.patientId || (p.uhid && fu.patientUhid && p.uhid === fu.patientUhid)
      );
      const doctor = doctors.find((d) => d.id === fu.doctorId || d.name === fu.doctorName);

      const patientName = patient?.fullName || fu.patientName || 'Unknown Patient';
      const patientPhone = fu.patientPhone || patient?.mobile || 'Not available';
      const patientAddress = patient?.address
        ? (patient.city ? `${patient.address}, ${patient.city}` : patient.address)
        : (patient?.city || 'No address recorded');

      return {
        ...fu,
        patientName,
        patientPhone,
        patientAddress,
        patientUhid: fu.patientUhid || patient?.uhid || 'AUR-NEW',
        patientAge: patient?.age,
        patientGender: patient?.gender,
        doctorName: fu.doctorName || doctor?.name || 'Assigned Doctor',
        doctorSpecialization: doctor?.specialization,
        doctorRoom: doctor?.room,
      };
    });
  }, [followUps, patients, doctors]);

  // Active (Pending / Non-Completed) follow-ups
  const activeFollowUpsList = useMemo(() => {
    return enrichedFollowUps.filter((item) => item.status !== 'Completed');
  }, [enrichedFollowUps]);

  // Overall Completed follow-ups
  const completedFollowUpsList = useMemo(() => {
    return enrichedFollowUps.filter((item) => item.status === 'Completed');
  }, [enrichedFollowUps]);

  // Counts for active categories (only active/pending follow-ups)
  const categoryCounts = useMemo(() => {
    const counts = { today: 0, week: 0, month: 0, all: activeFollowUpsList.length };
    activeFollowUpsList.forEach((fu) => {
      if (matchesCategory(fu.scheduledDate, 'today')) counts.today += 1;
      if (matchesCategory(fu.scheduledDate, 'week')) counts.week += 1;
      if (matchesCategory(fu.scheduledDate, 'month')) counts.month += 1;
    });
    return counts;
  }, [activeFollowUpsList, today, weekRange, currentMonthPrefix]);

  const completedCount = completedFollowUpsList.length;

  // Filtered list based on current viewMode, activeCategory, search, and doctor
  const displayedFollowUps = useMemo(() => {
    const sourceList = viewMode === 'active' ? activeFollowUpsList : completedFollowUpsList;

    return sourceList.filter((item) => {
      // 1. In active mode, apply date category filter based on doctor allocated date
      if (viewMode === 'active') {
        if (!matchesCategory(item.scheduledDate, activeCategory)) {
          return false;
        }
      }

      // 2. Doctor Filter
      if (selectedDoctorId !== 'all' && item.doctorId !== selectedDoctorId) {
        return false;
      }

      // 3. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.patientName.toLowerCase().includes(q);
        const matchesPhone = item.patientPhone.toLowerCase().includes(q);
        const matchesAddress = item.patientAddress.toLowerCase().includes(q);
        const matchesUhid = item.patientUhid.toLowerCase().includes(q);
        const matchesDoctor = item.doctorName.toLowerCase().includes(q);
        const matchesReason = (item.reason || '').toLowerCase().includes(q);

        if (!matchesName && !matchesPhone && !matchesAddress && !matchesUhid && !matchesDoctor && !matchesReason) {
          return false;
        }
      }

      return true;
    });
  }, [viewMode, activeFollowUpsList, completedFollowUpsList, activeCategory, selectedDoctorId, searchQuery]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFollowUps();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Copy phone number helper
  const handleCopyPhone = (text: string, id: string) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Mark a follow-up as completed (removes from active table and moves to Completed button view)
  const handleMarkCompleted = async (fuId: string) => {
    if (!updateFollowUpStatus) return;
    await updateFollowUpStatus(fuId, 'Completed');
  };

  // Re-open / Mark as pending (moves back from Completed view to active table)
  const handleReopen = async (fuId: string) => {
    if (!updateFollowUpStatus) return;
    await updateFollowUpStatus(fuId, 'Scheduled');
  };

  // Format date readable
  const formatAllocatedDate = (dateStr: string) => {
    if (!dateStr) return 'Date not specified';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Relative timeline indicator for active table
  const getDateBadge = (dateStr: string, status: string) => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Completed
        </span>
      );
    }

    if (dateStr === today) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Due Today
        </span>
      );
    }

    if (dateStr < today) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Overdue
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <CalendarDays className="w-3 h-3 text-blue-600" />
        Upcoming
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* ─── TOP BANNER & METRICS ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white shadow-xs">
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-[#18212F]">
                  Patient Follow-up Care & Monitoring
                </h1>
                <p className="text-xs text-[#667085]">
                  Track doctor-allocated review dates, patient contact details, and follow-up completion status.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Refresh */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Refresh follow-up records"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#667085] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#F1E4E1]/70">
          
          {/* Due Today */}
          <div 
            onClick={() => {
              setViewMode('active');
              setActiveCategory('today');
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              viewMode === 'active' && activeCategory === 'today'
                ? 'bg-[#FFF9F7] border-[#F76762] shadow-xs'
                : 'bg-white border-[#F1E4E1] hover:border-[#F76762]/50'
            }`}
          >
            <div className="text-[11px] font-semibold text-[#667085] flex items-center justify-between">
              <span>Due Today</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold text-[#18212F] mt-1">
              {categoryCounts.today}
            </div>
            <div className="text-[10px] text-[#667085] mt-0.5">Active for {today}</div>
          </div>

          {/* This Week */}
          <div 
            onClick={() => {
              setViewMode('active');
              setActiveCategory('week');
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              viewMode === 'active' && activeCategory === 'week'
                ? 'bg-[#FFF9F7] border-[#F76762] shadow-xs'
                : 'bg-white border-[#F1E4E1] hover:border-[#F76762]/50'
            }`}
          >
            <div className="text-[11px] font-semibold text-[#667085] flex items-center justify-between">
              <span>This Week</span>
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-extrabold text-[#18212F] mt-1">
              {categoryCounts.week}
            </div>
            <div className="text-[10px] text-[#667085] mt-0.5">Mon – Sun current week</div>
          </div>

          {/* This Month */}
          <div 
            onClick={() => {
              setViewMode('active');
              setActiveCategory('month');
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              viewMode === 'active' && activeCategory === 'month'
                ? 'bg-[#FFF9F7] border-[#F76762] shadow-xs'
                : 'bg-white border-[#F1E4E1] hover:border-[#F76762]/50'
            }`}
          >
            <div className="text-[11px] font-semibold text-[#667085] flex items-center justify-between">
              <span>This Month</span>
              <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-extrabold text-[#18212F] mt-1">
              {categoryCounts.month}
            </div>
            <div className="text-[10px] text-[#667085] mt-0.5">Current month cycle</div>
          </div>

          {/* Completed Button KPI Card (Overall marked completed) */}
          <div 
            onClick={() => setViewMode(viewMode === 'completed' ? 'active' : 'completed')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              viewMode === 'completed'
                ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                : 'bg-white border-[#F1E4E1] hover:border-emerald-300'
            }`}
          >
            <div className="text-[11px] font-semibold text-emerald-800 flex items-center justify-between">
              <span>Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-emerald-900 mt-1">
              {completedCount}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">
              {viewMode === 'completed' ? 'Viewing completed list' : 'Click to view completed'}
            </div>
          </div>

        </div>
      </div>

      {/* ─── FILTERS, COMPLETED BUTTON & SEARCH CONTROLS ───────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Category Filter Tabs + Dedicated Completed Button */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Active Category Tabs: Today, This Week, This Month, All Pending */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[#F1E4E1] rounded-2xl shadow-2xs shrink-0 overflow-x-auto">
            {[
              { id: 'today', label: 'Today', count: categoryCounts.today },
              { id: 'week', label: 'This Week', count: categoryCounts.week },
              { id: 'month', label: 'This Month', count: categoryCounts.month },
              { id: 'all', label: 'All Pending', count: categoryCounts.all },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setViewMode('active');
                  setActiveCategory(cat.id as CategoryFilter);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  viewMode === 'active' && activeCategory === cat.id
                    ? 'bg-[#18212F] text-white shadow-xs'
                    : 'text-[#667085] hover:text-[#18212F] hover:bg-[#FFF9F7]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    viewMode === 'active' && activeCategory === cat.id
                      ? 'bg-white/20 text-white'
                      : 'bg-[#18212F]/5 text-[#667085]'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* DEDICATED COMPLETED BUTTON */}
          <button
            onClick={() => setViewMode(viewMode === 'completed' ? 'active' : 'completed')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 border shadow-2xs ${
              viewMode === 'completed'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
            }`}
            title="Show overall marked completed follow-up patients"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                viewMode === 'completed'
                  ? 'bg-white text-emerald-700'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {completedCount}
            </span>
          </button>

        </div>

        {/* Search Bar & Doctor Selector */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-[#667085] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search patient, contact, address, doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762] placeholder-[#667085]/60 shadow-2xs"
            />
          </div>

          {/* Doctor Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-white border border-[#F1E4E1] rounded-xl text-xs py-1.5 px-3 pr-7 text-[#18212F] font-medium focus:outline-none focus:border-[#F76762] cursor-pointer shadow-2xs"
            >
              <option value="all">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* ─── ACTIVE VS COMPLETED NOTICE BANNER ───────────────────────────── */}
      {viewMode === 'completed' && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-emerald-900">
                Overall Completed Follow-up Patients ({completedFollowUpsList.length})
              </div>
              <div className="text-emerald-700 text-[11px]">
                Showing all patients marked as completed. They are hidden from the active list. You can re-open any patient to move them back.
              </div>
            </div>
          </div>
          <button
            onClick={() => setViewMode('active')}
            className="px-3.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Active Follow-ups</span>
          </button>
        </div>
      )}

      {/* ─── FOLLOW-UPS TABLE (SHOWS PATIENT NAME, CONTACT, ADDRESS, ALLOCATED DATE) ─── */}
      {displayedFollowUps.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#F1E4E1] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FFF9F7] text-[10px] font-bold text-[#667085] uppercase tracking-wider border-b border-[#F1E4E1]">
                <tr>
                  <th className="py-3 px-4">Doctor Allocated Date</th>
                  <th className="py-3 px-4">Patient Name & Profile</th>
                  <th className="py-3 px-4">Contact Number</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Prescribing Doctor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Desk Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1E4E1]">
                {displayedFollowUps.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#FFF9F7]/50 transition-colors group"
                    >
                      {/* 1. Doctor Allocated Date */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="font-extrabold text-[#18212F] flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#F76762]" />
                            <span>{formatAllocatedDate(item.scheduledDate)}</span>
                          </div>
                          <div>
                            {getDateBadge(item.scheduledDate, item.status)}
                          </div>
                          <div className="text-[10px] text-[#667085] font-mono mt-0.5">
                            Raw: {item.scheduledDate}
                          </div>
                        </div>
                      </td>

                      {/* 2. Patient Name & Profile */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="min-w-[170px]">
                          <button
                            onClick={() => onSelectPatient(item.patientId)}
                            className="font-bold text-sm text-[#18212F] hover:text-[#F76762] text-left transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>{item.patientName}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded font-bold">
                              {item.patientUhid}
                            </span>
                            {(item.patientAge || item.patientGender) && (
                              <span className="text-[10px] text-[#667085]">
                                {item.patientAge ? `${item.patientAge}y` : ''} 
                                {item.patientAge && item.patientGender ? ' · ' : ''}
                                {item.patientGender || ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Contact Number */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="min-w-[140px] space-y-1">
                          {item.patientPhone && item.patientPhone !== 'Not available' ? (
                            <>
                              <a
                                href={`tel:${item.patientPhone}`}
                                className="inline-flex items-center gap-1.5 font-semibold text-[#18212F] hover:text-[#F76762] transition-colors"
                              >
                                <PhoneCall className="w-3 h-3 text-[#F76762]" />
                                <span>{item.patientPhone}</span>
                              </a>
                              <button
                                onClick={() => handleCopyPhone(item.patientPhone, item.id)}
                                className="flex items-center gap-1 text-[10px] text-[#667085] hover:text-[#18212F] cursor-pointer"
                                title="Copy contact number"
                              >
                                {copiedId === item.id ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    <span className="text-emerald-600 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-2.5 h-2.5" />
                                    <span>Copy number</span>
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-[#667085] italic text-[11px]">
                              No contact number
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Address */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="min-w-[180px] max-w-[240px]">
                          <div className="flex items-start gap-1.5 text-neutral-700">
                            <MapPin className="w-3.5 h-3.5 text-[#667085] shrink-0 mt-0.5" />
                            <span className="text-xs leading-relaxed line-clamp-2" title={item.patientAddress}>
                              {item.patientAddress}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Prescribing Doctor */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex items-start gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-[#18212F]">{item.doctorName}</div>
                            {item.doctorSpecialization && (
                              <div className="text-[10px] text-[#667085]">
                                {item.doctorSpecialization} {item.doctorRoom ? `(${item.doctorRoom})` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* 8. Desk Actions (Mark Completed in active mode; Re-open in completed mode) */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* In ACTIVE MODE: Mark Completed button (removes from active table and adds to Completed button) */}
                          {viewMode === 'active' ? (
                            <button
                              onClick={() => handleMarkCompleted(item.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              title="Mark as completed (removes from this table and adds to Completed button)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Completed</span>
                            </button>
                          ) : (
                            /* In COMPLETED MODE: Re-open button (moves back to active table) */
                            <button
                              onClick={() => handleReopen(item.id)}
                              className="px-3 py-1.5 bg-[#FFF9F7] hover:bg-white text-neutral-700 border border-[#F1E4E1] hover:border-amber-300 hover:text-amber-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                              title="Re-open follow-up and move back to active list"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              <span>Re-open</span>
                            </button>
                          )}

                          {/* Open Patient Details */}
                          <button
                            onClick={() => onSelectPatient(item.patientId)}
                            className="p-1.5 bg-[#FFF9F7] hover:bg-white text-[#18212F] border border-[#F1E4E1] rounded-xl transition-colors cursor-pointer shadow-2xs"
                            title="Open Patient Profile"
                          >
                            <User className="w-3.5 h-3.5 text-[#667085]" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="bg-[#FFF9F7] px-4 py-2.5 border-t border-[#F1E4E1] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#667085] gap-2">
            <div>
              {viewMode === 'active' ? (
                <>
                  Showing <strong className="text-[#18212F]">{displayedFollowUps.length}</strong> active follow-up record(s) in category: <span className="uppercase font-bold text-[#F76762]">{activeCategory}</span>
                </>
              ) : (
                <>
                  Showing <strong className="text-emerald-700 font-bold">{displayedFollowUps.length}</strong> overall completed patient follow-up(s).
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {viewMode === 'active' ? (
                <span>Clicking <strong>Mark Completed</strong> removes the patient from this table and archives them into the <strong>Completed</strong> button.</span>
              ) : (
                <span>Clicking <strong>Re-open</strong> restores the patient back into the active follow-up list.</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-dashed border-[#F1E4E1] p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF9F7] text-[#F76762] border border-[#F1E4E1] flex items-center justify-center mx-auto mb-3">
            {viewMode === 'completed' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <Repeat className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-sm font-bold text-[#18212F]">
            {viewMode === 'completed'
              ? 'No Completed Follow-up Records Yet'
              : 'No Active Follow-up Records Found'}
          </h3>
          <p className="text-xs text-[#667085] mt-1 max-w-md mx-auto">
            {viewMode === 'completed'
              ? 'When follow-up patients are marked as completed from the active table, they will be archived and shown here.'
              : searchQuery
                ? `No active follow-ups matched your search "${searchQuery}" in category "${activeCategory}".`
                : `There are currently no active doctor-allocated follow-ups scheduled for the selected category (${activeCategory}).`}
          </p>

          {viewMode === 'completed' ? (
            <button
              onClick={() => setViewMode('active')}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs hover:bg-emerald-700"
            >
              Return to Active Follow-ups
            </button>
          ) : (
            (searchQuery || selectedDoctorId !== 'all' || activeCategory !== 'all') && (
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                  setSelectedDoctorId('all');
                }}
                className="mt-4 px-4 py-2 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl cursor-pointer shadow-2xs"
              >
                Reset Filters & Show All Pending
              </button>
            )
          )}
        </div>
      )}

    </div>
  );
};
