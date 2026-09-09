import {
  ArrowDown,
  ArrowUp,
  Bell,
  CheckCircle,
  Clock,
  Edit2,
  GripVertical,
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
  const [draggingPartyId, setDraggingPartyId] = useState<string | null>(null);
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
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/60">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Waitlist Queue</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeWaitingList.length} parties currently waiting
            </p>
          </div>

          {/* Add Party Button */}
          <button
            onClick={onAddPartyClick}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Party</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search name, phone, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs bg-white">
        {[
          { key: 'ACTIVE', label: 'Active', count: activeWaitingList.length },
          { key: 'WAITING', label: 'Waiting', count: entries.filter((e) => e.status === 'WAITING').length },
          { key: 'NOTIFIED', label: 'Notified', count: entries.filter((e) => e.status === 'NOTIFIED').length },
          { key: 'SEATED', label: 'Seated', count: entries.filter((e) => e.status === 'SEATED').length },
          { key: 'ALL', label: 'All', count: entries.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key as any)}
            className={`px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white shadow-2xs'
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
      <div className="p-3 flex-1 overflow-y-auto space-y-2.5 max-h-[660px]">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No parties in queue</h4>
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
            const isDraggable = isWaiting || isNotified;
            const isBeingDragged = draggingPartyId === party.id;
            const elapsedMins = getElapsedMinutes(party.created_at);
            const activeIndex = activeWaitingList.findIndex((p) => p.id === party.id);

            return (
              <div
                key={party.id}
                draggable={isDraggable}
                onDragStart={(e) => {
                  setDraggingPartyId(party.id);
                  e.dataTransfer.setData('text/plain', party.id);
                  e.dataTransfer.setData('partyId', party.id);
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({ id: party.id, name: party.guest_name, size: party.party_size })
                  );
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => setDraggingPartyId(null)}
                className={`p-3 rounded-xl border transition-all duration-150 flex flex-col gap-2 relative ${
                  isBeingDragged
                    ? 'opacity-40 border-dashed border-amber-400 bg-amber-50/50 scale-95'
                    : isDraggable
                    ? 'bg-white border-slate-200/90 shadow-2xs hover:border-amber-400 hover:shadow-xs cursor-grab active:cursor-grabbing'
                    : 'bg-slate-50/70 border-slate-200 text-slate-500'
                }`}
              >
                {/* Main Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Drag Handle & Position Badge */}
                    {isDraggable && (
                      <div
                        className="text-slate-400 hover:text-slate-700 cursor-grab shrink-0 -ml-1"
                        title="Drag onto an available table to seat"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}

                    {party.position > 0 ? (
                      <div className="w-8 h-8 rounded-xl bg-amber-100/90 text-amber-900 border border-amber-200 font-black text-xs flex items-center justify-center shrink-0">
                        #{party.position}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0">
                        —
                      </div>
                    )}

                    {/* Guest Name & Party Size */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-sm leading-tight truncate">
                          {party.guest_name}
                        </h4>
                        <PartySizeBadge size={party.party_size} />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {party.phone_number}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {elapsedMins}m
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <StatusBadge status={party.status} size="sm" pulse={isNotified} />
                </div>

                {/* Notes & Extra details */}
                {party.notes && (
                  <div className="flex items-start gap-1 text-[11px] text-slate-600 bg-slate-100/80 px-2 py-1 rounded-lg">
                    <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    <span className="italic truncate">{party.notes}</span>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap text-xs">
                  {/* Reorder in Queue (active only) */}
                  {activeIndex >= 0 ? (
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorder(activeIndex, activeIndex - 1);
                        }}
                        disabled={activeIndex === 0}
                        title="Move Up"
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorder(activeIndex, activeIndex + 1);
                        }}
                        disabled={activeIndex === activeWaitingList.length - 1}
                        title="Move Down"
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Notify */}
                    {isWaiting && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNotifyParty(party);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Send SMS notification"
                      >
                        <Bell className="w-3 h-3 text-indigo-600" />
                        <span>Notify</span>
                      </button>
                    )}

                    {/* Seat Modal Fallback */}
                    {isDraggable && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSeatPartyClick(party);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Select Table and Seat"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Seat</span>
                      </button>
                    )}

                    {/* QR / Link Preview */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenGuestLink(party);
                      }}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                      title="Guest Status Link & QR"
                    >
                      <QrCode className="w-3 h-3" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPartyClick(party);
                      }}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                      title="Edit Party"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    {/* Cancel / No-show */}
                    {isDraggable && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Cancel waitlist entry for ${party.guest_name}?`)) {
                              onCancelParty(party.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                          title="Cancel Entry"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Mark ${party.guest_name} as No-Show?`)) {
                              onNoShowParty(party.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
                          title="Mark No-Show"
                        >
                          <UserX className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

