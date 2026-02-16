// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  clearCanvas,
  noteNumberToY,
  velocityToAlpha,
  velocityToSize,
  buildTimeIndex,
  getEventsAtTimestamp,
} from './canvas-utils';

describe('clearCanvas', () => {
  it('fills the canvas with background color', () => {
    const calls: Array<{ method: string; args: unknown[] }> = [];
    const ctx = {
      set fillStyle(v: string) {
        calls.push({ method: 'fillStyle', args: [v] });
      },
      fillRect(...args: number[]) {
        calls.push({ method: 'fillRect', args });
      },
    } as unknown as CanvasRenderingContext2D;

    clearCanvas(ctx, 800, 600);
    expect(calls).toEqual([
      { method: 'fillStyle', args: ['#0F0F0F'] },
      { method: 'fillRect', args: [0, 0, 800, 600] },
    ]);
  });
});

describe('noteNumberToY', () => {
  it('maps note 0 to bottom of canvas', () => {
    expect(noteNumberToY(0, 600)).toBeCloseTo(600, 0);
  });

  it('maps note 127 to top of canvas', () => {
    expect(noteNumberToY(127, 600)).toBeCloseTo(0, 0);
  });

  it('maps middle C (60) to roughly mid canvas', () => {
    const y = noteNumberToY(60, 600);
    expect(y).toBeGreaterThan(200);
    expect(y).toBeLessThan(400);
  });

  // Story 23.1: Verify piano roll convention (low notes bottom, high notes top)
  it('maps C2 (MIDI 36) below C6 (MIDI 84) — standard piano roll convention', () => {
    const yC2 = noteNumberToY(36, 600);
    const yC6 = noteNumberToY(84, 600);
    expect(yC2).toBeGreaterThan(yC6); // C2 has larger Y (lower on screen)
  });

  it('ascending scale C3→C4→C5 moves upward (decreasing Y)', () => {
    const yC3 = noteNumberToY(48, 600);
    const yC4 = noteNumberToY(60, 600);
    const yC5 = noteNumberToY(72, 600);
    expect(yC3).toBeGreaterThan(yC4);
    expect(yC4).toBeGreaterThan(yC5);
  });

  it('works consistently across different canvas heights', () => {
    for (const h of [400, 600, 800, 1080]) {
      const low = noteNumberToY(36, h);
      const high = noteNumberToY(84, h);
      expect(low).toBeGreaterThan(high);
      expect(low).toBeLessThanOrEqual(h);
      expect(high).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('velocityToAlpha', () => {
  it('maps velocity 0 to minimum 0.5 (clamped)', () => {
    expect(velocityToAlpha(0)).toBe(0.5);
  });

  it('maps velocity 127 to 1.0', () => {
    expect(velocityToAlpha(127)).toBe(1.0);
  });

  it('soft notes (velocity 1-20) have at least 0.5 opacity', () => {
    for (let v = 1; v <= 20; v++) {
      expect(velocityToAlpha(v)).toBeGreaterThanOrEqual(0.5);
    }
  });
});

describe('velocityToSize', () => {
  it('maps velocity 0 to 0.6', () => {
    expect(velocityToSize(0)).toBe(0.6);
  });

  it('maps velocity 127 to 1.4', () => {
    expect(velocityToSize(127)).toBe(1.4);
  });
});

describe('buildTimeIndex', () => {
  it('filters and sorts events by timestamp', () => {
    const events = [
      { timestamp: 300, note: 62, velocity: 80, type: 'note-on' },
      { timestamp: 100, note: 60, velocity: 80, type: 'note-on' },
      { timestamp: 200, note: 60, velocity: 0, type: 'note-off' },
      { timestamp: 150, note: 64, velocity: 90, type: 'control-change' }, // filtered
    ];

    const index = buildTimeIndex(events);
    expect(index).toHaveLength(3);
    expect(index[0].timestamp).toBe(100);
    expect(index[1].timestamp).toBe(200);
    expect(index[2].timestamp).toBe(300);
  });

  it('excludes non-note events', () => {
    const events = [
      { timestamp: 100, note: 60, velocity: 80, type: 'control-change' },
      { timestamp: 200, note: 60, velocity: 80, type: 'note-on' },
    ];
    const index = buildTimeIndex(events);
    expect(index).toHaveLength(1);
  });
});

describe('getEventsAtTimestamp', () => {
  const events = [
    { timestamp: 100, note: 60, velocity: 80, type: 'note-on' },
    { timestamp: 200, note: 64, velocity: 90, type: 'note-on' },
    { timestamp: 300, note: 60, velocity: 0, type: 'note-off' },
    { timestamp: 400, note: 67, velocity: 85, type: 'note-on' },
    { timestamp: 500, note: 64, velocity: 0, type: 'note-off' },
    { timestamp: 600, note: 67, velocity: 0, type: 'note-off' },
  ];
  const index = buildTimeIndex(events);

  it('returns empty map before any events', () => {
    const active = getEventsAtTimestamp(index, 50);
    expect(active.size).toBe(0);
  });

  it('returns one note after first note-on', () => {
    const active = getEventsAtTimestamp(index, 150);
    expect(active.size).toBe(1);
    expect(active.has(60)).toBe(true);
  });

  it('returns two notes when both are active', () => {
    const active = getEventsAtTimestamp(index, 250);
    expect(active.size).toBe(2);
    expect(active.has(60)).toBe(true);
    expect(active.has(64)).toBe(true);
  });

  it('removes note after note-off', () => {
    const active = getEventsAtTimestamp(index, 350);
    expect(active.size).toBe(1);
    expect(active.has(60)).toBe(false);
    expect(active.has(64)).toBe(true);
  });

  it('shows correct state at note-on boundary', () => {
    const active = getEventsAtTimestamp(index, 400);
    expect(active.size).toBe(2);
    expect(active.has(64)).toBe(true);
    expect(active.has(67)).toBe(true);
  });

  it('returns empty map after all notes released', () => {
    const active = getEventsAtTimestamp(index, 700);
    expect(active.size).toBe(0);
  });

  it('handles empty index', () => {
    const active = getEventsAtTimestamp([], 100);
    expect(active.size).toBe(0);
  });

  it('includes events at exact timestamp', () => {
    const active = getEventsAtTimestamp(index, 100);
    expect(active.size).toBe(1);
    expect(active.has(60)).toBe(true);
  });
});
