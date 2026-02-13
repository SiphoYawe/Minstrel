import { describe, it, expect, beforeEach } from 'vitest';
import { buildSessionContext, assessDataSufficiency } from './context-builder';
import { useSessionStore } from '@/stores/session-store';

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
