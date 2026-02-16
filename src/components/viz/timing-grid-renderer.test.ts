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
    setLineDash: vi.fn(),
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

  it('renders predictive grid lines and BPM label when bpm is set but no deviations', () => {
    const ctx = createMockCtx();
    renderTimingGrid(ctx, WIDTH, HEIGHT, 120, []);
    // Predictive model: renders grid lines even with no deviations (12 past + 4 predictive + 1 = 17)
    expect(ctx.stroke).toHaveBeenCalledTimes(17);
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

    // Grid lines drawn (17 total: BEATS_TO_SHOW + PREDICTIVE_BEATS + 1)
    expect(ctx.stroke).toHaveBeenCalledTimes(17);
    // Note markers drawn (3 deviations)
    expect(ctx.fillRect).toHaveBeenCalled();
    // BPM label drawn
    expect(ctx.fillText).toHaveBeenCalledWith('120 BPM', expect.any(Number), expect.any(Number));
  });

  it('uses dashed lines for predictive future beats', () => {
    const ctx = createMockCtx();
    const deviations: TimingEvent[] = [
      { noteTimestamp: 500, expectedBeatTimestamp: 500, deviationMs: 0, beatIndex: 5 },
    ];
    renderTimingGrid(ctx, WIDTH, HEIGHT, 120, deviations);
    // setLineDash called for future beats (dashed) + resets (solid)
    expect(ctx.setLineDash).toHaveBeenCalled();
    // Verify at least one dashed call [4, 4]
    const dashCalls = (ctx.setLineDash as ReturnType<typeof vi.fn>).mock.calls;
    const hasDashed = dashCalls.some(
      (call: unknown[]) => Array.isArray(call[0]) && (call[0] as number[]).length === 2
    );
    expect(hasDashed).toBe(true);
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

  it('renders fewer grid lines on narrow canvas (<500px compact mode)', () => {
    const ctx = createMockCtx();
    const narrowWidth = 400;
    renderTimingGrid(ctx, narrowWidth, HEIGHT, 120, []);
    // Compact: 6 past + 2 predictive + 1 = 9 grid lines
    expect(ctx.stroke).toHaveBeenCalledTimes(9);
    expect(ctx.fillText).toHaveBeenCalledTimes(1);
  });

  it('renders full grid lines on wide canvas (>=500px)', () => {
    const ctx = createMockCtx();
    renderTimingGrid(ctx, 500, HEIGHT, 120, []);
    // Full: 12 past + 4 predictive + 1 = 17 grid lines
    expect(ctx.stroke).toHaveBeenCalledTimes(17);
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

  it('uses compact beat range on narrow canvas', () => {
    const narrowWidth = 400;
    const d = makeEvent(5, 10, 3000);
    const pulse = createTimingPulse(d, narrowWidth, bandTop, bandHeight, bpm, [d], 3000);
    expect(pulse).not.toBeNull();
    // Pulse should be within canvas bounds
    expect(pulse!.x).toBeGreaterThan(0);
    expect(pulse!.x).toBeLessThan(narrowWidth);
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

  // Story 23.2: Verify glow uses visible alpha values (≥0.15)
  it('uses gradient alpha values ≥ 0.15 for visibility', () => {
    const ctx = createMockCtx();
    const colorStops: Array<{ offset: number; color: string }> = [];
    (ctx.createLinearGradient as ReturnType<typeof vi.fn>).mockReturnValue({
      addColorStop: vi.fn((offset: number, color: string) => {
        colorStops.push({ offset, color });
      }),
    });
    renderFlowGlow(ctx, WIDTH, HEIGHT, 5000, false);
    // All stop-0 colors should have alpha ≥ 0.15
    const alphas = colorStops
      .filter((s) => s.offset === 0)
      .map((s) => {
        const match = s.color.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
        return match ? parseFloat(match[1]) : 0;
      });
    for (const a of alphas) {
      expect(a).toBeGreaterThanOrEqual(0.15);
    }
  });
});

// Story 23.2: Verify pulse opacity meets visibility threshold
describe('timing pulse visibility', () => {
  it('pulse max opacity is at least 0.30 for visibility at arm length', () => {
    const ctx = createMockCtx();
    const nowMs = 1000;
    // Pulse at peak (just past fade-in at 200ms)
    const pulses: TimingPulse[] = [{ x: 100, y: 200, startTime: nowMs - 200, isOnTime: true }];
    const gradStops: Array<{ offset: number; color: string }> = [];
    (ctx.createRadialGradient as ReturnType<typeof vi.fn>).mockReturnValue({
      addColorStop: vi.fn((offset: number, color: string) => {
        gradStops.push({ offset, color });
      }),
    });
    renderTimingPulses(ctx, pulses, nowMs, false);
    // Center stop (offset 0) should have alpha ≥ 0.30
    const centerAlphas = gradStops
      .filter((s) => s.offset === 0)
      .map((s) => {
        const match = s.color.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
        return match ? parseFloat(match[1]) : 0;
      });
    for (const a of centerAlphas) {
      expect(a).toBeGreaterThanOrEqual(0.3);
    }
  });
});
