import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type {
  CreateTableDTO,
  CreateWaitlistDTO,
  DashboardStats,
  Restaurant,
  Table,
  TableStatus,
  UpdateWaitlistDTO,
  WaitlistEntry,
} from '../../types';
import { useToast } from '../common/Toast';
import { AddPartyModal } from './AddPartyModal';
import { AddTableModal } from './AddTableModal';
import { EditPartyModal } from './EditPartyModal';
import { GuestLinkModal } from './GuestLinkModal';
import { MetricCards } from './MetricCards';
import { QueueList } from './QueueList';
import { SeatPartyModal } from './SeatPartyModal';
import { TablesGrid } from './TablesGrid';

export const HostDashboard: React.FC = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_waiting: 0,
    total_notified: 0,
    total_seated_today: 0,
    avg_wait_minutes: 0,
    available_tables: 0,
    total_tables: 0,
  });

  // Modal States
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [seatPartyTarget, setSeatPartyTarget] = useState<WaitlistEntry | null>(null);
  const [editPartyTarget, setEditPartyTarget] = useState<WaitlistEntry | null>(null);
  const [guestLinkTarget, setGuestLinkTarget] = useState<WaitlistEntry | null>(null);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      const [restData, waitlistData, tablesData, statsData] = await Promise.all([
        api.restaurant.get(),
        api.waitlist.list(),
        api.tables.list(),
        api.stats.get(),
      ]);
      setRestaurant(restData);
      setWaitlist(waitlistData);
      setTables(tablesData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading host dashboard data', err);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to all real-time events across tabs
    const unsubscribe = api.realtime.subscribe('*', (event) => {
      loadData();
      if (event.type === 'waitlist:status_change' && event.payload?.status === 'CANCELLED') {
        showToast('info', 'Waitlist Updated', `${event.payload.guest_name} cancelled their spot.`);
      }
    });

    return unsubscribe;
  }, []);

  // Handlers
  const handleAddParty = async (dto: CreateWaitlistDTO) => {
    const entry = await api.waitlist.create(dto);
    showToast('success', 'Party Added', `${entry.guest_name} (#${entry.position} in queue) added successfully.`);
    loadData();
  };

  const handleNotifyParty = async (party: WaitlistEntry) => {
    await api.waitlist.updateStatus(party.id, 'NOTIFIED');
    showToast('alert', 'Notification Sent', `Table Ready alert sent to ${party.guest_name} (${party.phone_number}).`);
    loadData();
  };

  const handleSeatParty = async (partyId: string, tableId: string) => {
    const targetParty = waitlist.find((p) => p.id === partyId);
    const targetTable = tables.find((t) => t.id === tableId);
    await api.waitlist.updateStatus(partyId, 'SEATED', tableId);
    showToast(
      'success',
      'Party Seated',
      `${targetParty?.guest_name || 'Guest'} seated at Table ${targetTable?.table_number || ''}.`
    );
    loadData();
  };

  const handleDropPartyOnTable = async (partyId: string, tableId: string) => {
    const targetParty = waitlist.find((p) => p.id === partyId);
    const targetTable = tables.find((t) => t.id === tableId);

    if (!targetParty || !targetTable) return;

    if (targetParty.party_size > targetTable.capacity) {
      showToast(
        'warning',
        'Capacity Alert',
        `${targetParty.guest_name} has ${targetParty.party_size} guests for a ${targetTable.capacity}-seat table.`
      );
    }

    await handleSeatParty(partyId, tableId);
  };

  const handleEditParty = async (id: string, dto: UpdateWaitlistDTO) => {
    await api.waitlist.edit(id, dto);
    showToast('info', 'Updated', 'Party details saved.');
    loadData();
  };

  const handleCancelParty = async (id: string) => {
    await api.waitlist.updateStatus(id, 'CANCELLED');
    showToast('warning', 'Party Cancelled', 'Waitlist entry was removed.');
    loadData();
  };

  const handleNoShowParty = async (id: string) => {
    await api.waitlist.updateStatus(id, 'NO_SHOW');
    showToast('warning', 'Marked No-Show', 'Party marked as no-show.');
    loadData();
  };

  const handleReorder = async (from: number, to: number) => {
    await api.waitlist.reorder(from, to);
    loadData();
  };

  const handleAddTable = async (dto: CreateTableDTO) => {
    const tbl = await api.tables.create(dto);
    showToast('success', 'Table Added', `Table ${tbl.table_number} (${tbl.capacity} seats) added.`);
    loadData();
  };

  const handleUpdateTableStatus = async (id: string, status: TableStatus, freeParty = false) => {
    await api.tables.updateStatus(id, status, freeParty);
    loadData();
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-slate-50/70 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Restaurant Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {restaurant?.name || 'MaitreQ Host Stand'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Front-of-House Dining Floor & Live Waitlist Management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <MetricCards stats={stats} />

      {/* Main Content Split: Left (Dining Floor & Square Tables) | Right (Queue Management) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Dining Floor Plan with Visual Square Tables */}
        <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1">
          <TablesGrid
            tables={tables}
            onAddTableClick={() => setIsAddTableOpen(true)}
            onUpdateTableStatus={handleUpdateTableStatus}
            onDropParty={handleDropPartyOnTable}
          />
        </div>

        {/* Right: Queue Management with Draggable Cards */}
        <div className="lg:col-span-5 xl:col-span-4 order-1 lg:order-2">
          <QueueList
            entries={waitlist}
            onAddPartyClick={() => setIsAddPartyOpen(true)}
            onNotifyParty={handleNotifyParty}
            onSeatPartyClick={(party) => setSeatPartyTarget(party)}
            onEditPartyClick={(party) => setEditPartyTarget(party)}
            onCancelParty={handleCancelParty}
            onNoShowParty={handleNoShowParty}
            onOpenGuestLink={(party) => setGuestLinkTarget(party)}
            onReorder={handleReorder}
          />
        </div>
      </div>

      {/* Modals */}
      <AddPartyModal
        isOpen={isAddPartyOpen}
        onClose={() => setIsAddPartyOpen(false)}
        onSubmit={handleAddParty}
        suggestedWaitMinutes={stats.avg_wait_minutes || 15}
      />

      <SeatPartyModal
        isOpen={!!seatPartyTarget}
        onClose={() => setSeatPartyTarget(null)}
        party={seatPartyTarget}
        tables={tables}
        onConfirmSeat={handleSeatParty}
      />

      <EditPartyModal
        isOpen={!!editPartyTarget}
        onClose={() => setEditPartyTarget(null)}
        party={editPartyTarget}
        onSubmit={handleEditParty}
      />

      <AddTableModal
        isOpen={isAddTableOpen}
        onClose={() => setIsAddTableOpen(false)}
        onSubmit={handleAddTable}
      />

      <GuestLinkModal
        isOpen={!!guestLinkTarget}
        onClose={() => setGuestLinkTarget(null)}
        party={guestLinkTarget}
      />
    </div>
  );
};

