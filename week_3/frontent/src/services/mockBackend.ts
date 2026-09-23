import type {
  CreateTableDTO,
  CreateWaitlistDTO,
  DashboardStats,
  GuestStatusResponse,
  RealTimeEventPayload,
  RealTimeEventType,
  Restaurant,
  Table,
  TableStatus,
  UpdateWaitlistDTO,
  WaitlistEntry,
  WaitlistStatus,
} from '../types';
import { INITIAL_RESTAURANT, INITIAL_TABLES, INITIAL_WAITLIST } from './mockData';

const STORAGE_KEYS = {
  RESTAURANT: 'maitreq_mock_restaurant_v1',
  TABLES: 'maitreq_mock_tables_v1',
  WAITLIST: 'maitreq_mock_waitlist_v1',
};

const TAB_ID = 'tab_' + Math.random().toString(36).substring(2, 9);
const CHANNEL_NAME = 'maitreq_broadcast_channel';

class MockBackendEngine {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<(payload: RealTimeEventPayload) => void>> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event: MessageEvent<RealTimeEventPayload>) => {
          if (event.data && event.data.sender_id !== TAB_ID) {
            this.notifyInternal(event.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported in this environment', err);
      }
    }
  }

  // --- Real-time PubSub ---
  public subscribe(
    eventType: RealTimeEventType | '*',
    callback: (payload: RealTimeEventPayload) => void
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  private broadcast(type: RealTimeEventType, payload?: any) {
    const envelope: RealTimeEventPayload = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      sender_id: TAB_ID,
    };

    // 1. Notify listeners in current tab
    this.notifyInternal(envelope);

    // 2. Broadcast across tabs
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(envelope);
    }
  }

  private notifyInternal(envelope: RealTimeEventPayload) {
    // Specific listeners
    const specific = this.listeners.get(envelope.type);
    if (specific) {
      specific.forEach((cb) => {
        try {
          cb(envelope);
        } catch (e) {
          console.error('Error in event listener', e);
        }
      });
    }
    // Wildcard listeners
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      wildcard.forEach((cb) => {
        try {
          cb(envelope);
        } catch (e) {
          console.error('Error in wildcard event listener', e);
        }
      });
    }
  }

  // --- Storage Accessors ---
  public getRestaurant(): Restaurant {
    const raw = localStorage.getItem(STORAGE_KEYS.RESTAURANT);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error(e);
      }
    }
    this.saveRestaurant(INITIAL_RESTAURANT);
    return INITIAL_RESTAURANT;
  }

  private saveRestaurant(rest: Restaurant) {
    localStorage.setItem(STORAGE_KEYS.RESTAURANT, JSON.stringify(rest));
  }

  public getTables(): Table[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TABLES);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error(e);
      }
    }
    this.saveTables(INITIAL_TABLES);
    return INITIAL_TABLES;
  }

  private saveTables(tables: Table[]) {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  }

  public getWaitlist(): WaitlistEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WAITLIST);
    let list: WaitlistEntry[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch (e) {
        console.error(e);
        list = INITIAL_WAITLIST;
      }
    } else {
      list = INITIAL_WAITLIST;
      this.saveWaitlist(list);
    }

    return this.recalculatePositions(list);
  }

  private saveWaitlist(list: WaitlistEntry[]) {
    const calculated = this.recalculatePositions(list);
    localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(calculated));
  }

  private recalculatePositions(list: WaitlistEntry[]): WaitlistEntry[] {
    let activeQueueIndex = 1;
    return list.map((item) => {
      if (item.status === 'WAITING' || item.status === 'NOTIFIED') {
        const pos = activeQueueIndex++;
        const defaultWait = Math.max(5, (pos - 1) * 10 + (item.party_size > 4 ? 10 : 5));
        return {
          ...item,
          position: pos,
          estimated_wait_minutes: item.estimated_wait_minutes || defaultWait,
        };
      }
      return {
        ...item,
        position: 0,
        estimated_wait_minutes: 0,
      };
    });
  }

  // --- Reset Seed Data ---
  public resetToSeed(): void {
    localStorage.setItem(STORAGE_KEYS.RESTAURANT, JSON.stringify(INITIAL_RESTAURANT));
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
    localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(INITIAL_WAITLIST));
    this.broadcast('demo:reset');
    this.broadcast('waitlist:updated');
    this.broadcast('tables:updated');
  }

  // --- Waitlist Operations ---
  public addParty(dto: CreateWaitlistDTO): WaitlistEntry {
    const waitlist = this.getWaitlist();
    const token = 'guest-' + Math.random().toString(36).substring(2, 6) + '-' + Math.floor(1000 + Math.random() * 9000);

    const activeWaitingCount = waitlist.filter((p) => p.status === 'WAITING' || p.status === 'NOTIFIED').length;
    const computedWait = dto.estimated_wait_minutes || Math.max(10, activeWaitingCount * 12 + (dto.party_size > 4 ? 15 : 5));

    const newEntry: WaitlistEntry = {
      id: 'entry-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      restaurant_id: 'rest-001',
      guest_name: dto.guest_name.trim(),
      phone_number: dto.phone_number.trim(),
      party_size: Number(dto.party_size),
      notes: dto.notes?.trim() || undefined,
      status: 'WAITING',
      public_token: token,
      position: activeWaitingCount + 1,
      estimated_wait_minutes: computedWait,
      created_at: new Date().toISOString(),
    };

    const updated = [newEntry, ...waitlist];
    this.saveWaitlist(updated);
    this.broadcast('waitlist:created', newEntry);
    this.broadcast('waitlist:updated');
    return newEntry;
  }

  public updatePartyStatus(id: string, status: WaitlistStatus, tableId?: string): WaitlistEntry {
    const waitlist = this.getWaitlist();
    const tables = this.getTables();
    let updatedEntry: WaitlistEntry | null = null;

    const updatedWaitlist = waitlist.map((entry) => {
      if (entry.id !== id) return entry;

      const modified: WaitlistEntry = {
        ...entry,
        status,
        table_id: tableId !== undefined ? tableId : entry.table_id,
      };

      if (status === 'NOTIFIED' && !entry.notified_at) {
        modified.notified_at = new Date().toISOString();
      } else if (status === 'SEATED') {
        modified.seated_at = new Date().toISOString();
        if (!modified.notified_at) modified.notified_at = new Date().toISOString();
      } else if (status === 'CANCELLED' || status === 'NO_SHOW') {
        modified.position = 0;
      }

      updatedEntry = modified;
      return modified;
    });

    if (!updatedEntry) {
      throw new Error(`Waitlist entry with id ${id} not found`);
    }

    // Handle Table transitions if seating
    if (status === 'SEATED' && tableId) {
      const updatedTables = tables.map((tbl) => {
        if (tbl.id === tableId) {
          return {
            ...tbl,
            status: 'OCCUPIED' as TableStatus,
            current_party_id: (updatedEntry as WaitlistEntry).id,
            current_guest_name: (updatedEntry as WaitlistEntry).guest_name,
            updated_at: new Date().toISOString(),
          };
        }
        return tbl;
      });
      this.saveTables(updatedTables);
      this.broadcast('tables:updated');
    }

    this.saveWaitlist(updatedWaitlist);
    this.broadcast('waitlist:status_change', updatedEntry);
    this.broadcast('waitlist:updated');
    return updatedEntry;
  }

  public editParty(id: string, dto: UpdateWaitlistDTO): WaitlistEntry {
    const waitlist = this.getWaitlist();
    let updatedEntry: WaitlistEntry | null = null;

    const updatedWaitlist = waitlist.map((entry) => {
      if (entry.id !== id) return entry;
      const modified: WaitlistEntry = {
        ...entry,
        ...dto,
      };
      updatedEntry = modified;
      return modified;
    });

    if (!updatedEntry) {
      throw new Error(`Waitlist entry with id ${id} not found`);
    }

    this.saveWaitlist(updatedWaitlist);
    this.broadcast('waitlist:updated');
    return updatedEntry;
  }

  public reorderQueue(fromIndex: number, toIndex: number): WaitlistEntry[] {
    const waitlist = this.getWaitlist();
    const active = waitlist.filter((w) => w.status === 'WAITING' || w.status === 'NOTIFIED');
    const inactive = waitlist.filter((w) => w.status !== 'WAITING' && w.status !== 'NOTIFIED');

    if (fromIndex >= 0 && fromIndex < active.length && toIndex >= 0 && toIndex < active.length) {
      const [moved] = active.splice(fromIndex, 1);
      active.splice(toIndex, 0, moved);
      const combined = [...active, ...inactive];
      this.saveWaitlist(combined);
      this.broadcast('waitlist:updated');
      return this.getWaitlist();
    }
    return waitlist;
  }

  // --- Table Operations ---
  public addTable(dto: CreateTableDTO): Table {
    const tables = this.getTables();
    const newTable: Table = {
      id: 'tbl-' + Date.now().toString(36),
      restaurant_id: 'rest-001',
      table_number: dto.table_number.trim(),
      capacity: Number(dto.capacity),
      status: dto.status || 'AVAILABLE',
      updated_at: new Date().toISOString(),
    };

    const updated = [...tables, newTable];
    this.saveTables(updated);
    this.broadcast('tables:updated');
    return newTable;
  }

  public updateTableStatus(id: string, status: TableStatus, freeParty = false): Table {
    const tables = this.getTables();
    let updatedTable: Table | null = null;

    const updatedTables = tables.map((tbl) => {
      if (tbl.id !== id) return tbl;
      const modified: Table = {
        ...tbl,
        status,
        current_party_id: status === 'AVAILABLE' || freeParty ? null : tbl.current_party_id,
        current_guest_name: status === 'AVAILABLE' || freeParty ? null : tbl.current_guest_name,
        updated_at: new Date().toISOString(),
      };
      updatedTable = modified;
      return modified;
    });

    if (!updatedTable) {
      throw new Error(`Table with id ${id} not found`);
    }

    this.saveTables(updatedTables);
    this.broadcast('tables:updated');
    return updatedTable;
  }

  // --- Guest Public Portal ---
  public getGuestStatusByToken(token: string): GuestStatusResponse {
    const waitlist = this.getWaitlist();
    const tables = this.getTables();
    const restaurant = this.getRestaurant();

    const entry = waitlist.find((e) => e.public_token === token);
    if (!entry) {
      throw new Error('Waitlist entry not found for token: ' + token);
    }

    let assignedTableNumber: string | null = null;
    if (entry.table_id) {
      const tbl = tables.find((t) => t.id === entry.table_id);
      if (tbl) assignedTableNumber = tbl.table_number;
    }

    return {
      id: entry.id,
      guest_name: entry.guest_name,
      phone_number: entry.phone_number,
      party_size: entry.party_size,
      status: entry.status,
      position: entry.position,
      estimated_wait_minutes: entry.estimated_wait_minutes,
      created_at: entry.created_at,
      notified_at: entry.notified_at,
      seated_at: entry.seated_at,
      restaurant_name: restaurant.name,
      restaurant_phone: restaurant.phone,
      assigned_table_number: assignedTableNumber,
    };
  }

  public cancelGuestByToken(token: string): GuestStatusResponse {
    const waitlist = this.getWaitlist();
    const entry = waitlist.find((e) => e.public_token === token);
    if (!entry) {
      throw new Error('Waitlist entry not found');
    }

    this.updatePartyStatus(entry.id, 'CANCELLED');
    return this.getGuestStatusByToken(token);
  }

  // --- Analytics & Stats ---
  public getDashboardStats(): DashboardStats {
    const waitlist = this.getWaitlist();
    const tables = this.getTables();

    const waiting = waitlist.filter((p) => p.status === 'WAITING').length;
    const notified = waitlist.filter((p) => p.status === 'NOTIFIED').length;
    const seatedToday = waitlist.filter((p) => p.status === 'SEATED').length;
    const availableTables = tables.filter((t) => t.status === 'AVAILABLE').length;

    const waitingParties = waitlist.filter((p) => p.status === 'WAITING');
    const totalEstWait = waitingParties.reduce((acc, p) => acc + (p.estimated_wait_minutes || 0), 0);
    const avgWait = waitingParties.length > 0 ? Math.round(totalEstWait / waitingParties.length) : 15;

    return {
      total_waiting: waiting,
      total_notified: notified,
      total_seated_today: seatedToday,
      avg_wait_minutes: avgWait,
      available_tables: availableTables,
      total_tables: tables.length,
    };
  }
}

export const mockBackend = new MockBackendEngine();
