// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  isSessionMeaningful,
  calculateStreakUpdate,
  getStreakStatus,
  isSameCalendarDay,
  createEmptyStreak,
} from './streak-tracker';
import { StreakStatus, type StreakData } from './engagement-types';

describe('isSessionMeaningful', () => {
  it('returns false for duration below 3 minutes', () => {
    expect(isSessionMeaningful(179_999)).toBe(false);
  });

  it('returns true for exactly 3 minutes', () => {
    expect(isSessionMeaningful(180_000)).toBe(true);
  });

  it('returns true for duration above 3 minutes', () => {
    expect(isSessionMeaningful(300_000)).toBe(true);
  });

  it('returns false for 0 duration', () => {
    expect(isSessionMeaningful(0)).toBe(false);
  });
});

describe('isSameCalendarDay', () => {
  it('returns true for same day', () => {
    const d1 = new Date('2026-02-13T10:00:00Z');
    const d2 = new Date('2026-02-13T23:00:00Z');
    expect(isSameCalendarDay(d1, d2)).toBe(true);
  });

  it('returns false for different days', () => {
    const d1 = new Date('2026-02-13T23:00:00Z');
    const d2 = new Date('2026-02-14T01:00:00Z');
    expect(isSameCalendarDay(d1, d2)).toBe(false);
  });

  it('handles timezone offset', () => {
    // 11pm UTC on Feb 13, but in UTC+2 it's 1am Feb 14
    const d1 = new Date('2026-02-13T23:00:00Z');
    const d2 = new Date('2026-02-14T00:30:00Z');
    // With UTC+2 offset (120 min), d1 becomes 1am Feb 14, d2 becomes 2:30am Feb 14 → same day
    expect(isSameCalendarDay(d1, d2, 120)).toBe(true);
  });
});

describe('calculateStreakUpdate', () => {
  it('starts streak at 1 from empty', () => {
    const empty = createEmptyStreak();
    const result = calculateStreakUpdate(empty, new Date('2026-02-13T12:00:00Z'));
    expect(result.currentStreak).toBe(1);
    expect(result.lastQualifiedAt).toBe('2026-02-13T12:00:00.000Z');
  });

  it('increments streak when within 48h window', () => {
    const current: StreakData = {
      currentStreak: 5,
      bestStreak: 10,
      lastQualifiedAt: '2026-02-12T20:00:00Z',
      streakStatus: StreakStatus.Active,
    };
    const result = calculateStreakUpdate(current, new Date('2026-02-13T12:00:00Z'));
    expect(result.currentStreak).toBe(6);
  });

  it('does not double-count same calendar day', () => {
    const current: StreakData = {
      currentStreak: 5,
      bestStreak: 10,
      lastQualifiedAt: '2026-02-13T08:00:00Z',
      streakStatus: StreakStatus.Active,
    };
    const result = calculateStreakUpdate(current, new Date('2026-02-13T20:00:00Z'));
    expect(result.currentStreak).toBe(5);
  });

  it('resets streak after 48h gap', () => {
    const current: StreakData = {
      currentStreak: 10,
      bestStreak: 10,
      lastQualifiedAt: '2026-02-10T12:00:00Z',
      streakStatus: StreakStatus.Active,
    };
    const result = calculateStreakUpdate(current, new Date('2026-02-13T12:00:00Z'));
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(10); // preserves best
  });

  it('updates bestStreak when current exceeds it', () => {
    const current: StreakData = {
      currentStreak: 3,
      bestStreak: 3,
      lastQualifiedAt: '2026-02-12T12:00:00Z',
      streakStatus: StreakStatus.Active,
    };
    const result = calculateStreakUpdate(current, new Date('2026-02-13T12:00:00Z'));
    expect(result.bestStreak).toBe(4);
  });

  it('returns new object (no mutation)', () => {
    const current: StreakData = {
      currentStreak: 3,
      bestStreak: 3,
      lastQualifiedAt: '2026-02-12T12:00:00Z',
      streakStatus: StreakStatus.Active,
    };
    const original = { ...current };
    calculateStreakUpdate(current, new Date('2026-02-13T12:00:00Z'));
    expect(current).toEqual(original);
  });
});

describe('getStreakStatus', () => {
  it('returns Broken for 0 streak', () => {
    const streak: StreakData = {
      currentStreak: 0,
      bestStreak: 0,
      lastQualifiedAt: null,
      streakStatus: StreakStatus.Broken,
    };
    expect(getStreakStatus(streak, new Date())).toBe(StreakStatus.Broken);
  });

  it('returns Broken for gap > 48h', () => {
    const streak: StreakData = {
      currentStreak: 5,
      bestStreak: 5,
      lastQualifiedAt: '2026-02-10T12:00:00Z',
      streakStatus: StreakStatus.Active,
    };
    expect(getStreakStatus(streak, new Date('2026-02-13T12:00:00Z'))).toBe(StreakStatus.Broken);
  });

  it('returns Active when qualified today', () => {
    const now = new Date('2026-02-13T15:00:00Z');
    const streak: StreakData = {
      currentStreak: 5,
      bestStreak: 5,
      lastQualifiedAt: '2026-02-13T10:00:00Z',
      streakStatus: StreakStatus.Active,
    };
    expect(getStreakStatus(streak, now)).toBe(StreakStatus.Active);
  });

  it('returns AtRisk when last session was yesterday', () => {
    const now = new Date('2026-02-13T10:00:00Z');
    const streak: StreakData = {
      currentStreak: 5,
      bestStreak: 5,
      lastQualifiedAt: '2026-02-12T20:00:00Z',
      streakStatus: StreakStatus.Active,
    };
    expect(getStreakStatus(streak, now)).toBe(StreakStatus.AtRisk);
  });

  it('returns Milestone for day 7', () => {
    const now = new Date('2026-02-13T10:00:00Z');
    const streak: StreakData = {
      currentStreak: 7,
      bestStreak: 7,
      lastQualifiedAt: '2026-02-13T09:00:00Z',
      streakStatus: StreakStatus.Active,
    };
    expect(getStreakStatus(streak, now)).toBe(StreakStatus.Milestone);
  });

  it('returns Milestone for day 30', () => {
    const now = new Date('2026-02-13T10:00:00Z');
    const streak: StreakData = {
      currentStreak: 30,
      bestStreak: 30,
      lastQualifiedAt: '2026-02-13T09:00:00Z',
      streakStatus: StreakStatus.Active,
    };
    expect(getStreakStatus(streak, now)).toBe(StreakStatus.Milestone);
  });

  it('returns Milestone for day 100', () => {
    const now = new Date('2026-02-13T10:00:00Z');
    const streak: StreakData = {
      currentStreak: 100,
      bestStreak: 100,
      lastQualifiedAt: '2026-02-13T09:00:00Z',
      streakStatus: StreakStatus.Active,
    };
    expect(getStreakStatus(streak, now)).toBe(StreakStatus.Milestone);
  });
});
