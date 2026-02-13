import { describe, it, expect } from 'vitest';
import { detectFlowState } from './flow-state-detector';
import type { TimingEvent } from './analysis-types';

function makeEvent(noteTs: number, deviationMs: number, beatIndex: number): TimingEvent {
  return {
    noteTimestamp: noteTs,
    expectedBeatTimestamp: noteTs - deviationMs,
    deviationMs,
    beatIndex,
  };
}

describe('detectFlowState', () => {
  const NOW = 60_000;

  it('returns not-in-flow with empty deviations', () => {
    const result = detectFlowState([], NOW);
    expect(result.isInFlow).toBe(false);
    expect(result.rollingAccuracy).toBe(0);
    expect(result.windowNoteCount).toBe(0);
  });

  it('returns not-in-flow when fewer than 12 notes in window', () => {
    const events: TimingEvent[] = [];
    for (let i = 0; i < 8; i++) {
      events.push(makeEvent(NOW - 5000 + i * 500, 10, i));
    }
    const result = detectFlowState(events, NOW);
    expect(result.isInFlow).toBe(false);
    expect(result.windowNoteCount).toBe(8);
  });

  it('detects flow state when >85% notes are within ±50ms', () => {
    const events: TimingEvent[] = [];
    // 20 notes, all within ±50ms
    for (let i = 0; i < 20; i++) {
      events.push(makeEvent(NOW - 25000 + i * 1000, (i % 3) * 15, i));
    }
    const result = detectFlowState(events, NOW);
    expect(result.isInFlow).toBe(true);
    expect(result.rollingAccuracy).toBeGreaterThanOrEqual(0.85);
    expect(result.windowNoteCount).toBe(20);
  });

  it('does not detect flow when accuracy is below threshold', () => {
    const events: TimingEvent[] = [];
    // 20 notes, half with large deviations (>50ms)
    for (let i = 0; i < 20; i++) {
      const dev = i % 2 === 0 ? 10 : 80;
      events.push(makeEvent(NOW - 25000 + i * 1000, dev, i));
    }
    const result = detectFlowState(events, NOW);
    expect(result.isInFlow).toBe(false);
    expect(result.rollingAccuracy).toBeCloseTo(0.5, 1);
  });

  it('excludes notes outside the 30-second window', () => {
    const events: TimingEvent[] = [];
    // 10 old notes (outside window)
    for (let i = 0; i < 10; i++) {
      events.push(makeEvent(NOW - 40000 + i * 500, 10, i));
    }
    // 15 recent notes (inside window)
    for (let i = 0; i < 15; i++) {
      events.push(makeEvent(NOW - 20000 + i * 1000, 20, 10 + i));
    }
    const result = detectFlowState(events, NOW);
    expect(result.windowNoteCount).toBe(15);
    expect(result.isInFlow).toBe(true);
  });

  it('treats ±50ms boundary as on-time', () => {
    const events: TimingEvent[] = [];
    for (let i = 0; i < 15; i++) {
      events.push(makeEvent(NOW - 20000 + i * 1000, 50, i)); // exactly 50ms
    }
    const result = detectFlowState(events, NOW);
    expect(result.rollingAccuracy).toBe(1);
    expect(result.isInFlow).toBe(true);
  });

  it('treats >50ms as off-time', () => {
    const events: TimingEvent[] = [];
    for (let i = 0; i < 15; i++) {
      events.push(makeEvent(NOW - 20000 + i * 1000, 51, i)); // 51ms — off
    }
    const result = detectFlowState(events, NOW);
    expect(result.rollingAccuracy).toBe(0);
    expect(result.isInFlow).toBe(false);
  });
});
