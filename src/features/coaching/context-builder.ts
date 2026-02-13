import { useSessionStore } from '@/stores/session-store';
import type { SessionContext } from '@/lib/ai/schemas';
import type { ReplayContext } from '@/features/coaching/coaching-types';
import type { StoredMidiEvent } from '@/lib/dexie/db';
import type { AnalysisSnapshot } from '@/lib/dexie/db';
import type { ContinuityContext } from '@/features/session/session-types';

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

const DEFAULT_REPLAY_WINDOW_MS = 10_000;

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Binary search for the first index where event.timestamp >= target.
 * Returns events.length if all timestamps are below target.
 */
function lowerBound(events: StoredMidiEvent[], target: number): number {
  let lo = 0;
  let hi = events.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (events[mid].timestamp < target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

/**
 * Build timestamp-specific context for AI grounding in Replay Studio.
 * Uses binary search for O(log n) event windowing.
 */
export function buildReplayContext(
  events: StoredMidiEvent[],
  timestamp: number,
  snapshots: AnalysisSnapshot[],
  sessionMeta: {
    key: string | null;
    tempo: number | null;
    genre: string | null;
    timingAccuracy?: number | null;
  },
  windowMs: number = DEFAULT_REPLAY_WINDOW_MS
): ReplayContext {
  const windowStart = Math.max(0, timestamp - windowMs);
  const windowEnd = timestamp + windowMs;

  // Extract events within window using binary search
  const startIdx = lowerBound(events, windowStart);
  const endIdx = lowerBound(events, windowEnd);
  const windowEvents = events.slice(startIdx, endIdx);

  // Find notes active at the exact timestamp
  // A note is active if there's a note-on before/at timestamp with no note-off before timestamp
  const activeNotes = new Map<number, string>();
  for (const event of windowEvents) {
    if (event.timestamp > timestamp) break;
    if (event.type === 'note-on' && event.velocity > 0) {
      activeNotes.set(event.note, event.noteName);
    } else if (event.type === 'note-off' || (event.type === 'note-on' && event.velocity === 0)) {
      activeNotes.delete(event.note);
    }
  }

  // Build chord progression from note-on events (group by proximity)
  const chordLabels: string[] = [];
  const noteOnEvents = windowEvents.filter(
    (e) => e.type === 'note-on' && e.velocity > 0 && e.timestamp <= timestamp
  );
  // Simple grouping: collect unique note names in last 8 time clusters
  const clusters: string[][] = [];
  let currentCluster: string[] = [];
  let lastTime = -1;
  for (const e of noteOnEvents) {
    if (lastTime >= 0 && e.timestamp - lastTime > 200) {
      if (currentCluster.length > 0) clusters.push(currentCluster);
      currentCluster = [];
    }
    currentCluster.push(e.noteName);
    lastTime = e.timestamp;
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);
  for (const cluster of clusters.slice(-8)) {
    chordLabels.push(cluster.join('+'));
  }

  // Find nearby analysis snapshots
  const nearbySnapshots = snapshots
    .filter((s) => s.createdAt >= windowStart && s.createdAt <= windowEnd)
    .slice(-10)
    .map((s) => ({
      keyInsight: (s.data as { keyInsight?: string }).keyInsight ?? '',
      insightCategory: (s.data as { insightCategory?: string }).insightCategory ?? 'GENERAL',
      timestamp: s.createdAt,
    }));

  // Read timing accuracy from session metadata (computed by analysis pipeline)
  const timingAccuracy = sessionMeta.timingAccuracy != null ? sessionMeta.timingAccuracy / 100 : 0;

  // Detect chord at moment from active notes
  const notesAtMoment = Array.from(activeNotes.values());
  const chordAtMoment = notesAtMoment.length >= 2 ? notesAtMoment.join('+') : null;

  return {
    timestampFormatted: formatTimestamp(timestamp),
    timestampMs: timestamp,
    notesAtMoment,
    chordAtMoment,
    timingAccuracy: timingAccuracy || 0,
    tempo: sessionMeta.tempo,
    chordProgression: chordLabels,
    nearbySnapshots,
    key: sessionMeta.key,
    genre: sessionMeta.genre,
    windowMs,
  };
}

/**
 * Format the cross-session continuity context as a structured section
 * for the AI system prompt. Budget: ~500 tokens max.
 * Returns empty string if no recent sessions are available.
 */
export function formatContinuitySection(context: ContinuityContext): string {
  if (context.recentSessions.length === 0) return '';

  const lines: string[] = [
    `CROSS-SESSION HISTORY (${context.recentSessions.length} recent sessions):`,
  ];

  for (const session of context.recentSessions) {
    const parts: string[] = [session.date];
    if (session.key) parts.push(`key: ${session.key}`);
    if (session.tempo) parts.push(`tempo: ${session.tempo} BPM`);
    if (session.timingAccuracy !== null) {
      parts.push(`timing: ${Math.round(session.timingAccuracy * 100)}%`);
    }
    if (session.chordsUsed.length > 0) {
      parts.push(`chords: ${session.chordsUsed.join(', ')}`);
    }
    lines.push(`  - ${parts.join(' | ')}`);
    if (session.keyInsight) {
      lines.push(`    Insight: ${session.keyInsight}`);
    }
  }

  if (context.timingTrend) {
    lines.push(`TIMING TREND: ${context.timingTrend}`);
  }

  if (context.lastInsight) {
    lines.push(`MOST RECENT INSIGHT: ${context.lastInsight}`);
  }

  if (context.rankedWeaknesses.length > 0) {
    lines.push('PRIORITY WEAKNESSES (ranked):');
    for (const w of context.rankedWeaknesses.slice(0, 5)) {
      const trendIcon = w.trend === 'improving' ? '↑' : w.trend === 'declining' ? '↓' : '→';
      lines.push(
        `  ${trendIcon} ${w.skill} (severity: ${Math.round(w.severity * 100)}%, trend: ${w.trend})`
      );
    }
  }

  lines.push(
    'Reference this history naturally. If the user practiced something recently, acknowledge it and build on it.'
  );

  return lines.join('\n');
}
