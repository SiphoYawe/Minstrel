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

  it('handles IANA timezone (Africa/Cairo, UTC+2)', () => {
    // 11pm UTC on Feb 13 = 1am EET Feb 14
    // 12:30am UTC on Feb 14 = 2:30am EET Feb 14 → same day in Cairo
    const d1 = new Date('2026-02-13T23:00:00Z');
    const d2 = new Date('2026-02-14T00:30:00Z');
    expect(isSameCalendarDay(d1, d2, 'Africa/Cairo')).toBe(true);
  });

  it('America/Los_Angeles user at 11pm local (7am UTC next day) — same day locally', () => {
    const localEvening = new Date('2026-02-14T07:00:00Z'); // 11pm PST Feb 13
    const localAfternoon = new Date('2026-02-13T23:00:00Z'); // 3pm PST Feb 13
    expect(isSameCalendarDay(localEvening, localAfternoon, 'America/Los_Angeles')).toBe(true);
  });

  it('Pacific/Auckland user at 1am local (1pm UTC previous day) — new day locally', () => {
    const localNewDay = new Date('2026-02-13T12:00:00Z'); // 1am NZDT Feb 14
    const localPreviousDay = new Date('2026-02-13T10:00:00Z'); // 11pm NZDT Feb 13
    expect(isSameCalendarDay(localNewDay, localPreviousDay, 'Pacific/Auckland')).toBe(false);
  });

  it('UTC fallback — no timezone means UTC comparison', () => {
    const d1 = new Date('2026-02-13T23:59:59Z');
    const d2 = new Date('2026-02-13T00:00:00Z');
    expect(isSameCalendarDay(d1, d2)).toBe(true);
  });

  it('exact midnight boundary — one second before vs. midnight is different day', () => {
    const justBeforeMidnight = new Date('2026-02-13T23:59:59Z');
    const exactMidnight = new Date('2026-02-14T00:00:00Z');
    expect(isSameCalendarDay(justBeforeMidnight, exactMidnight)).toBe(false);
  });

  it('exact midnight boundary with timezone — still same local day for America/New_York', () => {
    // midnight UTC on Feb 14 = 7pm EST Feb 13, 11:59pm UTC Feb 13 = 6:59pm EST Feb 13
    const utcMidnight = new Date('2026-02-14T00:00:00Z');
    const utcBeforeMidnight = new Date('2026-02-13T23:59:59Z');
    expect(isSameCalendarDay(utcMidnight, utcBeforeMidnight, 'America/New_York')).toBe(true);
  });

  it('DST transition day — spring forward correctly handled (STATE-L1)', () => {
    // 2026 US spring forward: March 8 at 2am EST → 3am EDT
    // 1:30am EST (6:30am UTC) and 3:30am EDT (7:30am UTC) are same calendar day
    const beforeSpring = new Date('2026-03-08T06:30:00Z'); // 1:30am EST
    const afterSpring = new Date('2026-03-08T07:30:00Z'); // 3:30am EDT
    expect(isSameCalendarDay(beforeSpring, afterSpring, 'America/New_York')).toBe(true);
  });

  it('DST transition day — fall back correctly handled (STATE-L1)', () => {
    // 2026 US fall back: November 1 at 2am EDT → 1am EST
    // 11pm EDT Nov 1 (3am UTC Nov 2) and 12:30am EST Nov 2 (5:30am UTC Nov 2) are different days
    const beforeFall = new Date('2026-11-02T03:00:00Z'); // 11pm EDT Nov 1
    const afterFall = new Date('2026-11-02T05:30:00Z'); // 12:30am EST Nov 2
    expect(isSameCalendarDay(beforeFall, afterFall, 'America/New_York')).toBe(false);
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

  it('does not double-count same local day for America/Los_Angeles user', () => {
    // User in America/Los_Angeles (PST). Last qualified at 3pm PST Feb 12 = 11pm UTC Feb 12.
    // Now it is 11pm PST Feb 12 = 7am UTC Feb 13 — same local day.
    const current: StreakData = {
      currentStreak: 5,
      bestStreak: 10,
      lastQualifiedAt: '2026-02-12T23:00:00Z', // 3pm PST Feb 12
      streakStatus: StreakStatus.Active,
    };
    const sessionEnd = new Date('2026-02-13T07:00:00Z'); // 11pm PST Feb 12
    const result = calculateStreakUpdate(current, sessionEnd, 'America/Los_Angeles');
    expect(result.currentStreak).toBe(5); // No increment — same local day
  });

  it('increments streak at Pacific/Auckland when it is a new local day', () => {
    // User in Pacific/Auckland (NZDT, UTC+13 in Feb). Last qualified 11pm NZDT Feb 12 = 10am UTC Feb 12.
    // Now it is 1am NZDT Feb 13 = 12pm UTC Feb 12 — new local day.
    const current: StreakData = {
      currentStreak: 3,
      bestStreak: 5,
      lastQualifiedAt: '2026-02-12T10:00:00Z', // 11pm NZDT Feb 12
      streakStatus: StreakStatus.Active,
    };
    const sessionEnd = new Date('2026-02-12T12:00:00Z'); // 1am NZDT Feb 13
    const result = calculateStreakUpdate(current, sessionEnd, 'Pacific/Auckland');
    expect(result.currentStreak).toBe(4); // Incremented — new local day
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
