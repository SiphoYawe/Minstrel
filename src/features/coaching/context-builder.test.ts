import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildSessionContext,
  assessDataSufficiency,
  buildReplayContext,
  formatContinuitySection,
} from './context-builder';
import { useSessionStore } from '@/stores/session-store';
import type { StoredMidiEvent, AnalysisSnapshot } from '@/lib/dexie/db';
import type { ContinuityContext } from '@/features/session/session-types';

// ---------------------------------------------------------------------------
// buildSessionContext
// ---------------------------------------------------------------------------

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

  it('normalizes timingAccuracy 73 to 0.73', () => {
    useSessionStore.setState({ timingAccuracy: 73 });
    const ctx = buildSessionContext();
    expect(ctx.timingAccuracy).toBe(0.73);
  });

  it('normalizes timingAccuracy 0 to 0', () => {
    useSessionStore.setState({ timingAccuracy: 0 });
    const ctx = buildSessionContext();
    expect(ctx.timingAccuracy).toBe(0);
  });

  it('normalizes timingAccuracy 100 to 1.0', () => {
    useSessionStore.setState({ timingAccuracy: 100 });
    const ctx = buildSessionContext();
    expect(ctx.timingAccuracy).toBe(1.0);
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

  it('returns null genre when no genres detected', () => {
    const ctx = buildSessionContext();
    expect(ctx.genre).toBeNull();
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
    expect(ctx.recentSnapshots[0].keyInsight).toBe('I2');
    expect(ctx.recentSnapshots[2].keyInsight).toBe('I4');
  });

  it('returns empty snapshots when none exist', () => {
    const ctx = buildSessionContext();
    expect(ctx.recentSnapshots).toEqual([]);
  });

  it('formats Major chords without suffix', () => {
    useSessionStore.setState({
      detectedChords: [{ root: 'C', quality: 'Major' as const, notes: [], timestamp: 0 }],
    });
    const ctx = buildSessionContext();
    expect(ctx.chords).toEqual(['C']);
  });

  it('formats Minor chords with m suffix', () => {
    useSessionStore.setState({
      detectedChords: [{ root: 'A', quality: 'Minor' as const, notes: [], timestamp: 0 }],
    });
    const ctx = buildSessionContext();
    expect(ctx.chords).toEqual(['Am']);
  });

  it('formats other chord qualities with quality string', () => {
    useSessionStore.setState({
      detectedChords: [{ root: 'G', quality: 'Diminished' as const, notes: [], timestamp: 0 }],
    });
    const ctx = buildSessionContext();
    expect(ctx.chords).toEqual(['GDiminished']);
  });

  it('slices chords to the last 20', () => {
    const chords = Array.from({ length: 30 }, (_, i) => ({
      root: 'C',
      quality: 'Major' as const,
      notes: [],
      timestamp: i * 100,
    }));
    useSessionStore.setState({ detectedChords: chords });
    const ctx = buildSessionContext();
    expect(ctx.chords).toHaveLength(20);
  });

  it('returns null tendencies when data is missing', () => {
    const ctx = buildSessionContext();
    expect(ctx.tendencies).toBeNull();
  });

  it('returns tendencies when both tendencies and avoidance exist', () => {
    useSessionStore.setState({
      playingTendencies: {
        intervalDistribution: { 3: 10, 5: 8, 7: 5 },
        rhythmPatterns: [],
        velocityProfile: { average: 80, range: [40, 120], consistency: 0.8 },
        keyPreferences: [],
      },
      avoidancePatterns: {
        avoidedKeys: ['F#'],
        avoidedChordTypes: ['dim', 'aug'],
        avoidedIntervals: [],
        comfortZoneBoundary: 0.7,
      },
    });
    const ctx = buildSessionContext();
    expect(ctx.tendencies).not.toBeNull();
    expect(ctx.tendencies?.avoidedKeys).toEqual(['F#']);
    expect(ctx.tendencies?.avoidedChordTypes).toEqual(['dim', 'aug']);
    expect(ctx.tendencies?.commonIntervals).toEqual([3, 5, 7]);
  });

  it('returns null tendencies when only playingTendencies exists', () => {
    useSessionStore.setState({
      playingTendencies: {
        intervalDistribution: { 3: 10 },
        rhythmPatterns: [],
        velocityProfile: { average: 80, range: [40, 120], consistency: 0.8 },
        keyPreferences: [],
      },
      avoidancePatterns: null,
    });
    const ctx = buildSessionContext();
    expect(ctx.tendencies).toBeNull();
  });

  it('passes through current tempo', () => {
    useSessionStore.setState({ currentTempo: 140 });
    const ctx = buildSessionContext();
    expect(ctx.tempo).toBe(140);
  });

  it('returns null tempo when not detected', () => {
    const ctx = buildSessionContext();
    expect(ctx.tempo).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// assessDataSufficiency
// ---------------------------------------------------------------------------

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

  it('reports chord pattern analysis missing with fewer than 3 chords', () => {
    useSessionStore.setState({
      totalNotesPlayed: 15,
      detectedChords: [{ root: 'C', quality: 'Major' as const, notes: [], timestamp: 0 }],
    });
    const ctx = buildSessionContext();
    const suf = assessDataSufficiency(ctx);
    expect(suf.missingInsights).toEqual(
      expect.arrayContaining([expect.stringContaining('Chord pattern analysis')])
    );
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

  it('detects timing analysis availability with 30s+ session', () => {
    useSessionStore.setState({
      totalNotesPlayed: 15,
      sessionStartTimestamp: Date.now() - 35_000,
    });
    const ctx = buildSessionContext();
    const suf = assessDataSufficiency(ctx);
    expect(suf.availableInsights).toContain('Timing analysis');
  });

  it('reports timing analysis missing with short session', () => {
    useSessionStore.setState({
      totalNotesPlayed: 15,
      sessionStartTimestamp: Date.now() - 5_000,
    });
    const ctx = buildSessionContext();
    const suf = assessDataSufficiency(ctx);
    expect(suf.missingInsights).toEqual(
      expect.arrayContaining([expect.stringContaining('Timing analysis')])
    );
  });

  it('detects session trend analysis with at least 1 snapshot', () => {
    useSessionStore.setState({
      totalNotesPlayed: 15,
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
      ],
    });
    const ctx = buildSessionContext();
    const suf = assessDataSufficiency(ctx);
    expect(suf.availableInsights).toContain('Session trend analysis');
  });

  it('reports trajectory missing with only 1 snapshot', () => {
    useSessionStore.setState({
      totalNotesPlayed: 15,
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
      ],
    });
    const ctx = buildSessionContext();
    const suf = assessDataSufficiency(ctx);
    expect(suf.missingInsights).toEqual(
      expect.arrayContaining([expect.stringContaining('Within-session trajectory')])
    );
  });

  it('gives unlock recommendation when notes >= 5 but missing data', () => {
    useSessionStore.setState({ totalNotesPlayed: 8 });
    const ctx = buildSessionContext();
    const suf = assessDataSufficiency(ctx);
    expect(suf.recommendation).toContain('Keep playing to unlock');
  });

  it('returns no recommendation when all insights available', () => {
    useSessionStore.setState({
      totalNotesPlayed: 20,
      sessionStartTimestamp: Date.now() - 60_000,
      detectedChords: Array.from({ length: 5 }, (_, i) => ({
        root: 'C',
        quality: 'Major' as const,
        notes: [],
        timestamp: i,
      })),
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
    expect(suf.recommendation).toBeUndefined();
    expect(suf.availableInsights).toHaveLength(5);
    expect(suf.missingInsights).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// buildReplayContext
// ---------------------------------------------------------------------------

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
  // --- timestamp formatting ---

  it('returns formatted timestamp', () => {
    const ctx = buildReplayContext([], 90_000, [], sessionMeta);
    expect(ctx.timestampFormatted).toBe('1:30');
    expect(ctx.timestampMs).toBe(90_000);
  });

  it('formats zero timestamp as 0:00', () => {
    const ctx = buildReplayContext([], 0, [], sessionMeta);
    expect(ctx.timestampFormatted).toBe('0:00');
  });

  it('formats single-digit seconds with leading zero', () => {
    const ctx = buildReplayContext([], 5000, [], sessionMeta);
    expect(ctx.timestampFormatted).toBe('0:05');
  });

  it('formats multi-minute timestamps correctly', () => {
    const ctx = buildReplayContext([], 600_000, [], sessionMeta);
    expect(ctx.timestampFormatted).toBe('10:00');
  });

  // --- timing accuracy from sessionMeta ---

  it('normalizes sessionMeta timingAccuracy 85 to 0.85', () => {
    const meta = { key: null, tempo: null, genre: null, timingAccuracy: 85 };
    const ctx = buildReplayContext([], 5000, [], meta);
    expect(ctx.timingAccuracy).toBe(0.85);
  });

  it('normalizes sessionMeta timingAccuracy 0 to 0', () => {
    const meta = { key: null, tempo: null, genre: null, timingAccuracy: 0 };
    const ctx = buildReplayContext([], 5000, [], meta);
    expect(ctx.timingAccuracy).toBe(0);
  });

  it('normalizes sessionMeta timingAccuracy 100 to 1.0', () => {
    const meta = { key: null, tempo: null, genre: null, timingAccuracy: 100 };
    const ctx = buildReplayContext([], 5000, [], meta);
    expect(ctx.timingAccuracy).toBe(1.0);
  });

  it('defaults timingAccuracy to 0 when sessionMeta.timingAccuracy is null', () => {
    const meta = { key: null, tempo: null, genre: null, timingAccuracy: null };
    const ctx = buildReplayContext([], 5000, [], meta);
    expect(ctx.timingAccuracy).toBe(0);
  });

  it('defaults timingAccuracy to 0 when sessionMeta.timingAccuracy is undefined', () => {
    const meta = { key: null, tempo: null, genre: null };
    const ctx = buildReplayContext([], 5000, [], meta);
    expect(ctx.timingAccuracy).toBe(0);
  });

  // --- binary search & windowed events ---

  it('extracts events within window', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 1000, type: 'note-on', note: 60, noteName: 'C' }),
      makeEvent({ timestamp: 5000, type: 'note-on', note: 64, noteName: 'E' }),
      makeEvent({ timestamp: 15000, type: 'note-on', note: 67, noteName: 'G' }),
      makeEvent({ timestamp: 25000, type: 'note-on', note: 72, noteName: 'C' }),
    ];
    // Window: 5000 +/- 10000 = [0, 15000)
    const ctx = buildReplayContext(events, 5000, [], sessionMeta, 10_000);
    // notesAtMoment includes notes active at timestamp 5000
    expect(ctx.notesAtMoment).toContain('C');
    expect(ctx.notesAtMoment).toContain('E');
  });

  it('excludes events outside the window', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 1000, type: 'note-on', note: 60, noteName: 'C' }),
      makeEvent({ timestamp: 50_000, type: 'note-on', note: 64, noteName: 'E' }),
    ];
    // Window: 5000 +/- 2000 = [3000, 7000)
    const ctx = buildReplayContext(events, 5000, [], sessionMeta, 2000);
    expect(ctx.notesAtMoment).toEqual([]);
    expect(ctx.chordProgression).toEqual([]);
  });

  it('correctly windows large sorted event arrays via binary search', () => {
    // Create 1000 events, one every 100ms
    const events: StoredMidiEvent[] = Array.from({ length: 1000 }, (_, i) =>
      makeEvent({
        timestamp: i * 100,
        type: 'note-on',
        note: 60 + (i % 12),
        noteName: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][i % 12],
      })
    );
    // Window: 50000 +/- 1000 = [49000, 51000)
    const ctx = buildReplayContext(events, 50_000, [], sessionMeta, 1000);
    // Events at 49000..50900 in window (timestamps 49000,49100,...,50900 = 20 events)
    // Notes at moment: only events at or before timestamp 50000
    // That's 49000,49100,...,50000 = 11 events
    expect(ctx.notesAtMoment.length).toBeGreaterThan(0);
    expect(ctx.notesAtMoment.length).toBeLessThanOrEqual(12);
  });

  // --- note-on / note-off ---

  it('handles note-off correctly', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 1000, type: 'note-on', note: 60, noteName: 'C' }),
      makeEvent({ timestamp: 3000, type: 'note-off', note: 60, noteName: 'C' }),
      makeEvent({ timestamp: 5000, type: 'note-on', note: 64, noteName: 'E' }),
    ];
    const ctx = buildReplayContext(events, 5000, [], sessionMeta, 10_000);
    expect(ctx.notesAtMoment).not.toContain('C');
    expect(ctx.notesAtMoment).toContain('E');
  });

  it('treats note-on with velocity 0 as note-off', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 1000, type: 'note-on', note: 60, noteName: 'C', velocity: 80 }),
      makeEvent({ timestamp: 3000, type: 'note-on', note: 60, noteName: 'C', velocity: 0 }),
      makeEvent({ timestamp: 5000, type: 'note-on', note: 64, noteName: 'E', velocity: 80 }),
    ];
    const ctx = buildReplayContext(events, 5000, [], sessionMeta, 10_000);
    expect(ctx.notesAtMoment).not.toContain('C');
    expect(ctx.notesAtMoment).toContain('E');
  });

  it('returns empty notes at moment when no events at timestamp', () => {
    const ctx = buildReplayContext([], 5000, [], sessionMeta);
    expect(ctx.notesAtMoment).toEqual([]);
    expect(ctx.chordAtMoment).toBeNull();
  });

  // --- chord detection ---

  it('detects chord at moment when multiple notes are active', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 1000, type: 'note-on', note: 60, noteName: 'C' }),
      makeEvent({ timestamp: 1000, type: 'note-on', note: 64, noteName: 'E' }),
      makeEvent({ timestamp: 1000, type: 'note-on', note: 67, noteName: 'G' }),
    ];
    const ctx = buildReplayContext(events, 2000, [], sessionMeta, 10_000);
    expect(ctx.chordAtMoment).toBe('C+E+G');
  });

  it('returns null chord at moment with single active note', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 1000, type: 'note-on', note: 60, noteName: 'C' }),
    ];
    const ctx = buildReplayContext(events, 2000, [], sessionMeta, 10_000);
    expect(ctx.notesAtMoment).toEqual(['C']);
    expect(ctx.chordAtMoment).toBeNull();
  });

  // --- chord progression building ---

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

  it('groups simultaneous notes into single chord label', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 1000, type: 'note-on', note: 60, noteName: 'C' }),
      makeEvent({ timestamp: 1010, type: 'note-on', note: 64, noteName: 'E' }),
      makeEvent({ timestamp: 1020, type: 'note-on', note: 67, noteName: 'G' }),
    ];
    const ctx = buildReplayContext(events, 2000, [], sessionMeta, 10_000);
    expect(ctx.chordProgression).toHaveLength(1);
    expect(ctx.chordProgression[0]).toBe('C+E+G');
  });

  it('splits clusters when gap exceeds 200ms', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 1000, type: 'note-on', note: 60, noteName: 'C' }),
      makeEvent({ timestamp: 1300, type: 'note-on', note: 64, noteName: 'E' }),
    ];
    const ctx = buildReplayContext(events, 2000, [], sessionMeta, 10_000);
    expect(ctx.chordProgression).toHaveLength(2);
    expect(ctx.chordProgression[0]).toBe('C');
    expect(ctx.chordProgression[1]).toBe('E');
  });

  it('limits chord progression to last 8 clusters', () => {
    // Create 12 clusters with 300ms gaps (> 200ms threshold)
    const events: StoredMidiEvent[] = [];
    for (let i = 0; i < 12; i++) {
      events.push(
        makeEvent({
          timestamp: i * 400,
          type: 'note-on',
          note: 60 + i,
          noteName: `N${i}`,
        })
      );
    }
    const ctx = buildReplayContext(events, 5000, [], sessionMeta, 10_000);
    expect(ctx.chordProgression.length).toBeLessThanOrEqual(8);
  });

  it('only includes note-on events at or before timestamp in progression', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 1000, type: 'note-on', note: 60, noteName: 'C' }),
      makeEvent({ timestamp: 6000, type: 'note-on', note: 64, noteName: 'E' }),
    ];
    // Timestamp is 3000; window is [0, 13000)
    // Only C at 1000 is <= 3000
    const ctx = buildReplayContext(events, 3000, [], sessionMeta, 10_000);
    expect(ctx.chordProgression).toEqual(['C']);
  });

  // --- session metadata ---

  it('includes session metadata', () => {
    const ctx = buildReplayContext([], 5000, [], sessionMeta);
    expect(ctx.key).toBe('C major');
    expect(ctx.tempo).toBe(120);
    expect(ctx.genre).toBe('Jazz');
  });

  it('passes null metadata fields through', () => {
    const meta = { key: null, tempo: null, genre: null };
    const ctx = buildReplayContext([], 5000, [], meta);
    expect(ctx.key).toBeNull();
    expect(ctx.tempo).toBeNull();
    expect(ctx.genre).toBeNull();
  });

  // --- nearby snapshots ---

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

  it('limits nearby snapshots to last 10', () => {
    const snapshots: AnalysisSnapshot[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      sessionId: 1,
      createdAt: 4000 + i * 10,
      data: { keyInsight: `Insight ${i}`, insightCategory: 'GENERAL' },
      userId: null,
      syncStatus: 'pending' as const,
    }));
    const ctx = buildReplayContext([], 5000, snapshots, sessionMeta, 10_000);
    expect(ctx.nearbySnapshots).toHaveLength(10);
  });

  it('defaults keyInsight and insightCategory when snapshot data missing fields', () => {
    const snapshots: AnalysisSnapshot[] = [
      {
        id: 1,
        sessionId: 1,
        createdAt: 4000,
        data: {},
        userId: null,
        syncStatus: 'pending',
      },
    ];
    const ctx = buildReplayContext([], 5000, snapshots, sessionMeta, 10_000);
    expect(ctx.nearbySnapshots[0].keyInsight).toBe('');
    expect(ctx.nearbySnapshots[0].insightCategory).toBe('GENERAL');
  });

  // --- edge cases ---

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

  it('uses default 10s window when not specified', () => {
    const ctx = buildReplayContext([], 5000, [], sessionMeta);
    expect(ctx.windowMs).toBe(10_000);
  });

  it('clamps windowStart to 0 when timestamp < windowMs', () => {
    const events: StoredMidiEvent[] = [
      makeEvent({ timestamp: 100, type: 'note-on', note: 60, noteName: 'C' }),
    ];
    // timestamp=500, windowMs=10000 -> windowStart = max(0, -9500) = 0
    const ctx = buildReplayContext(events, 500, [], sessionMeta, 10_000);
    expect(ctx.notesAtMoment).toContain('C');
  });
});

// ---------------------------------------------------------------------------
// formatContinuitySection
// ---------------------------------------------------------------------------

describe('formatContinuitySection', () => {
  it('returns empty string for no sessions', () => {
    const ctx: ContinuityContext = {
      recentSessions: [],
      timingTrend: null,
      lastInsight: null,
      rankedWeaknesses: [],
    };
    expect(formatContinuitySection(ctx)).toBe('');
  });

  it('includes session count in header', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: 'C major',
          tempo: 120,
          timingAccuracy: 0.8,
          chordsUsed: ['Cm'],
          keyInsight: 'Good session',
        },
      ],
      timingTrend: null,
      lastInsight: 'Good session',
      rankedWeaknesses: [],
    };
    const result = formatContinuitySection(ctx);
    expect(result).toContain('1 recent sessions');
  });

  it('includes session metadata', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: 'G major',
          tempo: 100,
          timingAccuracy: 0.75,
          chordsUsed: [],
          keyInsight: null,
        },
      ],
      timingTrend: null,
      lastInsight: null,
      rankedWeaknesses: [],
    };
    const result = formatContinuitySection(ctx);
    expect(result).toContain('key: G major');
    expect(result).toContain('tempo: 100 BPM');
    expect(result).toContain('timing: 75%');
  });

  it('omits key when null', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: null,
          tempo: null,
          timingAccuracy: null,
          chordsUsed: [],
          keyInsight: null,
        },
      ],
      timingTrend: null,
      lastInsight: null,
      rankedWeaknesses: [],
    };
    const result = formatContinuitySection(ctx);
    expect(result).not.toContain('key:');
  });

  it('omits tempo when null', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: null,
          tempo: null,
          timingAccuracy: null,
          chordsUsed: [],
          keyInsight: null,
        },
      ],
      timingTrend: null,
      lastInsight: null,
      rankedWeaknesses: [],
    };
    const result = formatContinuitySection(ctx);
    expect(result).not.toContain('tempo:');
  });

  it('omits timing when null', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: null,
          tempo: null,
          timingAccuracy: null,
          chordsUsed: [],
          keyInsight: null,
        },
      ],
      timingTrend: null,
      lastInsight: null,
      rankedWeaknesses: [],
    };
    const result = formatContinuitySection(ctx);
    expect(result).not.toContain('timing:');
  });

  it('includes chords when present', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: null,
          tempo: null,
          timingAccuracy: null,
          chordsUsed: ['Cm', 'G7', 'F'],
          keyInsight: null,
        },
      ],
      timingTrend: null,
      lastInsight: null,
      rankedWeaknesses: [],
    };
    const result = formatContinuitySection(ctx);
    expect(result).toContain('chords: Cm, G7, F');
  });

  it('includes key insight indented below session line', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: null,
          tempo: null,
          timingAccuracy: null,
          chordsUsed: [],
          keyInsight: 'Struggled with minor 7ths',
        },
      ],
      timingTrend: null,
      lastInsight: null,
      rankedWeaknesses: [],
    };
    const result = formatContinuitySection(ctx);
    expect(result).toContain('Insight: Struggled with minor 7ths');
  });

  it('includes timing trend', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: null,
          tempo: null,
          timingAccuracy: 0.83,
          chordsUsed: [],
          keyInsight: null,
        },
      ],
      timingTrend: '72% ▶ 78% ▶ 83%',
      lastInsight: null,
      rankedWeaknesses: [],
    };
    const result = formatContinuitySection(ctx);
    expect(result).toContain('TIMING TREND: 72% ▶ 78% ▶ 83%');
  });

  it('includes ranked weaknesses with trend icons', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: null,
          tempo: null,
          timingAccuracy: null,
          chordsUsed: [],
          keyInsight: null,
        },
      ],
      timingTrend: null,
      lastInsight: null,
      rankedWeaknesses: [
        { skill: 'timing', severity: 0.8, lastSessionDate: '2026-02-13', trend: 'declining' },
        { skill: 'voicing', severity: 0.5, lastSessionDate: '2026-02-13', trend: 'improving' },
      ],
    };
    const result = formatContinuitySection(ctx);
    expect(result).toContain('▼ timing');
    expect(result).toContain('▲ voicing');
  });

  it('uses stable trend icon for stable weakness', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: null,
          tempo: null,
          timingAccuracy: null,
          chordsUsed: [],
          keyInsight: null,
        },
      ],
      timingTrend: null,
      lastInsight: null,
      rankedWeaknesses: [
        { skill: 'rhythm', severity: 0.6, lastSessionDate: '2026-02-13', trend: 'stable' },
      ],
    };
    const result = formatContinuitySection(ctx);
    expect(result).toContain('▶ rhythm');
  });

  it('limits weaknesses to 5', () => {
    const weaknesses = Array.from({ length: 8 }, (_, i) => ({
      skill: `skill-${i}`,
      severity: 0.5,
      lastSessionDate: '2026-02-13',
      trend: 'stable' as const,
    }));
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: null,
          tempo: null,
          timingAccuracy: null,
          chordsUsed: [],
          keyInsight: null,
        },
      ],
      timingTrend: null,
      lastInsight: null,
      rankedWeaknesses: weaknesses,
    };
    const result = formatContinuitySection(ctx);
    expect(result).toContain('skill-4');
    expect(result).not.toContain('skill-5');
  });

  it('includes weakness severity as percentage', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: null,
          tempo: null,
          timingAccuracy: null,
          chordsUsed: [],
          keyInsight: null,
        },
      ],
      timingTrend: null,
      lastInsight: null,
      rankedWeaknesses: [
        { skill: 'timing', severity: 0.82, lastSessionDate: '2026-02-13', trend: 'declining' },
      ],
    };
    const result = formatContinuitySection(ctx);
    expect(result).toContain('severity: 82%');
  });

  it('includes most recent insight', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: null,
          tempo: null,
          timingAccuracy: null,
          chordsUsed: [],
          keyInsight: 'C to Am slow',
        },
      ],
      timingTrend: null,
      lastInsight: 'C to Am slow',
      rankedWeaknesses: [],
    };
    const result = formatContinuitySection(ctx);
    expect(result).toContain('MOST RECENT INSIGHT: C to Am slow');
  });

  it('includes natural reference instruction', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-13',
          key: null,
          tempo: null,
          timingAccuracy: null,
          chordsUsed: [],
          keyInsight: null,
        },
      ],
      timingTrend: null,
      lastInsight: null,
      rankedWeaknesses: [],
    };
    const result = formatContinuitySection(ctx);
    expect(result).toContain('Reference this history naturally');
  });

  it('formats multiple sessions on separate lines', () => {
    const ctx: ContinuityContext = {
      recentSessions: [
        {
          date: '2026-02-12',
          key: 'C major',
          tempo: 100,
          timingAccuracy: 0.7,
          chordsUsed: [],
          keyInsight: null,
        },
        {
          date: '2026-02-13',
          key: 'G major',
          tempo: 120,
          timingAccuracy: 0.8,
          chordsUsed: [],
          keyInsight: null,
        },
      ],
      timingTrend: null,
      lastInsight: null,
      rankedWeaknesses: [],
    };
    const result = formatContinuitySection(ctx);
    expect(result).toContain('2 recent sessions');
    expect(result).toContain('2026-02-12');
    expect(result).toContain('2026-02-13');
    expect(result).toContain('key: C major');
    expect(result).toContain('key: G major');
  });
});
