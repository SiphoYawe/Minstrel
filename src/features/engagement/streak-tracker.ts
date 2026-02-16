import { StreakStatus, type StreakData } from './engagement-types';
import {
  MIN_MEANINGFUL_PRACTICE_MS,
  STREAK_RESET_WINDOW_MS,
  STREAK_MILESTONES,
} from '@/lib/constants';

export function isSessionMeaningful(activePlayDurationMs: number): boolean {
  return activePlayDurationMs >= MIN_MEANINGFUL_PRACTICE_MS;
}

/**
 * Compares two dates to see if they fall on the same calendar day in the
 * given IANA timezone. Uses Intl.DateTimeFormat for DST-safe comparison
 * (STATE-L1) — on DST transition days, each date is formatted individually
 * so the correct offset applies to each.
 */
export function isSameCalendarDay(date1: Date, date2: Date, timeZone?: string): boolean {
  if (timeZone) {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(date1) === fmt.format(date2);
  }
  // Fallback: compare in UTC when no timezone provided
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

export function calculateStreakUpdate(
  currentStreak: StreakData,
  sessionEndTime: Date,
  timeZone?: string
): StreakData {
  const now = sessionEndTime.getTime();

  // If already qualified today, no change
  if (
    currentStreak.lastQualifiedAt &&
    isSameCalendarDay(new Date(currentStreak.lastQualifiedAt), sessionEndTime, timeZone)
  ) {
    return { ...currentStreak };
  }

  // Check if streak is still alive (within 48h window)
  if (currentStreak.lastQualifiedAt) {
    const gap = now - new Date(currentStreak.lastQualifiedAt).getTime();
    if (gap > STREAK_RESET_WINDOW_MS) {
      // Streak broken — start fresh
      return {
        currentStreak: 1,
        bestStreak: Math.max(currentStreak.bestStreak, 1),
        lastQualifiedAt: sessionEndTime.toISOString(),
        streakStatus: StreakStatus.Active,
      };
    }
  }

  // Increment streak
  const newStreak = currentStreak.currentStreak + 1;
  return {
    currentStreak: newStreak,
    bestStreak: Math.max(currentStreak.bestStreak, newStreak),
    lastQualifiedAt: sessionEndTime.toISOString(),
    streakStatus: getStreakStatus(
      { ...currentStreak, currentStreak: newStreak, lastQualifiedAt: sessionEndTime.toISOString() },
      sessionEndTime,
      timeZone
    ),
  };
}

export function getStreakStatus(streak: StreakData, now: Date, timeZone?: string): StreakStatus {
  if (streak.currentStreak === 0 || !streak.lastQualifiedAt) {
    return StreakStatus.Broken;
  }

  const gap = now.getTime() - new Date(streak.lastQualifiedAt).getTime();

  // Check if streak is broken (>48h)
  if (gap > STREAK_RESET_WINDOW_MS) {
    return StreakStatus.Broken;
  }

  // Check milestone
  if (STREAK_MILESTONES.includes(streak.currentStreak as (typeof STREAK_MILESTONES)[number])) {
    return StreakStatus.Milestone;
  }

  // Check at-risk: last session was yesterday (qualified, but hasn't played today)
  if (!isSameCalendarDay(new Date(streak.lastQualifiedAt), now, timeZone)) {
    return StreakStatus.AtRisk;
  }

  return StreakStatus.Active;
}

export function createEmptyStreak(): StreakData {
  return {
    currentStreak: 0,
    bestStreak: 0,
    lastQualifiedAt: null,
    streakStatus: StreakStatus.Broken,
  };
}
