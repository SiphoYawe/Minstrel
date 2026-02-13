export enum StreakStatus {
  Active = 'Active',
  AtRisk = 'AtRisk',
  Broken = 'Broken',
  Milestone = 'Milestone',
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastQualifiedAt: string | null; // ISO timestamp
  streakStatus: StreakStatus;
}

export interface MeaningfulSessionCriteria {
  minDurationMs: number;
  minMidiEvents: number;
}

export interface ProgressMetricRow {
  id: string;
  userId: string;
  metricType: string;
  currentValue: number;
  bestValue: number;
  metadata: Record<string, unknown>;
  lastQualifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- XP Types (Story 7.2) ---

export interface XpBreakdown {
  practiceXp: number;
  timingBonusXp: number;
  drillCompletionXp: number;
  newRecordXp: number;
  totalXp: number;
}

export interface XpAwardEvent {
  sessionId: string;
  userId: string;
  breakdown: XpBreakdown;
  awardedAt: string; // ISO timestamp
}

export interface XpConfig {
  baseRatePerMinute: number;
  minQualifyingMinutes: number;
  timingImprovementMultiplier: number;
  drillCompletionBonus: number;
  drillAttemptBonus: number;
  newRecordBonus: number;
}

/** Input data for XP calculation from a completed session. */
export interface SessionXpInput {
  activePlayDurationMs: number;
  currentTimingAccuracy: number; // 0-1
  rollingTimingAverage: number; // 0-1
  drillResults: Array<{ passed: boolean }>;
  newRecordTypes: string[]; // unique record type identifiers
}

/** Subset of personal record for XP calculation */
export interface PersonalRecordForXp {
  recordType: string;
}
