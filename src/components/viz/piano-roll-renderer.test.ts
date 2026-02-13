import { describe, it, expect, vi } from 'vitest';
import { velocityToAlpha, velocityToSize, noteNumberToY } from './canvas-utils';
import { createFadingNote, renderNotes } from './piano-roll-renderer';
import type { FadingNote } from './piano-roll-renderer';
import type { MidiEvent } from '@/features/midi/midi-types';

describe('canvas-utils', () => {
  describe('velocityToAlpha', () => {
    it('returns 0.3 for velocity 0', () => {
      expect(velocityToAlpha(0)).toBeCloseTo(0.3);
    });

    it('returns 1.0 for velocity 127', () => {
      expect(velocityToAlpha(127)).toBeCloseTo(1.0);
    });

    it('returns mid-range for velocity 64', () => {
      const alpha = velocityToAlpha(64);
      expect(alpha).toBeGreaterThan(0.3);
      expect(alpha).toBeLessThan(1.0);
    });

    it('values are always in range [0.3, 1.0]', () => {
      for (let v = 0; v <= 127; v++) {
        const a = velocityToAlpha(v);
        expect(a).toBeGreaterThanOrEqual(0.3);
        expect(a).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('velocityToSize', () => {
    it('returns 0.6 for velocity 0', () => {
      expect(velocityToSize(0)).toBeCloseTo(0.6);
    });

    it('returns 1.4 for velocity 127', () => {
      expect(velocityToSize(127)).toBeCloseTo(1.4);
    });

    it('values are always in range [0.6, 1.4]', () => {
      for (let v = 0; v <= 127; v++) {
        const s = velocityToSize(v);
        expect(s).toBeGreaterThanOrEqual(0.6);
        expect(s).toBeLessThanOrEqual(1.4);
      }
    });
  });

  describe('noteNumberToY', () => {
    const canvasHeight = 600;

    it('maps note 0 to bottom of canvas', () => {
      const y = noteNumberToY(0, canvasHeight);
      expect(y).toBe(canvasHeight);
    });

    it('maps note 127 to top of canvas', () => {
      const y = noteNumberToY(127, canvasHeight);
      expect(y).toBeCloseTo(0, 0);
    });

    it('maps middle C (60) to roughly middle', () => {
      const y = noteNumberToY(60, canvasHeight);
      expect(y).toBeGreaterThan(canvasHeight * 0.4);
      expect(y).toBeLessThan(canvasHeight * 0.6);
    });

    it('higher notes map to lower Y values', () => {
      expect(noteNumberToY(80, canvasHeight)).toBeLessThan(noteNumberToY(40, canvasHeight));
    });
  });
});

describe('createFadingNote', () => {
  const event: MidiEvent = {
    type: 'note-off',
    note: 60,
    noteName: 'C4',
    velocity: 100,
    channel: 0,
    timestamp: 500,
    source: 'midi',
  };

  it('creates a fading note with correct properties', () => {
    const fn = createFadingNote(event, 600, 1000);
    expect(fn.note).toBe(60);
    expect(fn.fadeStart).toBe(1000);
    expect(fn.alpha).toBeGreaterThan(0);
    expect(fn.size).toBeGreaterThan(0);
  });

  it('uses canvas height for Y calculation', () => {
    const fn = createFadingNote(event, 600, 1000);
    expect(fn.y).toBeGreaterThan(0);
    expect(fn.y).toBeLessThan(600);
  });
});

function createMockCtx(): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    font: '',
    textBaseline: 'alphabetic',
    textAlign: 'start',
  } as unknown as CanvasRenderingContext2D;
}

describe('renderNotes', () => {
  it('clears canvas and renders active notes', () => {
    const ctx = createMockCtx();
    const activeNotes: Record<number, MidiEvent> = {
      60: {
        type: 'note-on',
        note: 60,
        noteName: 'C4',
        velocity: 100,
        channel: 0,
        timestamp: 1000,
        source: 'midi',
      },
    };

    const result = renderNotes(ctx, activeNotes, [], 800, 600, 1000);

    // fillRect called: once for clearCanvas, once for the active note
    expect(ctx.fillRect).toHaveBeenCalledTimes(2);
    // fillText called for note name label
    expect(ctx.fillText).toHaveBeenCalledTimes(1);
    expect(ctx.fillText).toHaveBeenCalledWith('C4', expect.any(Number), expect.any(Number));
    expect(result).toEqual([]);
  });

  it('renders fading notes that have not expired', () => {
    const ctx = createMockCtx();
    const fadingNote: FadingNote = {
      note: 60,
      y: 300,
      alpha: 0.8,
      size: 1.0,
      fadeStart: 900,
    };

    // now=1000, fadeStart=900 → elapsed=100ms, still within 200ms fade duration
    const result = renderNotes(ctx, {}, [fadingNote], 800, 600, 1000);

    // fillRect: clearCanvas + fading note
    expect(ctx.fillRect).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
  });

  it('removes expired fading notes', () => {
    const ctx = createMockCtx();
    const expired: FadingNote = {
      note: 60,
      y: 300,
      alpha: 0.8,
      size: 1.0,
      fadeStart: 700,
    };

    // now=1000, fadeStart=700 → elapsed=300ms, past 200ms fade duration
    const result = renderNotes(ctx, {}, [expired], 800, 600, 1000);

    // Only clearCanvas, no fading note rendered
    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(0);
  });

  it('renders multiple active notes with different velocities', () => {
    const ctx = createMockCtx();
    const activeNotes: Record<number, MidiEvent> = {
      48: {
        type: 'note-on',
        note: 48,
        noteName: 'C3',
        velocity: 40,
        channel: 0,
        timestamp: 1000,
        source: 'midi',
      },
      72: {
        type: 'note-on',
        note: 72,
        noteName: 'C5',
        velocity: 120,
        channel: 0,
        timestamp: 1000,
        source: 'midi',
      },
    };

    renderNotes(ctx, activeNotes, [], 800, 600, 1000);

    // clearCanvas + 2 active notes
    expect(ctx.fillRect).toHaveBeenCalledTimes(3);
    // fillText called for each note name label
    expect(ctx.fillText).toHaveBeenCalledTimes(2);
  });

  it('renders chord label when provided', () => {
    const ctx = createMockCtx();
    renderNotes(ctx, {}, [], 800, 600, 1000, 'Cmaj');
    // fillText called once for chord label
    expect(ctx.fillText).toHaveBeenCalledTimes(1);
    expect(ctx.fillText).toHaveBeenCalledWith('Cmaj', 400, 24);
  });

  it('does not render chord label when null', () => {
    const ctx = createMockCtx();
    renderNotes(ctx, {}, [], 800, 600, 1000, null);
    expect(ctx.fillText).not.toHaveBeenCalled();
  });
});
