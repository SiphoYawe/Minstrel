/**
 * Session types for Minstrel practice sessions.
 * Freeform is the default — musician plays freely with full analysis.
 * Other types are structured activities that may be requested explicitly.
 */
export type SessionType = 'freeform' | 'drill' | 'micro-session' | 'warmup';

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'completed';

export interface SessionMetadata {
  id: number;
  startTimestamp: number;
  endTimestamp: number | null;
  duration: number | null;
  key: string | null;
  tempo: number | null;
  sessionType: SessionType;
  status: RecordingStatus;
}

/**
 * Rich session summary for cross-session continuity (Story 6.4).
 * Aggregated data only — never raw MIDI events.
 */
export interface ContinuitySessionSummary {
  id: number;
  date: string; // ISO date string
  durationMs: number;
  detectedKey: string | null;
  averageTempo: number | null;
  timingAccuracy: number | null; // 0-1
  chordsUsed: string[];
  drillsCompleted: number;
  keyInsight: string | null;
  weaknessAreas: string[];
  snapshotCount: number;
}

/**
 * A weakness ranked by recency and severity for drill prioritization.
 */
export interface RankedWeakness {
  skill: string;
  severity: number; // 0-1, higher = more severe
  lastSessionDate: string; // ISO date string
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * Structured cross-session context for the AI system prompt.
 */
export interface ContinuityContext {
  recentSessions: Array<{
    date: string;
    key: string | null;
    tempo: number | null;
    timingAccuracy: number | null;
    chordsUsed: string[];
    keyInsight: string | null;
  }>;
  timingTrend: string | null; // e.g., "72% → 78% → 83%"
  lastInsight: string | null;
  rankedWeaknesses: RankedWeakness[];
}

/**
 * Context for the warm-up generator to avoid redundant practice.
 */
export interface WarmupContext {
  recentKeys: string[];
  recentChordTypes: string[];
  recentSkillAreas: string[];
  improvingPatterns: string[];
}
