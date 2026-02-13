import { useSessionStore } from '@/stores/session-store';
import type { SessionContext } from '@/lib/ai/schemas';

/**
 * Build session context for AI requests by reading from Zustand stores.
 * Uses getState() for synchronous, non-reactive reads.
 */
export function getSessionContextForAI(): SessionContext {
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
