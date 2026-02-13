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

// --- Achievement Types (Story 7.3) ---

export enum AchievementCategory {
  Genre = 'Genre',
  Technique = 'Technique',
  Consistency = 'Consistency',
  PersonalRecord = 'PersonalRecord',
}

/** Context passed to achievement trigger conditions for evaluation. */
export interface TriggerContext {
  // Streak data (Story 7.1)
  currentStreak: number;
  bestStreak: number;
  // XP data (Story 7.2)
  lifetimeXp: number;
  // Session stats
  sessionDurationMs: number;
  totalNotesPlayed: number;
  timingAccuracy: number; // 0-1
  // Drill data
  drillsCompleted: number;
  drillsPassed: number;
  consecutivePerfectReps: number;
  // Genre exposure
  detectedGenres: string[];
  chordsDetected: string[];
  // Personal records (Story 7.6 — optional until implemented)
  newRecordTypes?: string[];
  // Lifetime aggregates
  lifetimeSessions: number;
  lifetimeNotesPlayed: number;
  // Chord transition speed (ms)
  fastestChordTransitionMs?: number;
}

export interface AchievementDefinition {
  achievementId: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string; // emoji or icon name
  triggerCondition: (ctx: TriggerContext) => boolean;
}

export interface UnlockedAchievement {
  achievementId: string;
  userId: string;
  unlockedAt: string; // ISO timestamp
  sessionId: string | null;
}

export type AchievementRegistry = Map<string, AchievementDefinition>;

export interface AchievementDisplayItem {
  definition: AchievementDefinition;
  unlocked: boolean;
  unlockedAt: string | null;
}

// --- Progress Trends Types (Story 7.4) ---

export enum TrendDimension {
  TimingAccuracy = 'TimingAccuracy',
  HarmonicComplexity = 'HarmonicComplexity',
  Speed = 'Speed',
  Consistency = 'Consistency',
}

export enum TrendDirection {
  Up = 'Up',
  Flat = 'Flat',
  Down = 'Down',
}

export enum TrendPeriod {
  SevenDays = '7d',
  ThirtyDays = '30d',
  NinetyDays = '90d',
}

export interface TrendDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  value: number;
}

export interface TrendLine {
  dimension: TrendDimension;
  dataPoints: TrendDataPoint[];
  deltaFromStart: number;
  currentValue: number;
  bestInPeriod: number;
  trendDirection: TrendDirection;
  insightText: string;
}

export interface ProgressSummary {
  trends: TrendLine[];
  period: TrendPeriod;
  generatedAt: string; // ISO timestamp
}

/** Raw session metric data fetched from Supabase for aggregation. */
export interface SessionMetric {
  sessionId: string;
  date: string; // ISO date string
  timingAccuracy: number | null;
  uniqueChords: number;
  averageTempo: number | null;
  maxCleanTempo: number | null;
  durationMs: number;
  drillsCompleted?: number;
}

// --- Weekly Summary Types (Story 7.5) ---

export interface WeeklyMetricDelta {
  metricName: string;
  currentValue: number;
  previousValue: number | null;
  deltaPercent: number | null; // null when no previous week
  direction: TrendDirection;
}

export interface WeeklyComparison {
  totalTimeDeltaMs: number;
  sessionCountDelta: number;
  metricDeltas: WeeklyMetricDelta[];
}

export interface WeeklySummary {
  weekStartDate: string; // ISO date (Monday)
  weekEndDate: string; // ISO date (Sunday)
  totalPracticeMs: number;
  sessionCount: number;
  drillsCompleted: number;
  personalRecordsSet: number;
  metricDeltas: WeeklyMetricDelta[];
  highestImpactInsight: string;
  previousWeekComparison: WeeklyComparison | null;
}

// --- Personal Records Types (Story 7.6) ---

export enum PersonalRecordType {
  CleanTempo = 'CleanTempo',
  TimingAccuracy = 'TimingAccuracy',
  HarmonicComplexity = 'HarmonicComplexity',
  PracticeStreak = 'PracticeStreak',
}

export interface RecordHistoryEntry {
  value: number;
  date: string; // ISO date
  sessionId: string | null;
}

export interface PersonalRecord {
  recordType: PersonalRecordType;
  currentValue: number;
  previousValue: number | null;
  achievedAt: string; // ISO timestamp
  sessionId: string | null;
}

export interface PersonalRecordWithHistory {
  recordType: PersonalRecordType;
  currentValue: number;
  history: RecordHistoryEntry[];
  label: string;
  unit: string;
}

export interface RecordDetectionInput {
  maxCleanTempo: number | null; // BPM at >85% accuracy
  bestTimingAccuracy: number | null; // 0-1
  maxChordComplexity: number | null; // unique chord count
  currentStreak: number;
  sessionId: string | null;
  date: string; // ISO date
}
