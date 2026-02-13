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
