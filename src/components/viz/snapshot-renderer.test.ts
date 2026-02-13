import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderSnapshotOverlay } from './snapshot-renderer';
import type { InstantSnapshot } from '@/features/analysis/analysis-types';

function createMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 7 })),
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'top' as CanvasTextBaseline,
  } as unknown as CanvasRenderingContext2D;
}

function createSnapshot(overrides?: Partial<InstantSnapshot>): InstantSnapshot {
  return {
    id: 'test-snap-1',
    key: { root: 'C', mode: 'major', confidence: 0.9 },
    chordsUsed: [
      {
        root: 'C',
        quality: 'Major',
        notes: [{ name: 'C', octave: 4, midiNumber: 60, velocity: 100, timestamp: 0 }],
        timestamp: 0,
      },
    ],
    timingAccuracy: 85,
    averageTempo: 120,
    keyInsight: 'Solid session in C major at 120 BPM — keep building on that foundation',
    insightCategory: 'GENERAL',
    insights: [
      {
        category: 'GENERAL',
        text: 'Solid session in C major at 120 BPM — keep building on that foundation',
        confidence: 0.7,
      },
    ],
    chordFrequencies: [{ label: 'C', count: 3 }],
    isLimitedData: false,
    genrePatterns: [{ genre: 'Pop', confidence: 0.6, matchedPatterns: ['chord-progression'] }],
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('renderSnapshotOverlay', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it('does nothing when alpha is 0', () => {
    renderSnapshotOverlay(ctx, 800, 600, createSnapshot(), 0);
    expect(ctx.save).not.toHaveBeenCalled();
  });

  it('renders with full alpha', () => {
    renderSnapshotOverlay(ctx, 800, 600, createSnapshot(), 1);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('sets globalAlpha to transition value', () => {
    renderSnapshotOverlay(ctx, 800, 600, createSnapshot(), 0.5);
    expect(ctx.globalAlpha).toBe(0.5);
  });

  it('renders key label when key is present', () => {
    renderSnapshotOverlay(ctx, 800, 600, createSnapshot(), 1);
    const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const hasKeyLabel = fillTextCalls.some(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('C major')
    );
    expect(hasKeyLabel).toBe(true);
  });

  it('renders tempo and accuracy stats', () => {
    renderSnapshotOverlay(ctx, 800, 600, createSnapshot(), 1);
    const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const hasTempoLabel = fillTextCalls.some(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('120 BPM')
    );
    const hasAccuracy = fillTextCalls.some(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('85%')
    );
    expect(hasTempoLabel).toBe(true);
    expect(hasAccuracy).toBe(true);
  });

  it('renders genre detection info', () => {
    renderSnapshotOverlay(ctx, 800, 600, createSnapshot(), 1);
    const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const hasGenre = fillTextCalls.some(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('Pop')
    );
    expect(hasGenre).toBe(true);
  });

  it('handles snapshot with null key and tempo', () => {
    const snap = createSnapshot({ key: null, averageTempo: null, genrePatterns: [] });
    renderSnapshotOverlay(ctx, 800, 600, snap, 1);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('renders insight text', () => {
    renderSnapshotOverlay(ctx, 800, 600, createSnapshot(), 1);
    const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const hasInsight = fillTextCalls.some(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('foundation')
    );
    expect(hasInsight).toBe(true);
  });

  it('wraps long insight text across multiple fillText calls', () => {
    const longInsight =
      'This is a very long insight text that should wrap across multiple lines when rendered on the canvas overlay card';
    const snap = createSnapshot({ keyInsight: longInsight });
    renderSnapshotOverlay(ctx, 400, 400, snap, 1);
    const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    // With proportional measureText (~7px/char) and narrow canvas, long text wraps
    const insightFragments = fillTextCalls.filter(
      (call: unknown[]) =>
        typeof call[0] === 'string' &&
        longInsight.split(' ').some((word) => (call[0] as string).includes(word))
    );
    // Should produce multiple fillText calls from wrapping
    expect(insightFragments.length).toBeGreaterThanOrEqual(2);
  });
});
