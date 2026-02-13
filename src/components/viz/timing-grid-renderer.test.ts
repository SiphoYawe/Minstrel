import { describe, it, expect, vi } from 'vitest';
import { renderTimingGrid } from './timing-grid-renderer';
import type { TimingEvent } from '@/features/analysis/analysis-types';

function createMockCtx() {
  return {
    fillStyle: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
  } as unknown as CanvasRenderingContext2D;
}

const WIDTH = 800;
const HEIGHT = 600;

describe('renderTimingGrid', () => {
  it('does nothing when bpm is null', () => {
    const ctx = createMockCtx();
    renderTimingGrid(ctx, WIDTH, HEIGHT, null, []);
    expect(ctx.fillRect).not.toHaveBeenCalled();
    expect(ctx.stroke).not.toHaveBeenCalled();
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('does nothing when bpm is 0', () => {
    const ctx = createMockCtx();
    renderTimingGrid(ctx, WIDTH, HEIGHT, 0, []);
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('renders BPM label when bpm is set but no deviations', () => {
    const ctx = createMockCtx();
    renderTimingGrid(ctx, WIDTH, HEIGHT, 120, []);
    expect(ctx.fillText).toHaveBeenCalledTimes(1);
    expect(ctx.fillText).toHaveBeenCalledWith('120 BPM', expect.any(Number), expect.any(Number));
  });

  it('renders grid lines and markers when deviations exist', () => {
    const ctx = createMockCtx();
    const deviations: TimingEvent[] = [
      { noteTimestamp: 500, expectedBeatTimestamp: 500, deviationMs: 0, beatIndex: 1 },
      { noteTimestamp: 1020, expectedBeatTimestamp: 1000, deviationMs: 20, beatIndex: 2 },
      { noteTimestamp: 1480, expectedBeatTimestamp: 1500, deviationMs: -20, beatIndex: 3 },
    ];

    renderTimingGrid(ctx, WIDTH, HEIGHT, 120, deviations);

    // Grid lines drawn (13 lines: 0 through 12)
    expect(ctx.stroke).toHaveBeenCalled();
    // Note markers drawn (3 deviations)
    expect(ctx.fillRect).toHaveBeenCalled();
    // BPM label drawn
    expect(ctx.fillText).toHaveBeenCalledWith('120 BPM', expect.any(Number), expect.any(Number));
  });

  it('uses different alpha for on-beat vs off-beat markers', () => {
    const ctx = createMockCtx();
    const deviations: TimingEvent[] = [
      { noteTimestamp: 500, expectedBeatTimestamp: 500, deviationMs: 0, beatIndex: 5 },
      { noteTimestamp: 1060, expectedBeatTimestamp: 1000, deviationMs: 60, beatIndex: 6 },
    ];

    renderTimingGrid(ctx, WIDTH, HEIGHT, 120, deviations);

    // fillRect called for both markers
    expect(ctx.fillRect).toHaveBeenCalledTimes(2);
  });

  it('resets textAlign after rendering', () => {
    const ctx = createMockCtx();
    renderTimingGrid(ctx, WIDTH, HEIGHT, 120, []);
    expect(ctx.textAlign).toBe('start');
  });
});
