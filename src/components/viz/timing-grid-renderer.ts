import type { TimingEvent } from '@/features/analysis/analysis-types';
import { ON_BEAT_TOLERANCE_MS } from '@/lib/constants';
import { VIZ_TIMING_RGB, vizRgba } from '@/lib/viz-colors';

const GRID_LINE_ALPHA = 0.15;
const PREDICTIVE_GRID_ALPHA = 0.1;
const GRID_LINE_WIDTH = 1;
const NOTE_MARKER_SIZE = 6;
const ON_BEAT_ALPHA = 0.9;
const OFF_BEAT_ALPHA = 0.5;
const BPM_LABEL_FONT = '12px "JetBrains Mono", monospace';
const BPM_LABEL_COLOR = vizRgba(VIZ_TIMING_RGB, 0.6);
const BEATS_TO_SHOW_FULL = 12;
const BEATS_TO_SHOW_COMPACT = 6;
const PREDICTIVE_BEATS_FULL = 4;
const PREDICTIVE_BEATS_COMPACT = 2;
/** Canvas width threshold for compact timing layout. */
const COMPACT_WIDTH_PX = 500;
const MAX_DEVIATION_PX = 40;

// --- Timing pulse constants ---
/** Threshold for "on-time" timing pulse (AC uses ±50ms). */
const PULSE_ON_TIME_TOLERANCE_MS = 50;
/** Pulse fade-in duration (ms). */
const PULSE_FADE_IN_MS = 200;
/** Pulse fade-out duration (ms). */
const PULSE_FADE_OUT_MS = 400;
/** Total pulse lifespan. */
const PULSE_TOTAL_MS = PULSE_FADE_IN_MS + PULSE_FADE_OUT_MS;
/** On-time pulse color (green). */
const PULSE_ON_TIME_COLOR = { r: 74, g: 222, b: 128 }; // green-400 equivalent
/** Off-time pulse color (amber). */
const PULSE_OFF_TIME_COLOR = { r: 251, g: 191, b: 36 }; // amber-400 equivalent
/** Max pulse opacity — clearly visible at arm's length (Story 23.2). */
const PULSE_MAX_OPACITY = 0.35;
/** Pulse radius (px). */
const PULSE_RADIUS = 24;

// --- Flow glow constants ---
/** Glow edge thickness (px). */
const FLOW_GLOW_SIZE = 60;
/** Glow base alpha range — visible at arm's length (Story 23.2). */
const FLOW_GLOW_ALPHA_MIN = 0.15;
const FLOW_GLOW_ALPHA_MAX = 0.25;
/** Glow cycle period (ms). */
const FLOW_GLOW_PERIOD_MS = 2000;
/** Glow color — accent green. */
const FLOW_GLOW_COLOR = { r: 74, g: 222, b: 128 };

/** Active timing pulse. Created when a note is played. */
export interface TimingPulse {
  x: number;
  y: number;
  startTime: number;
  isOnTime: boolean;
}

/**
 * Creates a timing pulse for a newly played note.
 * Called from the visualization canvas when a new timing event arrives.
 */
export function createTimingPulse(
  d: TimingEvent,
  canvasWidth: number,
  bandTop: number,
  bandHeight: number,
  bpm: number,
  deviations: TimingEvent[],
  nowMs: number
): TimingPulse | null {
  if (bpm <= 0) return null;

  const beatIntervalMs = 60000 / bpm;
  const recent = deviations.slice(-16);
  if (recent.length === 0) return null;

  const isCompact = canvasWidth < COMPACT_WIDTH_PX;
  const beatsToShow = isCompact ? BEATS_TO_SHOW_COMPACT : BEATS_TO_SHOW_FULL;
  const lastBeat = recent[recent.length - 1].beatIndex;
  const firstBeat = lastBeat - beatsToShow + 1;
  const beatSpacingPx = canvasWidth / (beatsToShow + 1);
  const bandCenterY = bandTop + bandHeight / 2;

  const beatOffset = d.beatIndex - firstBeat;
  if (beatOffset < 0 || beatOffset > beatsToShow) return null;

  const baseX = (beatOffset + 1) * beatSpacingPx;
  const deviationRatio = Math.max(-1, Math.min(1, d.deviationMs / (beatIntervalMs / 2)));
  const x = baseX + deviationRatio * MAX_DEVIATION_PX;

  return {
    x,
    y: bandCenterY,
    startTime: nowMs,
    isOnTime: Math.abs(d.deviationMs) <= PULSE_ON_TIME_TOLERANCE_MS,
  };
}

/**
 * Renders timing pulses. Returns the filtered array with expired pulses removed.
 */
export function renderTimingPulses(
  ctx: CanvasRenderingContext2D,
  pulses: TimingPulse[],
  nowMs: number,
  reducedMotion: boolean
): TimingPulse[] {
  const alive: TimingPulse[] = [];

  for (const pulse of pulses) {
    const elapsed = nowMs - pulse.startTime;
    if (elapsed > PULSE_TOTAL_MS) continue;

    alive.push(pulse);

    const color = pulse.isOnTime ? PULSE_ON_TIME_COLOR : PULSE_OFF_TIME_COLOR;

    if (reducedMotion) {
      // Static color shift — no animation, just a subtle dot
      ctx.save();
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${PULSE_MAX_OPACITY})`;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, PULSE_RADIUS * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Animated pulse: fade-in then fade-out
      let alpha: number;
      if (elapsed < PULSE_FADE_IN_MS) {
        alpha = (elapsed / PULSE_FADE_IN_MS) * PULSE_MAX_OPACITY;
      } else {
        const fadeElapsed = elapsed - PULSE_FADE_IN_MS;
        alpha = (1 - fadeElapsed / PULSE_FADE_OUT_MS) * PULSE_MAX_OPACITY;
      }

      ctx.save();
      const grad = ctx.createRadialGradient(pulse.x, pulse.y, 0, pulse.x, pulse.y, PULSE_RADIUS);
      grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
      grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, PULSE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  return alive;
}

/**
 * Renders the flow-state ambient glow around canvas edges.
 * Only called when flow state is active.
 */
export function renderFlowGlow(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  nowMs: number,
  reducedMotion: boolean
): void {
  const { r, g, b } = FLOW_GLOW_COLOR;

  // Calculate pulsing alpha
  let alpha: number;
  if (reducedMotion) {
    // Static glow — midpoint of range
    alpha = (FLOW_GLOW_ALPHA_MIN + FLOW_GLOW_ALPHA_MAX) / 2;
  } else {
    // Sinusoidal pulse between min and max over 2-second cycle
    const t = (nowMs % FLOW_GLOW_PERIOD_MS) / FLOW_GLOW_PERIOD_MS;
    const sine = (Math.sin(t * Math.PI * 2) + 1) / 2; // 0→1
    alpha = FLOW_GLOW_ALPHA_MIN + sine * (FLOW_GLOW_ALPHA_MAX - FLOW_GLOW_ALPHA_MIN);
  }

  ctx.save();

  // Left edge
  const leftGrad = ctx.createLinearGradient(0, 0, FLOW_GLOW_SIZE, 0);
  leftGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
  leftGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 0, FLOW_GLOW_SIZE, canvasHeight);

  // Right edge
  const rightGrad = ctx.createLinearGradient(canvasWidth, 0, canvasWidth - FLOW_GLOW_SIZE, 0);
  rightGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
  rightGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = rightGrad;
  ctx.fillRect(canvasWidth - FLOW_GLOW_SIZE, 0, FLOW_GLOW_SIZE, canvasHeight);

  // Top edge
  const topGrad = ctx.createLinearGradient(0, 0, 0, FLOW_GLOW_SIZE);
  topGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
  topGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, canvasWidth, FLOW_GLOW_SIZE);

  // Bottom edge
  const bottomGrad = ctx.createLinearGradient(0, canvasHeight, 0, canvasHeight - FLOW_GLOW_SIZE);
  bottomGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
  bottomGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, canvasHeight - FLOW_GLOW_SIZE, canvasWidth, FLOW_GLOW_SIZE);

  ctx.restore();
}

/**
 * Renders a timing visualization band at the bottom of the canvas.
 * Shows vertical beat grid lines with note markers positioned by
 * beat index. On-beat notes are centered on the grid line; early/late
 * notes are offset left/right proportionally to their deviation.
 *
 * Story 23.7: Predictive model — shows upcoming beat markers based on
 * detected tempo, even before notes are played on those beats.
 * Past beats rendered solid, future beats rendered dashed at lower alpha.
 */
export function renderTimingGrid(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  bpm: number | null,
  deviations: TimingEvent[]
): void {
  if (bpm === null || bpm <= 0) return;

  const bandTop = canvasHeight * 0.8;
  const bandHeight = canvasHeight * 0.15;
  const bandCenterY = bandTop + bandHeight / 2;

  const beatIntervalMs = 60000 / bpm;
  const recent = deviations.slice(-16);

  // Adapt beat count to canvas width for mobile viewports
  const isCompact = canvasWidth < COMPACT_WIDTH_PX;
  const beatsToShow = isCompact ? BEATS_TO_SHOW_COMPACT : BEATS_TO_SHOW_FULL;
  const predictiveBeats = isCompact ? PREDICTIVE_BEATS_COMPACT : PREDICTIVE_BEATS_FULL;

  // Total beats to render: past + predictive future
  const totalBeats = beatsToShow + predictiveBeats;
  const beatSpacingPx = canvasWidth / (totalBeats + 1);

  // Determine beat range: anchor on last known beat, extend forward
  const lastPlayedBeat = recent.length > 0 ? recent[recent.length - 1].beatIndex : 0;
  const firstBeat = lastPlayedBeat - beatsToShow + 1;

  ctx.lineWidth = GRID_LINE_WIDTH;

  // Draw vertical beat grid lines (past + predictive future)
  for (let i = 0; i <= totalBeats; i++) {
    const beatIndex = firstBeat + i;
    const x = (i + 1) * beatSpacingPx;
    const isFuture = beatIndex > lastPlayedBeat;

    if (isFuture) {
      // Predictive beats: dashed, lower alpha
      ctx.strokeStyle = vizRgba(VIZ_TIMING_RGB, PREDICTIVE_GRID_ALPHA);
      ctx.setLineDash([4, 4]);
    } else {
      ctx.strokeStyle = vizRgba(VIZ_TIMING_RGB, GRID_LINE_ALPHA);
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(x, bandTop);
    ctx.lineTo(x, bandTop + bandHeight);
    ctx.stroke();
  }
  ctx.setLineDash([]); // reset

  // Render note markers at their beat positions with deviation offset
  for (const d of recent) {
    const beatOffset = d.beatIndex - firstBeat;
    if (beatOffset < 0 || beatOffset > totalBeats) continue;

    const baseX = (beatOffset + 1) * beatSpacingPx;

    // Map deviation to pixel offset (clamped)
    const deviationRatio = Math.max(-1, Math.min(1, d.deviationMs / (beatIntervalMs / 2)));
    const offsetX = deviationRatio * MAX_DEVIATION_PX;
    const x = baseX + offsetX;

    const onBeat = Math.abs(d.deviationMs) <= ON_BEAT_TOLERANCE_MS;
    const alpha = onBeat ? ON_BEAT_ALPHA : OFF_BEAT_ALPHA;

    ctx.fillStyle = vizRgba(VIZ_TIMING_RGB, alpha);
    ctx.fillRect(
      x - NOTE_MARKER_SIZE / 2,
      bandCenterY - NOTE_MARKER_SIZE / 2,
      NOTE_MARKER_SIZE,
      NOTE_MARKER_SIZE
    );
  }

  renderBpmLabel(ctx, bpm, canvasWidth, bandTop);
}

function renderBpmLabel(
  ctx: CanvasRenderingContext2D,
  bpm: number,
  canvasWidth: number,
  bandTop: number
): void {
  ctx.font = BPM_LABEL_FONT;
  ctx.fillStyle = BPM_LABEL_COLOR;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`${bpm} BPM`, canvasWidth - 12, bandTop + 4);
  ctx.textAlign = 'start';
}
