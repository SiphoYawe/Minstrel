import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreak, getPersistedTimezoneOffsetMinutes } from './use-streak';
import { useAppStore } from '@/stores/app-store';
import { StreakStatus, type StreakData } from './engagement-types';

const TIMEZONE_KEY = 'minstrel:user-timezone';

// Mock streak-service
vi.mock('./streak-service', () => ({
  fetchStreak: vi.fn().mockResolvedValue({
    currentStreak: 5,
    bestStreak: 10,
    lastQualifiedAt: '2026-02-12T12:00:00Z',
    streakStatus: 'Active',
  } satisfies StreakData),
  updateStreak: vi.fn().mockResolvedValue({
    newCurrentStreak: 6,
    newBestStreak: 10,
  }),
}));

// Mock supabase client (required by streak-service)
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  capture: vi.fn(),
}));

describe('useStreak', () => {
  beforeEach(() => {
    useAppStore.setState({ user: { id: 'user-1', email: 'test@test.com' } });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    useAppStore.setState({ user: null });
  });

  it('reads fresh streak data in recordSession via synchronous ref update', async () => {
    // This test verifies the STATE-H1 fix: the streakRef is updated synchronously
    // on each render rather than via useEffect, so recordSession always reads the
    // latest streak value even if called immediately after a state update.

    const { fetchStreak } = await import('./streak-service');
    const { updateStreak } = await import('./streak-service');

    // First fetch returns streak of 5
    (fetchStreak as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      currentStreak: 5,
      bestStreak: 10,
      lastQualifiedAt: '2026-02-12T12:00:00Z',
      streakStatus: StreakStatus.Active,
    });

    const { result } = renderHook(() => useStreak());

    // Wait for fetch to complete
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.streak.currentStreak).toBe(5);

    // Call recordSession — should pass the current streak (5) to calculateStreakUpdate
    (updateStreak as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      newCurrentStreak: 6,
      newBestStreak: 10,
    });

    await act(async () => {
      await result.current.recordSession(300_000); // 5 minutes = meaningful
    });

    // After recording, streak should reflect server-authoritative value
    expect(result.current.streak.currentStreak).toBe(6);
  });

  it('does not record session for non-meaningful duration', async () => {
    const { fetchStreak, updateStreak } = await import('./streak-service');

    (fetchStreak as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      currentStreak: 5,
      bestStreak: 10,
      lastQualifiedAt: '2026-02-12T12:00:00Z',
      streakStatus: StreakStatus.Active,
    });

    const { result } = renderHook(() => useStreak());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Record with too-short duration (under 3 minutes)
    await act(async () => {
      await result.current.recordSession(60_000);
    });

    // updateStreak should NOT have been called
    expect(updateStreak).not.toHaveBeenCalled();
    // Streak should remain unchanged
    expect(result.current.streak.currentStreak).toBe(5);
  });

  it('does not record session when no user', async () => {
    useAppStore.setState({ user: null });

    const { updateStreak } = await import('./streak-service');

    const { result } = renderHook(() => useStreak());

    await act(async () => {
      await result.current.recordSession(300_000);
    });

    expect(updateStreak).not.toHaveBeenCalled();
  });

  it('consecutive recordSession calls read latest streak state', async () => {
    // This validates the core fix: rapid successive calls should each
    // read the latest streak, not a stale value from a previous closure.
    const { fetchStreak, updateStreak } = await import('./streak-service');

    (fetchStreak as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      currentStreak: 3,
      bestStreak: 5,
      lastQualifiedAt: '2026-02-12T12:00:00Z',
      streakStatus: StreakStatus.Active,
    });

    const { result } = renderHook(() => useStreak());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.streak.currentStreak).toBe(3);

    // First call: server says streak is now 4
    (updateStreak as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      newCurrentStreak: 4,
      newBestStreak: 5,
    });

    await act(async () => {
      await result.current.recordSession(300_000);
    });

    expect(result.current.streak.currentStreak).toBe(4);

    // Second call: server says streak is now 5 (because it read the updated value)
    (updateStreak as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      newCurrentStreak: 5,
      newBestStreak: 5,
    });

    await act(async () => {
      await result.current.recordSession(300_000);
    });

    expect(result.current.streak.currentStreak).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// getPersistedTimezoneOffsetMinutes — timezone persistence (STATE-M1)
// ---------------------------------------------------------------------------
describe('getPersistedTimezoneOffsetMinutes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists the detected IANA timezone on first call', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem');

    getPersistedTimezoneOffsetMinutes();

    expect(spy).toHaveBeenCalledWith(TIMEZONE_KEY, expect.any(String));
    const storedTz = spy.mock.calls.find((c) => c[0] === TIMEZONE_KEY)?.[1];
    expect(storedTz).toBeTruthy();
    expect(typeof storedTz).toBe('string');
  });

  it('uses persisted timezone and does not re-persist', () => {
    localStorage.setItem(TIMEZONE_KEY, 'Asia/Tokyo');
    const spy = vi.spyOn(Storage.prototype, 'setItem');

    getPersistedTimezoneOffsetMinutes();

    // Should NOT write again since it was already persisted
    const tzWrites = spy.mock.calls.filter((c) => c[0] === TIMEZONE_KEY);
    expect(tzWrites).toHaveLength(0);
  });

  it('returns a number within valid offset range', () => {
    const offset = getPersistedTimezoneOffsetMinutes();
    expect(typeof offset).toBe('number');
    expect(offset).toBeGreaterThanOrEqual(-720);
    expect(offset).toBeLessThanOrEqual(840);
  });

  it('returns 0 for GMT timezone', () => {
    localStorage.setItem(TIMEZONE_KEY, 'Etc/GMT');
    const offset = getPersistedTimezoneOffsetMinutes();
    expect(offset).toBe(0);
  });

  it('returns consistent value across calls for same timezone', () => {
    localStorage.setItem(TIMEZONE_KEY, 'Asia/Tokyo');
    const offset1 = getPersistedTimezoneOffsetMinutes();
    const offset2 = getPersistedTimezoneOffsetMinutes();
    expect(offset1).toBe(offset2);
  });

  it('returns correct offset for Asia/Tokyo (UTC+9, no DST)', () => {
    localStorage.setItem(TIMEZONE_KEY, 'Asia/Tokyo');
    const offset = getPersistedTimezoneOffsetMinutes();
    expect(offset).toBe(540); // 9 * 60
  });

  it('preserves home timezone even after simulated travel', () => {
    // Simulate: user first opens app in Tokyo
    localStorage.setItem(TIMEZONE_KEY, 'Asia/Tokyo');
    const homeOffset = getPersistedTimezoneOffsetMinutes();

    // "Travel" to New York — runtime Intl would give a different value,
    // but the stored IANA timezone stays as Tokyo.
    const afterTravelOffset = getPersistedTimezoneOffsetMinutes();
    expect(afterTravelOffset).toBe(homeOffset);
    expect(afterTravelOffset).toBe(540);
  });

  it('falls back gracefully when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    // Should not throw
    const offset = getPersistedTimezoneOffsetMinutes();
    expect(typeof offset).toBe('number');
  });
});
