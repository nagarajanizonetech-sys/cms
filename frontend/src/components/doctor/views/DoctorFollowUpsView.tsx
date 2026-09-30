import React, { useState } from 'react';
import { 
  Repeat, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle2, 
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { useReception } from '../../../context/ReceptionContext';

interface DoctorFollowUpsViewProps {
  onNavigate: (route: string) => void;
}

export const DoctorFollowUpsView: React.FC<DoctorFollowUpsViewProps> = ({ onNavigate }) => {
  const { followUps, currentDoctorId, doctors } = useReception();
  const currentDoctor = doctors.find((d) => d.id === currentDoctorId || d.id === `doc-${currentDoctorId}`) || doctors[0] || {
    id: '1',
    name: 'Dr. Sarah Khan',
    room: 'Room 101',
    specialization: 'General Medicine',
  };
  const cleanDocId = (currentDoctor?.id || '1').replace('doc-', '');

  const [activeTab, setActiveTab] = useState<'All' | 'Today' | 'Upcoming' | 'Overdue'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Doctor Isolation: Only follow-ups scheduled with this doctor!
  const myFollowUps = followUps.filter((f) => f.doctorId === currentDoctor.id || f.doctorId === cleanDocId);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredFollowUps = myFollowUps.filter((f) => {
    if (activeTab === 'Today' && f.scheduledDate !== todayStr) return false;
    if (activeTab === 'Upcoming' && f.scheduledDate <= todayStr) return false;
    if (activeTab === 'Overdue' && (f.scheduledDate >= todayStr || f.status === 'Completed')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        f.patientName.toLowerCase().includes(q) ||
        f.patientUhid.toLowerCase().includes(q) ||
        f.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#F1E4E1] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#18212F]">
            Follow-up Care & Monitoring — {currentDoctor.name}
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Tracking post-consultation reviews, chronic disease re-evaluations, and scheduled revisits.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search patient, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] focus:outline-none focus:border-[#F76762]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['All', 'Today', 'Upcoming', 'Overdue'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === tab
                ? 'bg-[#18212F] text-white shadow-xs'
                : 'bg-white border border-[#F1E4E1] text-[#667085] hover:text-[#18212F]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Follow-ups Table */}
      {filteredFollowUps.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#F1E4E1] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF9F7] text-[10px] font-bold text-[#667085] uppercase tracking-wider border-b border-[#F1E4E1]">
              <tr>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Patient Profile</th>
                <th className="py-3 px-4">Clinical Objective / Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E4E1]">
              {filteredFollowUps.map((fu) => (
                <tr key={fu.id} className="hover:bg-[#FFF9F7]/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#18212F]">{fu.scheduledDate}</div>
                    <div className="text-[10px] text-[#667085]">Booked on {fu.createdAt.split(' ')[0]}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#18212F]">{fu.patientName}</div>
                    <div className="text-[10px] font-mono text-[#667085]">{fu.patientUhid}</div>
                  </td>
                  <td className="py-3 px-4 text-neutral-700 max-w-sm">
                    {fu.reason || 'Routine follow-up review'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      fu.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      fu.scheduledDate === todayStr ? 'bg-amber-100 text-amber-800' :
                      fu.scheduledDate < todayStr ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {fu.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigate('/doctor/patients')}
                      className="px-3.5 py-1.5 bg-[#FFF9F7] hover:bg-white text-xs font-semibold text-[#18212F] border border-[#F1E4E1] rounded-xl flex items-center gap-1 cursor-pointer ml-auto shadow-2xs"
                    >
                      <span>Open Patient</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#F76762]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-[#F1E4E1] p-10 text-center text-xs text-[#667085]">
          No follow-up records found matching this filter.
        </div>
      )}

    </div>
  );
};
