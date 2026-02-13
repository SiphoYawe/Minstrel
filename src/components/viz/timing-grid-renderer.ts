import type { TimingEvent } from '@/features/analysis/analysis-types';
import { ON_BEAT_TOLERANCE_MS } from '@/lib/constants';

const GRID_LINE_ALPHA = 0.15;
const GRID_LINE_WIDTH = 1;
const NOTE_MARKER_SIZE = 6;
const ON_BEAT_ALPHA = 0.9;
const OFF_BEAT_ALPHA = 0.5;
const BPM_LABEL_FONT = '12px "JetBrains Mono", monospace';
const BPM_LABEL_COLOR = 'rgba(168, 213, 186, 0.6)';
const BEATS_TO_SHOW = 12;
const MAX_DEVIATION_PX = 40;

/**
 * Renders a timing visualization band at the bottom of the canvas.
 * Shows vertical beat grid lines with note markers positioned by
 * beat index. On-beat notes are centered on the grid line; early/late
 * notes are offset left/right proportionally to their deviation.
 *
 * All positioning is derived from the deviation data (MIDI timestamps),
 * avoiding any dependency on performance.now() clock.
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

  // Use the last 16 deviations for display
  const recent = deviations.slice(-16);
  if (recent.length === 0) {
    renderBpmLabel(ctx, bpm, canvasWidth, bandTop);
    return;
  }

  // Determine beat range from deviation data
  const lastBeat = recent[recent.length - 1].beatIndex;
  const firstBeat = lastBeat - BEATS_TO_SHOW + 1;

  // Pixel spacing per beat
  const beatSpacingPx = canvasWidth / (BEATS_TO_SHOW + 1);

  // Draw vertical beat grid lines
  ctx.strokeStyle = `rgba(168, 213, 186, ${GRID_LINE_ALPHA})`;
  ctx.lineWidth = GRID_LINE_WIDTH;

  for (let i = 0; i <= BEATS_TO_SHOW; i++) {
    const x = (i + 1) * beatSpacingPx;

    ctx.beginPath();
    ctx.moveTo(x, bandTop);
    ctx.lineTo(x, bandTop + bandHeight);
    ctx.stroke();
  }

  // Render note markers at their beat positions with deviation offset
  for (const d of recent) {
    const beatOffset = d.beatIndex - firstBeat;
    if (beatOffset < 0 || beatOffset > BEATS_TO_SHOW) continue;

    const baseX = (beatOffset + 1) * beatSpacingPx;

    // Map deviation to pixel offset (clamped)
    const deviationRatio = Math.max(-1, Math.min(1, d.deviationMs / (beatIntervalMs / 2)));
    const offsetX = deviationRatio * MAX_DEVIATION_PX;
    const x = baseX + offsetX;

    const onBeat = Math.abs(d.deviationMs) <= ON_BEAT_TOLERANCE_MS;
    const alpha = onBeat ? ON_BEAT_ALPHA : OFF_BEAT_ALPHA;

    ctx.fillStyle = `rgba(168, 213, 186, ${alpha})`;
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
