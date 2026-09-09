import {
  ArrowDown,
  ArrowUp,
  Bell,
  CheckCircle,
  Clock,
  Edit2,
  MessageSquare,
  Phone,
  Plus,
  QrCode,
  Search,
  UserX,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { WaitlistEntry } from '../../types';
import { PartySizeBadge, StatusBadge } from '../common/Badge';

interface QueueListProps {
  entries: WaitlistEntry[];
  onAddPartyClick: () => void;
  onNotifyParty: (party: WaitlistEntry) => void;
  onSeatPartyClick: (party: WaitlistEntry) => void;
  onEditPartyClick: (party: WaitlistEntry) => void;
  onCancelParty: (id: string) => void;
  onNoShowParty: (id: string) => void;
  onOpenGuestLink: (party: WaitlistEntry) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export const QueueList: React.FC<QueueListProps> = ({
  entries,
  onAddPartyClick,
  onNotifyParty,
  onSeatPartyClick,
  onEditPartyClick,
  onCancelParty,
  onNoShowParty,
  onOpenGuestLink,
  onReorder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'WAITING' | 'NOTIFIED' | 'SEATED' | 'ALL'>('ACTIVE');
  const [, setNow] = useState(Date.now());

  // Update elapsed counters every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedMinutes = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const filteredEntries = entries.filter((entry) => {
    // Search match
    const matchesSearch =
      entry.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.phone_number.includes(searchQuery) ||
      (entry.notes && entry.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Filter match
    if (statusFilter === 'ACTIVE') {
      return entry.status === 'WAITING' || entry.status === 'NOTIFIED';
    }
    if (statusFilter === 'ALL') return true;
    return entry.status === statusFilter;
  });

  const activeWaitingList = entries.filter((e) => e.status === 'WAITING' || e.status === 'NOTIFIED');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name, phone, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm"
          />
        </div>

        {/* Add Party Button */}
        <button
          onClick={onAddPartyClick}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Party</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs bg-white">
        {[
          { key: 'ACTIVE', label: 'Active Queue', count: activeWaitingList.length },
          { key: 'WAITING', label: 'Waiting', count: entries.filter((e) => e.status === 'WAITING').length },
          { key: 'NOTIFIED', label: 'Notified', count: entries.filter((e) => e.status === 'NOTIFIED').length },
          { key: 'SEATED', label: 'Seated', count: entries.filter((e) => e.status === 'SEATED').length },
          { key: 'ALL', label: 'All / History', count: entries.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.key ? 'bg-slate-800 text-amber-300' : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Queue Card List */}
      <div className="p-4 flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No parties found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {searchQuery
                ? 'Try adjusting your search terms or filters.'
                : 'The waitlist queue is currently empty. Click "Add Party" to register guests.'}
            </p>
          </div>
        ) : (
          filteredEntries.map((party) => {
            const isWaiting = party.status === 'WAITING';
            const isNotified = party.status === 'NOTIFIED';
            const elapsedMins = getElapsedMinutes(party.created_at);
            const activeIndex = activeWaitingList.findIndex((p) => p.id === party.id);

            return (
              <div
                key={party.id}
                className="py-3.5 first:pt-1 last:pb-1 flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:bg-slate-50/70 p-2.5 rounded-xl transition-all"
              >
                {/* Left: Position & Guest Details */}
                <div className="flex items-start gap-3 min-w-0">
                  {/* Position Badge */}
                  {party.position > 0 ? (
                    <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-900 border border-amber-200/90 font-black text-sm flex items-center justify-center shrink-0">
                      #{party.position}
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0">
                      —
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-base leading-tight">{party.guest_name}</h4>
                      <PartySizeBadge size={party.party_size} />
                      <StatusBadge status={party.status} size="sm" pulse={isNotified} />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {party.phone_number}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Joined {elapsedMins}m ago
                      </span>
                      {party.estimated_wait_minutes > 0 && (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-amber-200/50">
                          Est: ~{party.estimated_wait_minutes}m
                        </span>
                      )}
                      {party.notified_at && (
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                          Notified {getElapsedMinutes(party.notified_at)}m ago
                        </span>
                      )}
                    </div>

                    {party.notes && (
                      <div className="mt-1.5 flex items-start gap-1 text-xs text-slate-600 bg-slate-100/80 px-2 py-1 rounded-lg">
                        <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                        <span className="italic">{party.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center flex-wrap gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Reorder Buttons (only for active queue) */}
                  {activeIndex >= 0 && (
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                      <button
                        onClick={() => onReorder(activeIndex, activeIndex - 1)}
                        disabled={activeIndex === 0}
                        title="Move Up in Queue"
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onReorder(activeIndex, activeIndex + 1)}
                        disabled={activeIndex === activeWaitingList.length - 1}
                        title="Move Down in Queue"
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Notify Button */}
                  {isWaiting && (
                    <button
                      onClick={() => onNotifyParty(party)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Send Table Ready Alert (SMS)"
                    >
                      <Bell className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Notify</span>
                    </button>
                  )}

                  {/* Seat Party Button */}
                  {(isWaiting || isNotified) && (
                    <button
                      onClick={() => onSeatPartyClick(party)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-colors"
                      title="Assign Table and Seat"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Seat</span>
                    </button>
                  )}

                  {/* QR / Link Modal */}
                  <button
                    onClick={() => onOpenGuestLink(party)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
                    title="View Guest Tracking Link & QR"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => onEditPartyClick(party)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
                    title="Edit Party Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Cancel / No-show dropdown/actions */}
                  {(isWaiting || isNotified) && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (confirm(`Cancel waitlist entry for ${party.guest_name}?`)) {
                            onCancelParty(party.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                        title="Cancel Entry"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Mark ${party.guest_name} as No-Show?`)) {
                            onNoShowParty(party.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors"
                        title="Mark No-Show"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
