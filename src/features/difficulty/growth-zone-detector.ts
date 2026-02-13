import { GrowthZoneStatus, type RepPerformance, type AccuracyTrend } from './difficulty-types';

export const GROWTH_ZONE = {
  TOO_EASY_THRESHOLD: 0.9,
  TOO_HARD_THRESHOLD: 0.4,
  ZONE_LOW: 0.6,
  ZONE_HIGH: 0.85,
  CONSECUTIVE_REPS: 3,
} as const;

export function isTooEasy(recentReps: RepPerformance[]): boolean {
  return (
    recentReps.length >= GROWTH_ZONE.CONSECUTIVE_REPS &&
    recentReps.every((r) => r.accuracy > GROWTH_ZONE.TOO_EASY_THRESHOLD)
  );
}

export function isTooHard(recentReps: RepPerformance[]): boolean {
  return (
    recentReps.length >= GROWTH_ZONE.CONSECUTIVE_REPS &&
    recentReps.every((r) => r.accuracy < GROWTH_ZONE.TOO_HARD_THRESHOLD)
  );
}

export function isInGrowthZone(recentReps: RepPerformance[]): boolean {
  if (recentReps.length === 0) return false;
  const avg = recentReps.reduce((sum, r) => sum + r.accuracy, 0) / recentReps.length;
  return avg >= GROWTH_ZONE.ZONE_LOW && avg <= GROWTH_ZONE.ZONE_HIGH;
}

export function getAccuracyTrend(repHistory: RepPerformance[]): AccuracyTrend {
  if (repHistory.length < 3) return 'stable';

  const recent = repHistory.slice(-GROWTH_ZONE.CONSECUTIVE_REPS);
  let increasing = 0;
  let decreasing = 0;

  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i].accuracy - recent[i - 1].accuracy;
    if (diff > 0.02) increasing++;
    else if (diff < -0.02) decreasing++;
  }

  if (increasing > decreasing) return 'improving';
  if (decreasing > increasing) return 'declining';
  return 'stable';
}

export function detectZone(repHistory: RepPerformance[]): GrowthZoneStatus {
  const recentReps = repHistory.slice(-GROWTH_ZONE.CONSECUTIVE_REPS);

  if (recentReps.length < GROWTH_ZONE.CONSECUTIVE_REPS) {
    return GrowthZoneStatus.GrowthZone;
  }

  if (isTooEasy(recentReps)) return GrowthZoneStatus.TooEasy;
  if (isTooHard(recentReps)) return GrowthZoneStatus.TooHard;

  return GrowthZoneStatus.GrowthZone;
}
