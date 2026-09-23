export type WaitlistStatus = 'WAITING' | 'NOTIFIED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address?: string;
  created_at: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  current_party_id?: string | null;
  current_guest_name?: string | null;
  updated_at: string;
}

export interface WaitlistEntry {
  id: string;
  restaurant_id: string;
  table_id?: string | null;
  guest_name: string;
  phone_number: string;
  party_size: number;
  notes?: string;
  status: WaitlistStatus;
  public_token: string;
  position: number;
  estimated_wait_minutes: number;
  created_at: string;
  notified_at?: string | null;
  seated_at?: string | null;
}

export interface GuestStatusResponse {
  id: string;
  guest_name: string;
  phone_number: string;
  party_size: number;
  status: WaitlistStatus;
  position: number;
  estimated_wait_minutes: number;
  created_at: string;
  notified_at?: string | null;
  seated_at?: string | null;
  restaurant_name: string;
  restaurant_phone: string;
  assigned_table_number?: string | null;
}

export interface CreateWaitlistDTO {
  guest_name: string;
  phone_number: string;
  party_size: number;
  notes?: string;
  estimated_wait_minutes?: number;
}

export interface UpdateWaitlistDTO {
  guest_name?: string;
  phone_number?: string;
  party_size?: number;
  notes?: string;
  estimated_wait_minutes?: number;
  status?: WaitlistStatus;
  table_id?: string | null;
}

export interface CreateTableDTO {
  table_number: string;
  capacity: number;
  status?: TableStatus;
}

export interface DashboardStats {
  total_waiting: number;
  total_notified: number;
  total_seated_today: number;
  avg_wait_minutes: number;
  available_tables: number;
  total_tables: number;
}

export type RealTimeEventType =
  | 'waitlist:created'
  | 'waitlist:updated'
  | 'waitlist:deleted'
  | 'waitlist:status_change'
  | 'tables:updated'
  | 'demo:reset';

export interface RealTimeEventPayload {
  type: RealTimeEventType;
  payload?: any;
  timestamp: string;
  sender_id: string;
}
