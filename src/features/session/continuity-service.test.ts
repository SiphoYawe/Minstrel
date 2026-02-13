import { describe, it, expect } from 'vitest';
import {
  mergeSessionSummaries,
  buildContinuityContext,
  buildWarmupContext,
} from './continuity-service';
import type { ContinuitySessionSummary } from './session-types';

function makeSummary(
  overrides: Partial<ContinuitySessionSummary> & { id: number; date: string }
): ContinuitySessionSummary {
  return {
    durationMs: 300_000,
    detectedKey: 'C major',
    averageTempo: 120,
    timingAccuracy: 0.75,
    chordsUsed: [],
    drillsCompleted: 0,
    keyInsight: null,
    weaknessAreas: [],
    snapshotCount: 0,
    ...overrides,
  };
}

describe('mergeSessionSummaries', () => {
  it('merges with no overlap', () => {
    const supabase = [makeSummary({ id: 1, date: '2026-02-13T10:00:00Z' })];
    const dexie = [makeSummary({ id: 2, date: '2026-02-12T10:00:00Z' })];
    const result = mergeSessionSummaries(supabase, dexie);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1); // more recent first
  });

  it('deduplicates by date, preferring Supabase', () => {
    const supabase = [makeSummary({ id: 1, date: '2026-02-13T10:00:00Z', timingAccuracy: 0.9 })];
    const dexie = [makeSummary({ id: 1, date: '2026-02-13T10:00:00Z', timingAccuracy: 0.7 })];
    const result = mergeSessionSummaries(supabase, dexie);
    expect(result).toHaveLength(1);
    expect(result[0].timingAccuracy).toBe(0.9); // Supabase value wins
  });

  it('limits to 5 sessions', () => {
    const sessions = Array.from({ length: 8 }, (_, i) =>
      makeSummary({ id: i + 1, date: new Date(2026, 1, 13 - i).toISOString() })
    );
    const result = mergeSessionSummaries(sessions, []);
    expect(result).toHaveLength(5);
  });

  it('sorts most recent first', () => {
    const supabase = [
      makeSummary({ id: 1, date: '2026-02-10T10:00:00Z' }),
      makeSummary({ id: 2, date: '2026-02-13T10:00:00Z' }),
    ];
    const result = mergeSessionSummaries(supabase, []);
    expect(result[0].id).toBe(2);
  });

  it('handles empty inputs', () => {
    expect(mergeSessionSummaries([], [])).toEqual([]);
  });
});

describe('buildContinuityContext', () => {
  it('returns empty sections for no sessions', () => {
    const ctx = buildContinuityContext([]);
    expect(ctx.recentSessions).toEqual([]);
    expect(ctx.timingTrend).toBeNull();
    expect(ctx.lastInsight).toBeNull();
    expect(ctx.rankedWeaknesses).toEqual([]);
  });

  it('includes recent session metadata', () => {
    const sessions = [
      makeSummary({
        id: 1,
        date: '2026-02-13T10:00:00Z',
        detectedKey: 'G major',
        averageTempo: 100,
        keyInsight: 'Your C to Am transition is slow',
      }),
    ];
    const ctx = buildContinuityContext(sessions);
    expect(ctx.recentSessions).toHaveLength(1);
    expect(ctx.recentSessions[0].key).toBe('G major');
    expect(ctx.lastInsight).toBe('Your C to Am transition is slow');
  });

  it('computes timing trend from multiple sessions', () => {
    const sessions = [
      makeSummary({ id: 1, date: '2026-02-13T10:00:00Z', timingAccuracy: 0.83 }),
      makeSummary({ id: 2, date: '2026-02-12T10:00:00Z', timingAccuracy: 0.78 }),
      makeSummary({ id: 3, date: '2026-02-11T10:00:00Z', timingAccuracy: 0.72 }),
    ];
    const ctx = buildContinuityContext(sessions);
    expect(ctx.timingTrend).toBe('72% → 78% → 83%');
  });

  it('returns null timing trend with single session', () => {
    const sessions = [makeSummary({ id: 1, date: '2026-02-13T10:00:00Z', timingAccuracy: 0.8 })];
    const ctx = buildContinuityContext(sessions);
    expect(ctx.timingTrend).toBeNull();
  });

  it('caps chords per session at 5', () => {
    const sessions = [
      makeSummary({
        id: 1,
        date: '2026-02-13T10:00:00Z',
        chordsUsed: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      }),
    ];
    const ctx = buildContinuityContext(sessions);
    expect(ctx.recentSessions[0].chordsUsed).toHaveLength(5);
  });

  it('includes ranked weaknesses', () => {
    const sessions = [
      makeSummary({ id: 1, date: '2026-02-13T10:00:00Z', weaknessAreas: ['timing', 'voicing'] }),
    ];
    const ctx = buildContinuityContext(sessions);
    expect(ctx.rankedWeaknesses).toHaveLength(2);
  });
});

describe('buildWarmupContext', () => {
  it('returns empty context for no sessions', () => {
    const ctx = buildWarmupContext([]);
    expect(ctx.recentKeys).toEqual([]);
    expect(ctx.recentChordTypes).toEqual([]);
    expect(ctx.recentSkillAreas).toEqual([]);
    expect(ctx.improvingPatterns).toEqual([]);
  });

  it('collects recent keys from sessions', () => {
    const sessions = [
      makeSummary({ id: 1, date: '2026-02-13T10:00:00Z', detectedKey: 'C major' }),
      makeSummary({ id: 2, date: '2026-02-12T10:00:00Z', detectedKey: 'G major' }),
    ];
    const ctx = buildWarmupContext(sessions);
    expect(ctx.recentKeys).toEqual(['C major', 'G major']);
  });

  it('deduplicates keys', () => {
    const sessions = [
      makeSummary({ id: 1, date: '2026-02-13T10:00:00Z', detectedKey: 'C major' }),
      makeSummary({ id: 2, date: '2026-02-12T10:00:00Z', detectedKey: 'C major' }),
    ];
    const ctx = buildWarmupContext(sessions);
    expect(ctx.recentKeys).toEqual(['C major']);
  });

  it('collects recent chord types', () => {
    const sessions = [
      makeSummary({ id: 1, date: '2026-02-13T10:00:00Z', chordsUsed: ['Cm', 'G', 'Am'] }),
    ];
    const ctx = buildWarmupContext(sessions);
    expect(ctx.recentChordTypes).toEqual(['Cm', 'G', 'Am']);
  });

  it('collects weakness areas as skill areas', () => {
    const sessions = [
      makeSummary({ id: 1, date: '2026-02-13T10:00:00Z', weaknessAreas: ['timing', 'voicing'] }),
    ];
    const ctx = buildWarmupContext(sessions);
    expect(ctx.recentSkillAreas).toEqual(['timing', 'voicing']);
  });

  it('limits to last 2 sessions', () => {
    const sessions = [
      makeSummary({ id: 1, date: '2026-02-13T10:00:00Z', detectedKey: 'C major' }),
      makeSummary({ id: 2, date: '2026-02-12T10:00:00Z', detectedKey: 'G major' }),
      makeSummary({ id: 3, date: '2026-02-11T10:00:00Z', detectedKey: 'D major' }),
    ];
    const ctx = buildWarmupContext(sessions);
    // Only first 2 sessions contribute to recentKeys
    expect(ctx.recentKeys).toEqual(['C major', 'G major']);
  });
});
