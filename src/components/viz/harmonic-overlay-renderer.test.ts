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
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
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
    // Key label + chord quality label rendered, but NOT roman numeral or chord name
    expect(ctx.fillText).toHaveBeenCalledWith('Key: C Major', 14, 12);
    expect(ctx.fillText).toHaveBeenCalledWith('Maj', W / 2, 56);
    expect(ctx.fillText).not.toHaveBeenCalledWith('Fmaj', expect.any(Number), expect.any(Number));
    expect(ctx.fillText).not.toHaveBeenCalledWith('IV', expect.any(Number), expect.any(Number));
  });

  it('renders chord-tone as circle (arc) for notes with chord context', () => {
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
    // Chord tone uses arc (circle)
    expect(ctx.arc).toHaveBeenCalledTimes(1);
    expect(ctx.fill).toHaveBeenCalled();
  });

  it('renders passing-tone as diamond (moveTo/lineTo) for notes with chord context', () => {
    const analyses: NoteAnalysis[] = [
      {
        note: { name: 'D', octave: 4, midiNumber: 62, velocity: 100, timestamp: 1000 },
        isChordTone: false,
        chordContext: {
          root: 'C',
          quality: 'Major',
          notes: [{ name: 'C', octave: 4, midiNumber: 60, velocity: 100, timestamp: 1000 }],
          timestamp: 1000,
        },
      },
    ];
    renderHarmonicOverlay(ctx, W, H, null, null, analyses);
    // Passing tone uses diamond (moveTo + lineTo path)
    expect(ctx.arc).not.toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalledTimes(3);
    expect(ctx.closePath).toHaveBeenCalled();
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
    expect(ctx.arc).not.toHaveBeenCalled();
    expect(ctx.moveTo).not.toHaveBeenCalled();
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
    // Should render exactly 16 markers (circles via arc)
    expect(ctx.arc).toHaveBeenCalledTimes(16);
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
    const origFill = ctx.fill;
    (ctx as unknown as { fill: typeof origFill }).fill = vi.fn(() => {
      fillStyles.push(ctx.fillStyle as string);
    });

    renderHarmonicOverlay(ctx, W, H, null, null, analyses);

    expect(fillStyles).toHaveLength(2);
    // Chord tone should have higher opacity (0.8) than passing tone (0.45)
    expect(fillStyles[0]).toContain('0.8');
    expect(fillStyles[1]).toContain('0.45');
  });

  // Story 23.3: Chord quality text label
  it('renders chord quality text label when chordQuality is provided', () => {
    renderHarmonicOverlay(ctx, W, H, null, null, [], null, 'Major');
    expect(ctx.fillText).toHaveBeenCalledWith('Maj', W / 2, 56);
  });

  it('does not render chord quality label for null quality', () => {
    renderHarmonicOverlay(ctx, W, H, null, null, [], null, null);
    expect(ctx.fillText).not.toHaveBeenCalled();
  });
});
