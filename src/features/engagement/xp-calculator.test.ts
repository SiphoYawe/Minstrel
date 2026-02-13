import { describe, it, expect } from 'vitest';
import {
  calculateBaseXp,
  calculateTimingBonus,
  calculateDrillXp,
  calculateRecordXp,
  calculateSessionXp,
  formatXpBreakdown,
} from './xp-calculator';
import type { SessionXpInput } from './engagement-types';

describe('calculateBaseXp', () => {
  it('returns 0 for sessions under 3 minutes', () => {
    expect(calculateBaseXp(179_999)).toBe(0); // just under 3 min
  });

  it('returns 0 for zero duration', () => {
    expect(calculateBaseXp(0)).toBe(0);
  });

  it('awards XP at exactly 3 minutes', () => {
    expect(calculateBaseXp(180_000)).toBe(3); // 3 min * 1 XP/min
  });

  it('awards XP proportional to minutes', () => {
    expect(calculateBaseXp(600_000)).toBe(10); // 10 min * 1 XP/min
  });

  it('rounds to nearest integer', () => {
    // 3.5 minutes = 3.5 XP → rounds to 4
    expect(calculateBaseXp(210_000)).toBe(4);
  });

  it('handles large durations', () => {
    expect(calculateBaseXp(3_600_000)).toBe(60); // 60 min
  });
});

describe('calculateTimingBonus', () => {
  it('returns 0 when no improvement', () => {
    expect(calculateTimingBonus(0.75, 0.75)).toBe(0);
  });

  it('returns 0 when regression', () => {
    expect(calculateTimingBonus(0.7, 0.8)).toBe(0);
  });

  it('awards bonus for +5% improvement', () => {
    // delta = 0.05, * 100 = 5, * 2 (multiplier) = 10
    expect(calculateTimingBonus(0.8, 0.75)).toBe(10);
  });

  it('awards bonus for +10% improvement', () => {
    // delta = 0.10, * 100 = 10, * 2 = 20
    expect(calculateTimingBonus(0.85, 0.75)).toBe(20);
  });

  it('works for small improvements', () => {
    // delta = 0.01, * 100 = 1, * 2 = 2
    expect(calculateTimingBonus(0.76, 0.75)).toBe(2);
  });

  it('works at high baseline', () => {
    // delta = 0.03, * 100 = 3, * 2 = 6
    expect(calculateTimingBonus(0.98, 0.95)).toBe(6);
  });
});

describe('calculateDrillXp', () => {
  it('returns 0 for no drills', () => {
    expect(calculateDrillXp([])).toBe(0);
  });

  it('awards full bonus for passed drill', () => {
    expect(calculateDrillXp([{ passed: true }])).toBe(15);
  });

  it('awards partial bonus for attempted drill', () => {
    expect(calculateDrillXp([{ passed: false }])).toBe(5);
  });

  it('sums multiple drills correctly', () => {
    const results = [{ passed: true }, { passed: false }, { passed: true }];
    expect(calculateDrillXp(results)).toBe(15 + 5 + 15);
  });

  it('handles all passed', () => {
    const results = [{ passed: true }, { passed: true }, { passed: true }];
    expect(calculateDrillXp(results)).toBe(45);
  });

  it('handles all attempted', () => {
    const results = [{ passed: false }, { passed: false }];
    expect(calculateDrillXp(results)).toBe(10);
  });
});

describe('calculateRecordXp', () => {
  it('returns 0 for no records', () => {
    expect(calculateRecordXp([])).toBe(0);
  });

  it('awards bonus per unique record type', () => {
    expect(calculateRecordXp(['fastest_tempo'])).toBe(25);
  });

  it('awards bonus for multiple unique types', () => {
    expect(calculateRecordXp(['fastest_tempo', 'best_accuracy'])).toBe(50);
  });

  it('deduplicates same record type', () => {
    expect(calculateRecordXp(['fastest_tempo', 'fastest_tempo'])).toBe(25);
  });

  it('deduplicates mixed', () => {
    expect(calculateRecordXp(['a', 'b', 'a', 'c', 'b'])).toBe(75);
  });
});

describe('calculateSessionXp', () => {
  it('returns all zeros for insufficient session', () => {
    const input: SessionXpInput = {
      activePlayDurationMs: 60_000, // 1 min — under threshold
      currentTimingAccuracy: 0.7,
      rollingTimingAverage: 0.75, // regression
      drillResults: [],
      newRecordTypes: [],
    };
    const result = calculateSessionXp(input);
    expect(result.practiceXp).toBe(0);
    expect(result.timingBonusXp).toBe(0);
    expect(result.drillCompletionXp).toBe(0);
    expect(result.newRecordXp).toBe(0);
    expect(result.totalXp).toBe(0);
  });

  it('combines all XP sources correctly', () => {
    const input: SessionXpInput = {
      activePlayDurationMs: 1_380_000, // 23 min
      currentTimingAccuracy: 0.85,
      rollingTimingAverage: 0.8, // +5%
      drillResults: [{ passed: true }],
      newRecordTypes: ['fastest_tempo'],
    };
    const result = calculateSessionXp(input);
    expect(result.practiceXp).toBe(23); // 23 min * 1
    expect(result.timingBonusXp).toBe(10); // 0.05 * 100 * 2
    expect(result.drillCompletionXp).toBe(15);
    expect(result.newRecordXp).toBe(25);
    expect(result.totalXp).toBe(73);
  });

  it('handles session with only practice time', () => {
    const input: SessionXpInput = {
      activePlayDurationMs: 600_000, // 10 min
      currentTimingAccuracy: 0.75,
      rollingTimingAverage: 0.75,
      drillResults: [],
      newRecordTypes: [],
    };
    const result = calculateSessionXp(input);
    expect(result.practiceXp).toBe(10);
    expect(result.totalXp).toBe(10);
  });

  it('handles session with only drills', () => {
    const input: SessionXpInput = {
      activePlayDurationMs: 60_000, // under threshold
      currentTimingAccuracy: 0.8,
      rollingTimingAverage: 0.8,
      drillResults: [{ passed: true }, { passed: false }],
      newRecordTypes: [],
    };
    const result = calculateSessionXp(input);
    expect(result.practiceXp).toBe(0);
    expect(result.drillCompletionXp).toBe(20);
    expect(result.totalXp).toBe(20);
  });
});

describe('formatXpBreakdown', () => {
  it('returns "0 XP" for empty breakdown', () => {
    const result = formatXpBreakdown({
      practiceXp: 0,
      timingBonusXp: 0,
      drillCompletionXp: 0,
      newRecordXp: 0,
      totalXp: 0,
    });
    expect(result).toBe('0 XP');
  });

  it('formats full breakdown as factual line items', () => {
    const result = formatXpBreakdown({
      practiceXp: 23,
      timingBonusXp: 10,
      drillCompletionXp: 15,
      newRecordXp: 25,
      totalXp: 73,
    });
    expect(result).toBe(
      'Practice: 23 XP, Timing Improvement: 10 XP, Drills: 15 XP, New Record: 25 XP = 73 XP'
    );
  });

  it('omits zero components', () => {
    const result = formatXpBreakdown({
      practiceXp: 10,
      timingBonusXp: 0,
      drillCompletionXp: 0,
      newRecordXp: 0,
      totalXp: 10,
    });
    expect(result).toBe('Practice: 10 XP = 10 XP');
  });
});
