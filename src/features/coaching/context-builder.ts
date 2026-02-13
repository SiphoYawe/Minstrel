import { useSessionStore } from '@/stores/session-store';
import type { SessionContext } from '@/lib/ai/schemas';

export interface DataSufficiency {
  hasSufficientData: boolean;
  availableInsights: string[];
  missingInsights: string[];
  recommendation?: string;
}

const MIN_NOTES_FOR_ANALYSIS = 10;
const MIN_CHORDS_FOR_PATTERN = 3;
const MIN_DURATION_FOR_TIMING_MS = 30_000;
const MIN_SNAPSHOTS_FOR_TREND = 1;
const MIN_SNAPSHOTS_FOR_TRAJECTORY = 2;

/**
 * Build comprehensive session context for AI grounding.
 * Uses getState() for synchronous, non-reactive reads.
 */
export function buildSessionContext(): SessionContext {
  const state = useSessionStore.getState();

  const key = state.currentKey ? `${state.currentKey.root} ${state.currentKey.mode}` : null;

  const chords = state.detectedChords
    .slice(-20)
    .map((c) => `${c.root}${c.quality === 'Major' ? '' : c.quality === 'Minor' ? 'm' : c.quality}`);

  const timingAccuracy = state.timingAccuracy / 100;
  const tempo = state.currentTempo;

  const genre =
    state.detectedGenres.length > 0
      ? state.detectedGenres.reduce((best, g) => (g.confidence > best.confidence ? g : best)).genre
      : null;

  const recentSnapshots = state.snapshots.slice(-3).map((snap) => ({
    keyInsight: snap.keyInsight,
    insightCategory: snap.insightCategory,
    timestamp: snap.timestamp,
  }));

  const tendencies =
    state.playingTendencies && state.avoidancePatterns
      ? {
          avoidedKeys: state.avoidancePatterns.avoidedKeys,
          avoidedChordTypes: state.avoidancePatterns.avoidedChordTypes.map(String),
          commonIntervals: state.playingTendencies.intervalDistribution
            ? Object.keys(state.playingTendencies.intervalDistribution).map(Number).slice(0, 5)
            : [],
        }
      : null;

  return {
    key,
    chords,
    timingAccuracy,
    tempo,
    genre,
    recentSnapshots,
    tendencies,
  };
}

/**
 * Assess whether enough data exists for meaningful AI coaching.
 */
export function assessDataSufficiency(context: SessionContext): DataSufficiency {
  const state = useSessionStore.getState();
  const available: string[] = [];
  const missing: string[] = [];

  const totalNotes = state.totalNotesPlayed;
  const sessionDuration = state.sessionStartTimestamp
    ? Date.now() - state.sessionStartTimestamp
    : 0;
  const snapshotCount = state.snapshots.length;

  if (totalNotes >= MIN_NOTES_FOR_ANALYSIS) {
    available.push('Note-level analysis');
  } else {
    missing.push('Note-level analysis (need at least 10 notes)');
  }

  if (context.chords.length >= MIN_CHORDS_FOR_PATTERN) {
    available.push('Chord pattern analysis');
  } else {
    missing.push('Chord pattern analysis (need at least 3 chords)');
  }

  if (sessionDuration >= MIN_DURATION_FOR_TIMING_MS) {
    available.push('Timing analysis');
  } else {
    missing.push('Timing analysis (need at least 30 seconds of play)');
  }

  if (snapshotCount >= MIN_SNAPSHOTS_FOR_TREND) {
    available.push('Session trend analysis');
  } else {
    missing.push('Session trend analysis (need at least 1 pause snapshot)');
  }

  if (snapshotCount >= MIN_SNAPSHOTS_FOR_TRAJECTORY) {
    available.push('Within-session trajectory');
  } else {
    missing.push('Within-session trajectory (need at least 2 pause snapshots)');
  }

  const hasSufficientData = totalNotes >= MIN_NOTES_FOR_ANALYSIS;

  const recommendation =
    totalNotes < 5
      ? 'Play for a couple of minutes so I can analyze your timing and chord patterns.'
      : missing.length > 0
        ? `Keep playing to unlock: ${missing.slice(0, 2).join(', ')}.`
        : undefined;

  return {
    hasSufficientData,
    availableInsights: available,
    missingInsights: missing,
    recommendation,
  };
}
