// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { XpBreakdown } from './engagement-types';

// Mock the Supabase client before importing the module under test
const mockRpc = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    rpc: mockRpc,
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return {
              eq: (...eq2Args: unknown[]) => {
                mockEq(...eq2Args);
                return {
                  maybeSingle: mockMaybeSingle,
                };
              },
            };
          },
        };
      },
    }),
  }),
}));

// Import after mocks are set up
import { awardXp, fetchLifetimeXp } from './xp-service';

function makeBreakdown(totalXp: number): XpBreakdown {
  return {
    practiceXp: totalXp,
    timingBonusXp: 0,
    drillCompletionXp: 0,
    newRecordXp: 0,
    totalXp,
  };
}

describe('awardXp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls RPC with correct parameters and returns server value', async () => {
    mockRpc.mockResolvedValue({
      data: [{ new_lifetime_xp: 142, new_best_xp: 142 }],
      error: null,
    });

    const breakdown = makeBreakdown(42);
    const result = await awardXp('user-123', breakdown);

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('increment_xp', {
      p_user_id: 'user-123',
      p_delta: 42,
      p_metadata: breakdown,
      p_last_qualified_at: expect.any(String),
    });
    expect(result).toEqual({ success: true, newTotal: 142 });
  });

  it('returns success with no newTotal when totalXp is zero', async () => {
    const breakdown = makeBreakdown(0);
    const result = await awardXp('user-123', breakdown);

    expect(mockRpc).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
    expect(result.newTotal).toBeUndefined();
  });

  it('returns success with no newTotal when totalXp is negative', async () => {
    const breakdown = makeBreakdown(-5);
    const result = await awardXp('user-123', breakdown);

    expect(mockRpc).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
    expect(result.newTotal).toBeUndefined();
  });

  it('returns { success: false } on RPC error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Database unavailable' } });

    const breakdown = makeBreakdown(10);
    const result = await awardXp('user-123', breakdown);

    expect(result).toEqual({ success: false });
    expect(result.newTotal).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith('[XP] Failed to award XP:', 'Database unavailable');
    consoleSpy.mockRestore();
  });

  it('passes breakdown as metadata and returns server XP', async () => {
    mockRpc.mockResolvedValue({
      data: [{ new_lifetime_xp: 255, new_best_xp: 255 }],
      error: null,
    });

    const breakdown: XpBreakdown = {
      practiceXp: 10,
      timingBonusXp: 5,
      drillCompletionXp: 15,
      newRecordXp: 25,
      totalXp: 55,
    };

    const result = await awardXp('user-456', breakdown);

    const callArgs = mockRpc.mock.calls[0][1];
    expect(callArgs.p_delta).toBe(55);
    expect(callArgs.p_metadata).toEqual(breakdown);
    expect(result).toEqual({ success: true, newTotal: 255 });
  });
});

describe('fetchLifetimeXp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns current_value from database', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { current_value: 150 },
      error: null,
    });

    const result = await fetchLifetimeXp('user-123');
    expect(result).toBe(150);
  });

  it('returns 0 when no record exists', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await fetchLifetimeXp('user-123');
    expect(result).toBe(0);
  });

  it('returns 0 on error', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'Network error' },
    });

    const result = await fetchLifetimeXp('user-123');
    expect(result).toBe(0);
  });
});
