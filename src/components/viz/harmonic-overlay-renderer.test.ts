import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHarmonicOverlay } from './harmonic-overlay-renderer';
import type { KeyCenter, NoteAnalysis } from '@/features/analysis/analysis-types';

function createMockCtx(): CanvasRenderingContext2D {
  return {
    font: '',
    fillStyle: '',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    fillText: vi.fn(),
    fillRect: vi.fn(),
    measureText: vi.fn(() => ({ width: 50 })),
  } as unknown as CanvasRenderingContext2D;
}

describe('renderHarmonicOverlay', () => {
  let ctx: CanvasRenderingContext2D;
  const W = 800;
  const H = 600;

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it('renders nothing with all null inputs', () => {
    renderHarmonicOverlay(ctx, W, H, null, null, []);
    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('renders key label with background when key is provided', () => {
    const key: KeyCenter = { root: 'C', mode: 'major', confidence: 0.9 };
    renderHarmonicOverlay(ctx, W, H, key, null, []);
    expect(ctx.fillText).toHaveBeenCalledWith('Key: C Major', 14, 12);
    // Background rect drawn before text
    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
    expect(ctx.measureText).toHaveBeenCalledWith('Key: C Major');
  });

  it('renders minor key label correctly', () => {
    const key: KeyCenter = { root: 'A', mode: 'minor', confidence: 0.85 };
    renderHarmonicOverlay(ctx, W, H, key, null, []);
    expect(ctx.fillText).toHaveBeenCalledWith('Key: A Minor', 14, 12);
  });

  it('does not render chord label or roman numeral on canvas (handled by ChordHud)', () => {
    const key: KeyCenter = { root: 'C', mode: 'major', confidence: 0.9 };
    const fn = { romanNumeral: 'IV', quality: 'Major' as const, isSecondary: false };
    renderHarmonicOverlay(ctx, W, H, key, fn, [], 'Fmaj', 'Major');
    // Only key label text rendered, not chord label or numeral
    expect(ctx.fillText).toHaveBeenCalledTimes(1);
    expect(ctx.fillText).toHaveBeenCalledWith('Key: C Major', 14, 12);
  });

  it('renders chord-tone markers for notes with chord context', () => {
    const analyses: NoteAnalysis[] = [
      {
        note: { name: 'C', octave: 4, midiNumber: 60, velocity: 100, timestamp: 1000 },
        isChordTone: true,
        chordContext: {
          root: 'C',
          quality: 'Major',
          notes: [{ name: 'C', octave: 4, midiNumber: 60, velocity: 100, timestamp: 1000 }],
          timestamp: 1000,
        },
      },
    ];
    renderHarmonicOverlay(ctx, W, H, null, null, analyses);
    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
  });

  it('skips notes without chord context', () => {
    const analyses: NoteAnalysis[] = [
      {
        note: { name: 'D', octave: 4, midiNumber: 62, velocity: 100, timestamp: 1000 },
        isChordTone: false,
        chordContext: null,
      },
    ];
    renderHarmonicOverlay(ctx, W, H, null, null, analyses);
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('limits note analyses to last 16 entries', () => {
    const analyses: NoteAnalysis[] = [];
    for (let i = 0; i < 20; i++) {
      analyses.push({
        note: { name: 'C', octave: 4, midiNumber: 60 + i, velocity: 100, timestamp: 1000 + i },
        isChordTone: true,
        chordContext: {
          root: 'C',
          quality: 'Major',
          notes: [{ name: 'C', octave: 4, midiNumber: 60, velocity: 100, timestamp: 1000 }],
          timestamp: 1000,
        },
      });
    }
    renderHarmonicOverlay(ctx, W, H, null, null, analyses);
    // Should render exactly 16 markers (sliced to last 16)
    expect(ctx.fillRect).toHaveBeenCalledTimes(16);
  });

  it('uses different fill styles for chord tones vs passing tones', () => {
    const chordCtx = {
      root: 'C' as const,
      quality: 'Major' as const,
      notes: [{ name: 'C', octave: 4, midiNumber: 60, velocity: 100, timestamp: 1000 }],
      timestamp: 1000,
    };
    const analyses: NoteAnalysis[] = [
      {
        note: { name: 'C', octave: 4, midiNumber: 60, velocity: 100, timestamp: 1000 },
        isChordTone: true,
        chordContext: chordCtx,
      },
      {
        note: { name: 'D', octave: 4, midiNumber: 62, velocity: 100, timestamp: 1001 },
        isChordTone: false,
        chordContext: chordCtx,
      },
    ];
    const fillStyles: string[] = [];
    (ctx as { fillRect: CanvasRenderingContext2D['fillRect'] }).fillRect = vi.fn(() => {
      fillStyles.push(ctx.fillStyle as string);
    });

    renderHarmonicOverlay(ctx, W, H, null, null, analyses);

    expect(fillStyles).toHaveLength(2);
    // Chord tone should have higher opacity than passing tone
    expect(fillStyles[0]).toContain('0.8');
    expect(fillStyles[1]).toContain('0.3');
  });
});
