import { StreakStatus, type StreakData } from './engagement-types';
import {
  MIN_MEANINGFUL_PRACTICE_MS,
  STREAK_RESET_WINDOW_MS,
  STREAK_MILESTONES,
} from '@/lib/constants';

export function isSessionMeaningful(activePlayDurationMs: number): boolean {
  return activePlayDurationMs >= MIN_MEANINGFUL_PRACTICE_MS;
}

export function isSameCalendarDay(date1: Date, date2: Date, timezoneOffsetMinutes = 0): boolean {
  const offset = timezoneOffsetMinutes * 60_000;
  const d1 = new Date(date1.getTime() + offset);
  const d2 = new Date(date2.getTime() + offset);
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
}

export function calculateStreakUpdate(currentStreak: StreakData, sessionEndTime: Date): StreakData {
  const now = sessionEndTime.getTime();

  // If already qualified today, no change
  if (
    currentStreak.lastQualifiedAt &&
    isSameCalendarDay(new Date(currentStreak.lastQualifiedAt), sessionEndTime)
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
      sessionEndTime
    ),
  };
}

export function getStreakStatus(streak: StreakData, now: Date): StreakStatus {
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
  if (!isSameCalendarDay(new Date(streak.lastQualifiedAt), now)) {
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
