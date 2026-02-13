import { describe, it, expect, beforeEach } from 'vitest';
import { buildSessionContext, assessDataSufficiency, buildReplayContext } from './context-builder';
import { useSessionStore } from '@/stores/session-store';
import type { StoredMidiEvent, AnalysisSnapshot } from '@/lib/dexie/db';

describe('buildSessionContext', () => {
  beforeEach(() => {
    useSessionStore.setState({
      currentKey: null,
      currentTempo: null,
      timingAccuracy: 100,
      detectedChords: [],
      detectedGenres: [],
      snapshots: [],
      playingTendencies: null,
      avoidancePatterns: null,
      totalNotesPlayed: 0,
      sessionStartTimestamp: null,
    });
  });

  it('returns null key when none detected', () => {
    const ctx = buildSessionContext();
    expect(ctx.key).toBeNull();
  });

  it('formats key as readable string', () => {
    useSessionStore.setState({
      currentKey: { root: 'C', mode: 'major', confidence: 0.9 },
    });
    const ctx = buildSessionContext();
    expect(ctx.key).toBe('C major');
  });

  it('returns empty chords when none played', () => {
    const ctx = buildSessionContext();
    expect(ctx.chords).toEqual([]);
  });

  it('normalizes timing accuracy to 0-1', () => {
    useSessionStore.setState({ timingAccuracy: 75 });
    const ctx = buildSessionContext();
    expect(ctx.timingAccuracy).toBe(0.75);
  });

  it('returns highest confidence genre', () => {
    useSessionStore.setState({
      detectedGenres: [
        { genre: 'Blues', confidence: 0.3, matchedPatterns: [] },
        { genre: 'Jazz', confidence: 0.8, matchedPatterns: [] },
      ],
    });
    const ctx = buildSessionContext();
    expect(ctx.genre).toBe('Jazz');
  });

  it('returns last 3 snapshots', () => {
    const snaps = Array.from({ length: 5 }, (_, i) => ({
      id: `s${i}`,
      key: null,
      chordsUsed: [],
      timingAccuracy: 70,
      averageTempo: 100,
      keyInsight: `I${i}`,
      insightCategory: 'GENERAL' as const,
      genrePatterns: [],
      timestamp: 1000 * i,
    }));
    useSessionStore.setState({ snapshots: snaps });
    const ctx = buildSessionContext();
    expect(ctx.recentSnapshots).toHaveLength(3);
  });
});

describe('assessDataSufficiency', () => {
  beforeEach(() => {
    useSessionStore.setState({
      totalNotesPlayed: 0,
      sessionStartTimestamp: null,
      snapshots: [],
      detectedChords: [],
      currentKey: null,
      currentTempo: null,
      timingAccuracy: 100,
      detectedGenres: [],
      playingTendencies: null,
      avoidancePatterns: null,
    });
  });

  it('reports insufficient with zero notes', () => {
    const ctx = buildSessionContext();
    const suf = assessDataSufficiency(ctx);
    expect(suf.hasSufficientData).toBe(false);
    expect(suf.missingInsights.length).toBeGreaterThan(0);
  });

  it('reports sufficient with enough notes', () => {
    useSessionStore.setState({
      totalNotesPlayed: 15,
      sessionStartTimestamp: Date.now() - 60_000,
      detectedChords: Array.from({ length: 5 }, (_, i) => ({
        root: 'C',
        quality: 'Major' as const,
        notes: [],
        timestamp: i,
      })),
    });
    const ctx = buildSessionContext();
    const suf = assessDataSufficiency(ctx);
    expect(suf.hasSufficientData).toBe(true);
    expect(suf.availableInsights).toContain('Note-level analysis');
  });

  it('includes recommendation for very few notes', () => {
    useSessionStore.setState({ totalNotesPlayed: 3 });
    const ctx = buildSessionContext();
    const suf = assessDataSufficiency(ctx);
    expect(suf.recommendation).toContain('Play for');
  });

  it('detects chord pattern analysis availability', () => {
    useSessionStore.setState({
      totalNotesPlayed: 15,
      detectedChords: Array.from({ length: 5 }, (_, i) => ({
        root: 'C',
        quality: 'Major' as const,
        notes: [],
        timestamp: i,
      })),
    });
    const ctx = buildSessionContext();
    const suf = assessDataSufficiency(ctx);
    expect(suf.availableInsights).toContain('Chord pattern analysis');
  });

  it('detects snapshot trajectory availability', () => {
    useSessionStore.setState({
      totalNotesPlayed: 20,
      snapshots: [
        {
          id: '1',
          key: null,
          chordsUsed: [],
          timingAccuracy: 70,
          averageTempo: 100,
          keyInsight: '',
          insightCategory: 'GENERAL',
          genrePatterns: [],
          timestamp: 1000,
        },
        {
          id: '2',
          key: null,
          chordsUsed: [],
          timingAccuracy: 75,
          averageTempo: 100,
          keyInsight: '',
          insightCategory: 'GENERAL',
          genrePatterns: [],
          timestamp: 2000,
        },
      ],
    });
    const ctx = buildSessionContext();
    const suf = assessDataSufficiency(ctx);
    expect(suf.availableInsights).toContain('Within-session trajectory');
  });
});

// --- buildReplayContext ---

function makeEvent(
  overrides: Partial<StoredMidiEvent> & { timestamp: number; type: 'note-on' | 'note-off' }
): StoredMidiEvent {
  return {
    id: 1,
    sessionId: 1,
    note: 60,
    noteName: 'C',
    velocity: overrides.type === 'note-off' ? 0 : 80,
    channel: 1,
    source: 'midi' as const,
    userId: null,
    syncStatus: 'pending' as const,
    ...overrides,
  };
}

const sessionMeta = { key: 'C major', tempo: 120, genre: 'Jazz' };

describe('buildReplayContext', () => {
  it('returns formatted timestamp', () => {
    const ctx = buildReplayContext([], 90_000, [], sessionMeta);
    expect(ctx.timestampFormatted).toBe('1:30');
    expect(ctx.timestampMs).toBe(90_000);
  });

  it('extracts events within window', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 1000, type: 'note-on', note: 60, noteName: 'C' }),
      makeEvent({ timestamp: 5000, type: 'note-on', note: 64, noteName: 'E' }),
      makeEvent({ timestamp: 15000, type: 'note-on', note: 67, noteName: 'G' }),
      makeEvent({ timestamp: 25000, type: 'note-on', note: 72, noteName: 'C' }),
    ];
    // Window: 5000 ± 10000 = [0, 15000)
    const ctx = buildReplayContext(events, 5000, [], sessionMeta, 10_000);
    // notesAtMoment includes notes active at timestamp 5000
    // note-on at 1000 (C) is active, note-on at 5000 (E) is active
    expect(ctx.notesAtMoment).toContain('C');
    expect(ctx.notesAtMoment).toContain('E');
  });

  it('handles note-off correctly', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 1000, type: 'note-on', note: 60, noteName: 'C' }),
      makeEvent({ timestamp: 3000, type: 'note-off', note: 60, noteName: 'C' }),
      makeEvent({ timestamp: 5000, type: 'note-on', note: 64, noteName: 'E' }),
    ];
    // At timestamp 5000, C was released, E is active
    const ctx = buildReplayContext(events, 5000, [], sessionMeta, 10_000);
    expect(ctx.notesAtMoment).not.toContain('C');
    expect(ctx.notesAtMoment).toContain('E');
  });

  it('returns empty notes at moment when no events at timestamp', () => {
    const ctx = buildReplayContext([], 5000, [], sessionMeta);
    expect(ctx.notesAtMoment).toEqual([]);
    expect(ctx.chordAtMoment).toBeNull();
  });

  it('detects chord at moment when multiple notes are active', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 1000, type: 'note-on', note: 60, noteName: 'C' }),
      makeEvent({ timestamp: 1000, type: 'note-on', note: 64, noteName: 'E' }),
      makeEvent({ timestamp: 1000, type: 'note-on', note: 67, noteName: 'G' }),
    ];
    const ctx = buildReplayContext(events, 2000, [], sessionMeta, 10_000);
    expect(ctx.chordAtMoment).toBe('C+E+G');
  });

  it('includes session metadata', () => {
    const ctx = buildReplayContext([], 5000, [], sessionMeta);
    expect(ctx.key).toBe('C major');
    expect(ctx.tempo).toBe(120);
    expect(ctx.genre).toBe('Jazz');
  });

  it('includes nearby snapshots within window', () => {
    const snapshots: AnalysisSnapshot[] = [
      {
        id: 1,
        sessionId: 1,
        createdAt: 4000,
        data: { keyInsight: 'Timing drift', insightCategory: 'TIMING' },
        userId: null,
        syncStatus: 'pending',
      },
      {
        id: 2,
        sessionId: 1,
        createdAt: 50_000,
        data: { keyInsight: 'Far away', insightCategory: 'GENERAL' },
        userId: null,
        syncStatus: 'pending',
      },
    ];
    const ctx = buildReplayContext([], 5000, snapshots, sessionMeta, 10_000);
    expect(ctx.nearbySnapshots).toHaveLength(1);
    expect(ctx.nearbySnapshots[0].keyInsight).toBe('Timing drift');
  });

  it('handles timestamp at session start', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 500, type: 'note-on', note: 60, noteName: 'C' }),
    ];
    const ctx = buildReplayContext(events, 0, [], sessionMeta, 10_000);
    expect(ctx.timestampFormatted).toBe('0:00');
    expect(ctx.notesAtMoment).toEqual([]);
  });

  it('uses custom window size', () => {
    const ctx = buildReplayContext([], 5000, [], sessionMeta, 5000);
    expect(ctx.windowMs).toBe(5000);
  });

  it('builds chord progression from note clusters', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 1000, type: 'note-on', note: 60, noteName: 'C' }),
      makeEvent({ timestamp: 1050, type: 'note-on', note: 64, noteName: 'E' }),
      makeEvent({ timestamp: 3000, type: 'note-on', note: 65, noteName: 'F' }),
      makeEvent({ timestamp: 3050, type: 'note-on', note: 69, noteName: 'A' }),
    ];
    const ctx = buildReplayContext(events, 5000, [], sessionMeta, 10_000);
    expect(ctx.chordProgression.length).toBeGreaterThanOrEqual(2);
    expect(ctx.chordProgression[0]).toContain('C');
  });
});
