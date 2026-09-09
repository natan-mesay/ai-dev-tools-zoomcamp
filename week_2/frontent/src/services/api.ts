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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMessage = errJson.error;
      else if (errJson.detail) {
        errorMessage = typeof errJson.detail === 'string' ? errJson.detail : (errJson.detail.error || JSON.stringify(errJson.detail));
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Global SSE listener pool
class RealTimeClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(payload: RealTimeEventPayload) => void>> = new Map();
  private reconnectTimer: any = null;

  constructor() {
    this.connect();
  }

  private connect() {
    if (typeof window === 'undefined') return;

    try {
      this.eventSource = new EventSource(`${API_BASE_URL}/events`);

      this.eventSource.onmessage = (event) => {
        if (!event.data) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type) {
            this.notify(parsed);
          }
        } catch {
          // ignore keepalive pings
        }
      };

      this.eventSource.onerror = () => {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 3000);
        }
      };
    } catch (err) {
      console.warn('Could not initialize SSE connection to backend', err);
    }
  }

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

  public notify(envelope: RealTimeEventPayload) {
    const specific = this.listeners.get(envelope.type);
    if (specific) {
      specific.forEach((cb) => cb(envelope));
    }
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      wildcard.forEach((cb) => cb(envelope));
    }
  }
}

const realtimeClient = new RealTimeClient();

/**
 * Centralized Live API Service for MaitreQ.
 * Communicates directly with the FastAPI backend at http://localhost:8000.
 */
export const api = {
  // --- Restaurant ---
  restaurant: {
    get: (): Promise<Restaurant> => {
      return request<Restaurant>('/restaurant');
    },
  },

  // --- Waitlist Management (Host) ---
  waitlist: {
    list: (statusFilter?: string): Promise<WaitlistEntry[]> => {
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '?status=ALL';
      return request<WaitlistEntry[]>(`/waitlist${query}`);
    },

    create: async (dto: CreateWaitlistDTO): Promise<WaitlistEntry> => {
      const res = await request<WaitlistEntry>('/waitlist', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      realtimeClient.notify({
        type: 'waitlist:created',
        payload: res,
        timestamp: new Date().toISOString(),
        sender_id: 'frontend_client',
      });
      return res;
    },

    updateStatus: async (
      id: string,
      status: WaitlistStatus,
      tableId?: string
    ): Promise<WaitlistEntry> => {
      const res = await request<WaitlistEntry>(`/waitlist/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, table_id: tableId }),
      });
      realtimeClient.notify({
        type: 'waitlist:status_change',
        payload: res,
        timestamp: new Date().toISOString(),
        sender_id: 'frontend_client',
      });
      return res;
    },

    edit: async (id: string, dto: UpdateWaitlistDTO): Promise<WaitlistEntry> => {
      const res = await request<WaitlistEntry>(`/waitlist/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      realtimeClient.notify({
        type: 'waitlist:updated',
        payload: res,
        timestamp: new Date().toISOString(),
        sender_id: 'frontend_client',
      });
      return res;
    },

    reorder: async (fromIndex: number, toIndex: number): Promise<WaitlistEntry[]> => {
      const res = await request<WaitlistEntry[]>('/waitlist/reorder', {
        method: 'POST',
        body: JSON.stringify({ from_index: fromIndex, to_index: toIndex }),
      });
      realtimeClient.notify({
        type: 'waitlist:updated',
        payload: res,
        timestamp: new Date().toISOString(),
        sender_id: 'frontend_client',
      });
      return res;
    },
  },

  // --- Table Management (Host) ---
  tables: {
    list: (): Promise<Table[]> => {
      return request<Table[]>('/tables');
    },

    create: async (dto: CreateTableDTO): Promise<Table> => {
      const res = await request<Table>('/tables', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      realtimeClient.notify({
        type: 'tables:updated',
        payload: res,
        timestamp: new Date().toISOString(),
        sender_id: 'frontend_client',
      });
      return res;
    },

    updateStatus: async (
      id: string,
      status: TableStatus,
      freeParty = false
    ): Promise<Table> => {
      const res = await request<Table>(`/tables/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, free_party: freeParty }),
      });
      realtimeClient.notify({
        type: 'tables:updated',
        payload: res,
        timestamp: new Date().toISOString(),
        sender_id: 'frontend_client',
      });
      return res;
    },
  },

  // --- Guest Public Portal ---
  guest: {
    getStatus: (token: string): Promise<GuestStatusResponse> => {
      return request<GuestStatusResponse>(`/status/${token}`);
    },

    cancel: async (token: string): Promise<GuestStatusResponse> => {
      const res = await request<GuestStatusResponse>(`/status/${token}/cancel`, {
        method: 'POST',
      });
      realtimeClient.notify({
        type: 'waitlist:status_change',
        payload: res,
        timestamp: new Date().toISOString(),
        sender_id: 'frontend_client',
      });
      return res;
    },
  },

  // --- Host Dashboard Metrics ---
  stats: {
    get: (): Promise<DashboardStats> => {
      return request<DashboardStats>('/stats');
    },
  },

  // --- Real-time Subscriptions & Demo Controls ---
  realtime: {
    subscribe: (
      eventType: RealTimeEventType | '*',
      callback: (payload: RealTimeEventPayload) => void
    ): (() => void) => {
      return realtimeClient.subscribe(eventType, callback);
    },

    resetDemoData: async (): Promise<void> => {
      await request('/demo/reset', { method: 'POST' });
      realtimeClient.notify({
        type: 'demo:reset',
        timestamp: new Date().toISOString(),
        sender_id: 'frontend_client',
      });
      realtimeClient.notify({
        type: 'waitlist:updated',
        timestamp: new Date().toISOString(),
        sender_id: 'frontend_client',
      });
      realtimeClient.notify({
        type: 'tables:updated',
        timestamp: new Date().toISOString(),
        sender_id: 'frontend_client',
      });
    },
  },
};
