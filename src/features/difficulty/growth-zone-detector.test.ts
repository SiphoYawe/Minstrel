// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  detectZone,
  isTooEasy,
  isTooHard,
  isInGrowthZone,
  getAccuracyTrend,
  GROWTH_ZONE,
} from './growth-zone-detector';
import { GrowthZoneStatus, type RepPerformance } from './difficulty-types';

function makeRep(accuracy: number, repNumber = 1): RepPerformance {
  return { repNumber, accuracy, timingDeviation: 10, completedAt: new Date().toISOString() };
}

describe('isTooEasy', () => {
  it('returns true when all 3 reps > 90%', () => {
    const reps = [makeRep(0.95), makeRep(0.92), makeRep(0.98)];
    expect(isTooEasy(reps)).toBe(true);
  });

  it('returns false when exactly 90%', () => {
    const reps = [makeRep(0.9), makeRep(0.95), makeRep(0.91)];
    expect(isTooEasy(reps)).toBe(false);
  });

  it('returns false for fewer than 3 reps', () => {
    const reps = [makeRep(0.95), makeRep(0.98)];
    expect(isTooEasy(reps)).toBe(false);
  });

  it('returns false when one rep is below threshold', () => {
    const reps = [makeRep(0.95), makeRep(0.85), makeRep(0.92)];
    expect(isTooEasy(reps)).toBe(false);
  });
});

describe('isTooHard', () => {
  it('returns true when all 3 reps < 40%', () => {
    const reps = [makeRep(0.3), makeRep(0.35), makeRep(0.25)];
    expect(isTooHard(reps)).toBe(true);
  });

  it('returns false when exactly 40%', () => {
    const reps = [makeRep(0.4), makeRep(0.35), makeRep(0.3)];
    expect(isTooHard(reps)).toBe(false);
  });

  it('returns false for fewer than 3 reps', () => {
    const reps = [makeRep(0.2)];
    expect(isTooHard(reps)).toBe(false);
  });
});

describe('isInGrowthZone', () => {
  it('returns true when average is between 60-85%', () => {
    const reps = [makeRep(0.72), makeRep(0.68), makeRep(0.75)];
    expect(isInGrowthZone(reps)).toBe(true);
  });

  it('returns true for exactly 60% average', () => {
    const reps = [makeRep(0.6), makeRep(0.6), makeRep(0.6)];
    expect(isInGrowthZone(reps)).toBe(true);
  });

  it('returns true for exactly 85% average', () => {
    const reps = [makeRep(0.85), makeRep(0.85), makeRep(0.85)];
    expect(isInGrowthZone(reps)).toBe(true);
  });

  it('returns false when average > 85%', () => {
    const reps = [makeRep(0.9), makeRep(0.95), makeRep(0.88)];
    expect(isInGrowthZone(reps)).toBe(false);
  });

  it('returns false when average < 60%', () => {
    const reps = [makeRep(0.5), makeRep(0.55), makeRep(0.45)];
    expect(isInGrowthZone(reps)).toBe(false);
  });

  it('returns false for empty reps', () => {
    expect(isInGrowthZone([])).toBe(false);
  });
});

describe('getAccuracyTrend', () => {
  it('returns improving when accuracy increases', () => {
    const reps = [makeRep(0.6, 1), makeRep(0.7, 2), makeRep(0.8, 3)];
    expect(getAccuracyTrend(reps)).toBe('improving');
  });

  it('returns declining when accuracy decreases', () => {
    const reps = [makeRep(0.8, 1), makeRep(0.7, 2), makeRep(0.6, 3)];
    expect(getAccuracyTrend(reps)).toBe('declining');
  });

  it('returns stable when accuracy is flat', () => {
    const reps = [makeRep(0.72, 1), makeRep(0.73, 2), makeRep(0.72, 3)];
    expect(getAccuracyTrend(reps)).toBe('stable');
  });

  it('returns stable for fewer than 3 reps', () => {
    expect(getAccuracyTrend([makeRep(0.7)])).toBe('stable');
  });
});

describe('detectZone', () => {
  it('returns TooEasy for 3 reps at 95%', () => {
    const history = [makeRep(0.95, 1), makeRep(0.96, 2), makeRep(0.94, 3)];
    expect(detectZone(history)).toBe(GrowthZoneStatus.TooEasy);
  });

  it('returns TooHard for 3 reps at 30%', () => {
    const history = [makeRep(0.3, 1), makeRep(0.25, 2), makeRep(0.35, 3)];
    expect(detectZone(history)).toBe(GrowthZoneStatus.TooHard);
  });

  it('returns GrowthZone for 3 reps at 72%', () => {
    const history = [makeRep(0.72, 1), makeRep(0.7, 2), makeRep(0.74, 3)];
    expect(detectZone(history)).toBe(GrowthZoneStatus.GrowthZone);
  });

  it('returns GrowthZone for mixed inconsistent reps', () => {
    const history = [makeRep(0.95, 1), makeRep(0.4, 2), makeRep(0.7, 3)];
    expect(detectZone(history)).toBe(GrowthZoneStatus.GrowthZone);
  });

  it('returns GrowthZone when fewer than 3 reps', () => {
    const history = [makeRep(0.95, 1), makeRep(0.95, 2)];
    expect(detectZone(history)).toBe(GrowthZoneStatus.GrowthZone);
  });

  it('only considers last 3 reps', () => {
    const history = [
      makeRep(0.3, 1),
      makeRep(0.3, 2),
      makeRep(0.3, 3),
      makeRep(0.95, 4),
      makeRep(0.96, 5),
      makeRep(0.94, 6),
    ];
    expect(detectZone(history)).toBe(GrowthZoneStatus.TooEasy);
  });

  it('validates boundary: exactly 40% is NOT too hard', () => {
    const history = [makeRep(0.4, 1), makeRep(0.4, 2), makeRep(0.4, 3)];
    expect(detectZone(history)).not.toBe(GrowthZoneStatus.TooHard);
  });

  it('validates boundary: exactly 90% is NOT too easy', () => {
    const history = [makeRep(0.9, 1), makeRep(0.9, 2), makeRep(0.9, 3)];
    expect(detectZone(history)).not.toBe(GrowthZoneStatus.TooEasy);
  });

  it('validates GROWTH_ZONE constants', () => {
    expect(GROWTH_ZONE.TOO_EASY_THRESHOLD).toBe(0.9);
    expect(GROWTH_ZONE.TOO_HARD_THRESHOLD).toBe(0.4);
    expect(GROWTH_ZONE.ZONE_LOW).toBe(0.6);
    expect(GROWTH_ZONE.ZONE_HIGH).toBe(0.85);
    expect(GROWTH_ZONE.CONSECUTIVE_REPS).toBe(3);
  });
});
