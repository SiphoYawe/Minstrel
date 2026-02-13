import { describe, it, expect } from 'vitest';
import { formatSnapshotsForPrompt } from './snapshot-formatter';
import type { InstantSnapshot } from '@/features/analysis/analysis-types';

function makeSnapshot(overrides: Partial<InstantSnapshot> = {}): InstantSnapshot {
  return {
    id: 'snap-1',
    key: { root: 'C', mode: 'major', confidence: 0.9 },
    chordsUsed: [],
    timingAccuracy: 73,
    averageTempo: 95,
    keyInsight: 'Timing improving on chord transitions',
    insightCategory: 'TIMING',
    genrePatterns: [],
    timestamp: 120_000,
    ...overrides,
  };
}

describe('formatSnapshotsForPrompt', () => {
  it('returns placeholder when no snapshots', () => {
    const result = formatSnapshotsForPrompt([], null);
    expect(result).toBe('No session snapshots yet.');
  });

  it('formats a single snapshot', () => {
    const snap = makeSnapshot();
    const result = formatSnapshotsForPrompt([snap], 0);
    expect(result).toContain('C major');
    expect(result).toContain('73%');
    expect(result).toContain('95 BPM');
    expect(result).toContain('Only one snapshot');
  });

  it('formats multiple snapshots with trajectory', () => {
    const snaps = [
      makeSnapshot({ id: '1', timingAccuracy: 65, timestamp: 60_000 }),
      makeSnapshot({ id: '2', timingAccuracy: 73, timestamp: 120_000 }),
      makeSnapshot({ id: '3', timingAccuracy: 79, timestamp: 180_000 }),
    ];
    const result = formatSnapshotsForPrompt(snaps, 0);
    expect(result).toContain('trajectory');
    expect(result).toContain('65%');
    expect(result).toContain('79%');
    expect(result).toContain('improving');
  });

  it('shows declining trajectory', () => {
    const snaps = [
      makeSnapshot({ id: '1', timingAccuracy: 80, timestamp: 60_000 }),
      makeSnapshot({ id: '2', timingAccuracy: 70, timestamp: 120_000 }),
    ];
    const result = formatSnapshotsForPrompt(snaps, 0);
    expect(result).toContain('declining');
  });

  it('limits to last 3 snapshots in output', () => {
    const snaps = Array.from({ length: 5 }, (_, i) =>
      makeSnapshot({ id: `s${i}`, timingAccuracy: 60 + i * 5, timestamp: i * 60_000 })
    );
    const result = formatSnapshotsForPrompt(snaps, 0);
    // Should show trajectory from first to last (all 5), but only detail last 3
    const lines = result.split('\n').filter((l) => l.startsWith('['));
    expect(lines.length).toBe(3);
  });

  it('calculates relative time from session start', () => {
    const snap = makeSnapshot({ timestamp: 135_000 });
    const result = formatSnapshotsForPrompt([snap], 0);
    expect(result).toContain('2:15');
  });
});
