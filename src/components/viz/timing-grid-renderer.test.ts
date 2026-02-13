import { describe, it, expect, vi } from 'vitest';
import {
  renderTimingGrid,
  renderTimingPulses,
  renderFlowGlow,
  createTimingPulse,
} from './timing-grid-renderer';
import type { TimingPulse } from './timing-grid-renderer';
import type { TimingEvent } from '@/features/analysis/analysis-types';

function createMockCtx() {
  return {
    fillStyle: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  } as unknown as CanvasRenderingContext2D;
}

const WIDTH = 800;
const HEIGHT = 600;

function makeEvent(beatIndex: number, deviationMs: number, noteTs: number): TimingEvent {
  return {
    noteTimestamp: noteTs,
    expectedBeatTimestamp: noteTs - deviationMs,
    deviationMs,
    beatIndex,
  };
}

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

describe('createTimingPulse', () => {
  const bandTop = HEIGHT * 0.8;
  const bandHeight = HEIGHT * 0.15;
  const bpm = 120;

  it('returns null when bpm is 0', () => {
    const d = makeEvent(0, 10, 1000);
    expect(createTimingPulse(d, WIDTH, bandTop, bandHeight, 0, [d], 1000)).toBeNull();
  });

  it('returns null with empty deviations', () => {
    const d = makeEvent(0, 10, 1000);
    expect(createTimingPulse(d, WIDTH, bandTop, bandHeight, bpm, [], 1000)).toBeNull();
  });

  it('creates on-time pulse for notes within ±50ms', () => {
    const d = makeEvent(5, 30, 3000);
    const pulse = createTimingPulse(d, WIDTH, bandTop, bandHeight, bpm, [d], 3000);
    expect(pulse).not.toBeNull();
    expect(pulse!.isOnTime).toBe(true);
  });

  it('creates off-time pulse for notes beyond ±50ms', () => {
    const d = makeEvent(5, 80, 3000);
    const pulse = createTimingPulse(d, WIDTH, bandTop, bandHeight, bpm, [d], 3000);
    expect(pulse).not.toBeNull();
    expect(pulse!.isOnTime).toBe(false);
  });

  it('treats ±50ms boundary as on-time', () => {
    const d = makeEvent(5, 50, 3000);
    const pulse = createTimingPulse(d, WIDTH, bandTop, bandHeight, bpm, [d], 3000);
    expect(pulse).not.toBeNull();
    expect(pulse!.isOnTime).toBe(true);
  });

  it('treats -50ms boundary as on-time', () => {
    const d = makeEvent(5, -50, 3000);
    const pulse = createTimingPulse(d, WIDTH, bandTop, bandHeight, bpm, [d], 3000);
    expect(pulse).not.toBeNull();
    expect(pulse!.isOnTime).toBe(true);
  });
});

describe('renderTimingPulses', () => {
  it('returns empty array when all pulses have expired', () => {
    const ctx = createMockCtx();
    const pulses: TimingPulse[] = [{ x: 100, y: 200, startTime: 0, isOnTime: true }];
    const alive = renderTimingPulses(ctx, pulses, 1000, false);
    expect(alive).toHaveLength(0);
  });

  it('keeps alive pulses within lifespan (600ms total)', () => {
    const ctx = createMockCtx();
    const nowMs = 1000;
    const pulses: TimingPulse[] = [{ x: 100, y: 200, startTime: nowMs - 100, isOnTime: true }];
    const alive = renderTimingPulses(ctx, pulses, nowMs, false);
    expect(alive).toHaveLength(1);
  });

  it('renders radial gradient for animated pulses', () => {
    const ctx = createMockCtx();
    const nowMs = 1000;
    const pulses: TimingPulse[] = [{ x: 100, y: 200, startTime: nowMs - 100, isOnTime: true }];
    renderTimingPulses(ctx, pulses, nowMs, false);
    expect(ctx.createRadialGradient).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('renders static dot for reduced motion', () => {
    const ctx = createMockCtx();
    const nowMs = 1000;
    const pulses: TimingPulse[] = [{ x: 100, y: 200, startTime: nowMs - 100, isOnTime: false }];
    renderTimingPulses(ctx, pulses, nowMs, true);
    expect(ctx.createRadialGradient).not.toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
  });
});

describe('renderFlowGlow', () => {
  it('renders 4 edge gradients', () => {
    const ctx = createMockCtx();
    renderFlowGlow(ctx, WIDTH, HEIGHT, 5000, false);
    expect(ctx.createLinearGradient).toHaveBeenCalledTimes(4);
    expect(ctx.fillRect).toHaveBeenCalledTimes(4);
  });

  it('renders with static alpha when reduced motion is on', () => {
    const ctx = createMockCtx();
    renderFlowGlow(ctx, WIDTH, HEIGHT, 5000, true);
    expect(ctx.createLinearGradient).toHaveBeenCalledTimes(4);
    expect(ctx.fillRect).toHaveBeenCalledTimes(4);
  });
});
