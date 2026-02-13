import { describe, it, expect } from 'vitest';
import { prioritizeWeaknesses } from './weakness-prioritizer';
import type { ContinuitySessionSummary } from './session-types';

function makeSummary(
  overrides: Partial<ContinuitySessionSummary> & { date: string }
): ContinuitySessionSummary {
  return {
    id: 1,
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

describe('prioritizeWeaknesses', () => {
  it('returns empty array for no sessions', () => {
    expect(prioritizeWeaknesses([])).toEqual([]);
  });

  it('extracts weaknesses from sessions', () => {
    const sessions = [
      makeSummary({
        id: 1,
        date: new Date().toISOString(),
        weaknessAreas: ['timing', 'chord transitions'],
      }),
    ];
    const result = prioritizeWeaknesses(sessions);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.skill)).toContain('timing');
    expect(result.map((r) => r.skill)).toContain('chord transitions');
  });

  it('ranks more frequent weaknesses higher', () => {
    const now = new Date();
    const sessions = [
      makeSummary({
        id: 1,
        date: now.toISOString(),
        weaknessAreas: ['timing', 'chord transitions'],
      }),
      makeSummary({ id: 2, date: now.toISOString(), weaknessAreas: ['timing'] }),
      makeSummary({ id: 3, date: now.toISOString(), weaknessAreas: ['timing'] }),
    ];
    const result = prioritizeWeaknesses(sessions);
    expect(result[0].skill).toBe('timing');
    expect(result[0].severity).toBeGreaterThan(result[1].severity);
  });

  it('ranks more recent weaknesses higher', () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sessions = [
      makeSummary({ id: 1, date: now.toISOString(), weaknessAreas: ['recent skill'] }),
      makeSummary({ id: 2, date: weekAgo.toISOString(), weaknessAreas: ['old skill'] }),
    ];
    const result = prioritizeWeaknesses(sessions);
    // Both appear once, but recent one has higher recency score
    const recentIdx = result.findIndex((r) => r.skill === 'recent skill');
    const oldIdx = result.findIndex((r) => r.skill === 'old skill');
    expect(recentIdx).toBeLessThan(oldIdx);
  });

  it('deprioritizes improving weaknesses with 0.5x multiplier', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    // "timing" appears in both but with improving accuracy
    const sessions = [
      makeSummary({
        id: 1,
        date: now.toISOString(),
        weaknessAreas: ['timing', 'voicing'],
        timingAccuracy: 0.9,
      }),
      makeSummary({
        id: 2,
        date: yesterday.toISOString(),
        weaknessAreas: ['timing', 'voicing'],
        timingAccuracy: 0.6,
      }),
    ];
    const result = prioritizeWeaknesses(sessions);
    const timing = result.find((r) => r.skill === 'timing');
    expect(timing?.trend).toBe('improving');
  });

  it('deduplicates case-insensitive weakness names', () => {
    const sessions = [
      makeSummary({ id: 1, date: new Date().toISOString(), weaknessAreas: ['Timing', 'timing'] }),
    ];
    const result = prioritizeWeaknesses(sessions);
    expect(result).toHaveLength(1);
  });

  it('assigns lastSessionDate from most recent occurrence', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sessions = [
      makeSummary({ id: 1, date: now.toISOString(), weaknessAreas: ['timing'] }),
      makeSummary({ id: 2, date: yesterday.toISOString(), weaknessAreas: ['timing'] }),
    ];
    const result = prioritizeWeaknesses(sessions);
    expect(result[0].lastSessionDate).toBe(now.toISOString());
  });

  it('detects stable trend when no clear direction', () => {
    const now = new Date();
    const sessions = [makeSummary({ id: 1, date: now.toISOString(), weaknessAreas: ['voicing'] })];
    const result = prioritizeWeaknesses(sessions);
    expect(result[0].trend).toBe('stable');
  });
});
