import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './api';

describe('Frontend API Client Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes all required API namespaces', () => {
    expect(api.restaurant).toBeDefined();
    expect(api.waitlist).toBeDefined();
    expect(api.tables).toBeDefined();
    expect(api.guest).toBeDefined();
    expect(api.stats).toBeDefined();
    expect(api.realtime).toBeDefined();
  });

  it('allows subscribing and unsubscribing from realtime events', () => {
    const callback = vi.fn();
    const unsubscribe = api.realtime.subscribe('*', callback);
    expect(typeof unsubscribe).toBe('function');

    // Unsubscribe cleanly
    unsubscribe();
  });

  it('formats requests with JSON headers and handles fetch responses', async () => {
    const mockRestaurant = {
      id: 'rest-1',
      name: 'MaitreQ Bistro',
      total_tables: 8,
      active_waitlist_count: 2,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRestaurant,
    } as any);

    const result = await api.restaurant.get();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/restaurant'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual(mockRestaurant);
  });

  it('throws descriptive error messages on API failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Party size must be greater than 0' }),
    } as any);

    await expect(
      api.waitlist.create({ guest_name: 'Alex', phone_number: '+15551234567', party_size: 0 })
    ).rejects.toThrow('Party size must be greater than 0');
  });
});
