import { describe, it, expect, beforeEach } from 'vitest';
import { getSessionContextForAI } from './session-context-provider';
import { useSessionStore } from '@/stores/session-store';

describe('getSessionContextForAI', () => {
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
    });
  });

  it('returns null key when no key detected', () => {
    const ctx = getSessionContextForAI();
    expect(ctx.key).toBeNull();
  });

  it('formats detected key as string', () => {
    useSessionStore.setState({
      currentKey: { root: 'C', mode: 'major', confidence: 0.9 },
    });
    const ctx = getSessionContextForAI();
    expect(ctx.key).toBe('C major');
  });

  it('returns empty chords when none detected', () => {
    const ctx = getSessionContextForAI();
    expect(ctx.chords).toEqual([]);
  });

  it('formats recent chords with quality', () => {
    useSessionStore.setState({
      detectedChords: [
        { root: 'C', quality: 'Major', notes: [], timestamp: 1 },
        { root: 'A', quality: 'Minor', notes: [], timestamp: 2 },
      ],
    });
    const ctx = getSessionContextForAI();
    expect(ctx.chords).toEqual(['C', 'Am']);
  });

  it('normalizes timing accuracy to 0-1 scale', () => {
    useSessionStore.setState({ timingAccuracy: 75 });
    const ctx = getSessionContextForAI();
    expect(ctx.timingAccuracy).toBe(0.75);
  });

  it('clamps timingAccuracy above 100 to 1.0', () => {
    useSessionStore.setState({ timingAccuracy: 150 });
    const ctx = getSessionContextForAI();
    expect(ctx.timingAccuracy).toBe(1.0);
  });

  it('clamps negative timingAccuracy to 0', () => {
    useSessionStore.setState({ timingAccuracy: -20 });
    const ctx = getSessionContextForAI();
    expect(ctx.timingAccuracy).toBe(0);
  });

  it('returns tempo from store', () => {
    useSessionStore.setState({ currentTempo: 120 });
    const ctx = getSessionContextForAI();
    expect(ctx.tempo).toBe(120);
  });

  it('detects genre from highest confidence', () => {
    useSessionStore.setState({
      detectedGenres: [
        { genre: 'Blues', confidence: 0.7, matchedPatterns: [] },
        { genre: 'Jazz', confidence: 0.9, matchedPatterns: [] },
      ],
    });
    const ctx = getSessionContextForAI();
    expect(ctx.genre).toBe('Jazz');
  });

  it('returns null genre when no genres detected', () => {
    const ctx = getSessionContextForAI();
    expect(ctx.genre).toBeNull();
  });

  it('includes last 3 snapshots', () => {
    const snaps = Array.from({ length: 5 }, (_, i) => ({
      id: `snap-${i}`,
      key: null,
      chordsUsed: [],
      timingAccuracy: 70 + i,
      averageTempo: 100,
      keyInsight: `Insight ${i}`,
      insightCategory: 'GENERAL' as const,
      genrePatterns: [],
      timestamp: 1000 + i * 1000,
    }));
    useSessionStore.setState({ snapshots: snaps });
    const ctx = getSessionContextForAI();
    expect(ctx.recentSnapshots).toHaveLength(3);
    expect(ctx.recentSnapshots[0].keyInsight).toBe('Insight 2');
  });

  it('includes tendencies when available', () => {
    useSessionStore.setState({
      playingTendencies: {
        keyDistribution: { C: 10 },
        chordTypeDistribution: { Major: 8 },
        tempoHistogram: [100],
        intervalDistribution: { 3: 5, 5: 3 },
        rhythmProfile: { swingRatio: 1, commonSubdivisions: [], averageDensity: 1 },
      },
      avoidancePatterns: {
        avoidedKeys: ['F#'],
        avoidedChordTypes: ['Diminished'],
        avoidedTempoRanges: [],
        avoidedIntervals: [],
      },
    });
    const ctx = getSessionContextForAI();
    expect(ctx.tendencies).not.toBeNull();
    expect(ctx.tendencies!.avoidedKeys).toEqual(['F#']);
    expect(ctx.tendencies!.avoidedChordTypes).toEqual(['Diminished']);
  });

  it('returns null tendencies when not available', () => {
    const ctx = getSessionContextForAI();
    expect(ctx.tendencies).toBeNull();
  });
});
