/**
 * XP Calculator — Layer 3 Domain Logic (Story 7.2)
 *
 * Pure functions for calculating XP from session data.
 * XP is a personal odometer — quantifies effort, not competition.
 * No levels, ranks, or leaderboards.
 */

import type { XpBreakdown, SessionXpInput, XpConfig } from './engagement-types';
import {
  XP_BASE_RATE_PER_MINUTE,
  XP_MIN_QUALIFYING_MINUTES,
  XP_TIMING_IMPROVEMENT_MULTIPLIER,
  XP_DRILL_COMPLETION_BONUS,
  XP_DRILL_ATTEMPT_BONUS,
  XP_NEW_RECORD_BONUS,
} from '@/lib/constants';

const DEFAULT_CONFIG: XpConfig = {
  baseRatePerMinute: XP_BASE_RATE_PER_MINUTE,
  minQualifyingMinutes: XP_MIN_QUALIFYING_MINUTES,
  timingImprovementMultiplier: XP_TIMING_IMPROVEMENT_MULTIPLIER,
  drillCompletionBonus: XP_DRILL_COMPLETION_BONUS,
  drillAttemptBonus: XP_DRILL_ATTEMPT_BONUS,
  newRecordBonus: XP_NEW_RECORD_BONUS,
};

/**
 * Calculate base XP from active practice time.
 * Minimum 3 minutes to qualify. Returns 0 below threshold.
 */
export function calculateBaseXp(
  activePlayDurationMs: number,
  config: XpConfig = DEFAULT_CONFIG
): number {
  const minutes = activePlayDurationMs / 60_000;
  if (minutes < config.minQualifyingMinutes) return 0;
  return Math.round(minutes * config.baseRatePerMinute);
}

/**
 * Calculate timing improvement bonus.
 * Awards bonus proportional to improvement delta above rolling average.
 * Returns 0 if no improvement or regression.
 *
 * Formula: delta * 100 * multiplier (so +5% accuracy → +10 XP at multiplier=2)
 */
export function calculateTimingBonus(
  currentAccuracy: number,
  rollingAverage: number,
  config: XpConfig = DEFAULT_CONFIG
): number {
  const delta = currentAccuracy - rollingAverage;
  if (delta <= 0) return 0;
  return Math.round(delta * 100 * config.timingImprovementMultiplier);
}

/**
 * Calculate XP from drill completions.
 * Full bonus for passed drills, partial for attempted.
 */
export function calculateDrillXp(
  drillResults: Array<{ passed: boolean }>,
  config: XpConfig = DEFAULT_CONFIG
): number {
  let total = 0;
  for (const result of drillResults) {
    total += result.passed ? config.drillCompletionBonus : config.drillAttemptBonus;
  }
  return total;
}

/**
 * Calculate XP from new personal records.
 * Awards flat bonus per unique record type (deduplicated).
 */
export function calculateRecordXp(
  newRecordTypes: string[],
  config: XpConfig = DEFAULT_CONFIG
): number {
  const unique = new Set(newRecordTypes);
  return unique.size * config.newRecordBonus;
}

/**
 * Calculate total session XP with full breakdown.
 * Orchestrating function that computes all components.
 */
export function calculateSessionXp(
  input: SessionXpInput,
  config: XpConfig = DEFAULT_CONFIG
): XpBreakdown {
  const practiceXp = calculateBaseXp(input.activePlayDurationMs, config);
  const timingBonusXp = calculateTimingBonus(
    input.currentTimingAccuracy,
    input.rollingTimingAverage,
    config
  );
  const drillCompletionXp = calculateDrillXp(input.drillResults, config);
  const newRecordXp = calculateRecordXp(input.newRecordTypes, config);
  const totalXp = practiceXp + timingBonusXp + drillCompletionXp + newRecordXp;

  return {
    practiceXp,
    timingBonusXp,
    drillCompletionXp,
    newRecordXp,
    totalXp,
  };
}

/**
 * Format XP breakdown as a factual summary string.
 * Strava-like: just the data, no cheerleading.
 */
export function formatXpBreakdown(breakdown: XpBreakdown): string {
  const parts: string[] = [];
  if (breakdown.practiceXp > 0) parts.push(`Practice: ${breakdown.practiceXp} XP`);
  if (breakdown.timingBonusXp > 0) parts.push(`Timing Improvement: ${breakdown.timingBonusXp} XP`);
  if (breakdown.drillCompletionXp > 0) parts.push(`Drills: ${breakdown.drillCompletionXp} XP`);
  if (breakdown.newRecordXp > 0) parts.push(`New Record: ${breakdown.newRecordXp} XP`);

  if (parts.length === 0) return '0 XP';
  return `${parts.join(', ')} = ${breakdown.totalXp} XP`;
}
