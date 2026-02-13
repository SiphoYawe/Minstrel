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
