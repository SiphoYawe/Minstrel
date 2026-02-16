import type {
  KeyCenter,
  HarmonicFunction,
  NoteAnalysis,
  ChordQuality,
} from '@/features/analysis/analysis-types';
import { noteNumberToY } from './canvas-utils';

const CHORD_TONE_COLOR = { r: 180, g: 167, b: 214 }; // #B4A7D6
const CHORD_TONE_ALPHA = 0.8;
const PASSING_TONE_ALPHA = 0.45;
const KEY_LABEL_FONT = '20px "Inter", sans-serif';
const KEY_LABEL_COLOR = 'rgba(180, 167, 214, 0.85)';
const LABEL_BG_COLOR = 'rgba(15, 15, 15, 0.7)';
const TONE_MARKER_SIZE = 10;
const QUALITY_LABEL_FONT = '11px "JetBrains Mono", monospace';
const QUALITY_LABEL_COLOR = 'rgba(180, 167, 214, 0.7)';

/** Map chord quality to a short accessible text label. */
function qualityLabel(q: ChordQuality): string {
  switch (q) {
    case 'Major':
      return 'Maj';
    case 'Minor':
      return 'min';
    case 'Dominant7':
      return 'Dom7';
    case 'Minor7':
      return 'min7';
    case 'Major7':
      return 'Maj7';
    case 'Diminished':
      return 'dim';
    case 'Augmented':
      return 'aug';
    case 'Sus2':
      return 'sus2';
    case 'Sus4':
      return 'sus4';
    default:
      return '';
  }
}

/** Draw a diamond shape centered at (cx, cy) with the given half-size. */
function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, half: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - half);
  ctx.lineTo(cx + half, cy);
  ctx.lineTo(cx, cy + half);
  ctx.lineTo(cx - half, cy);
  ctx.closePath();
  ctx.fill();
}

/**
 * Renders harmonic analysis overlay on the canvas:
 * - Key center label (top-left)
 * - Chord-tone (circles) / passing-tone (diamonds) markers — shape distinction (Story 23.3)
 * - Chord quality text label when chord is detected
 *
 * Note: Chord label + roman numeral rendering also in ChordHud React overlay.
 */
export function renderHarmonicOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  key: KeyCenter | null,
  harmonicFunction: HarmonicFunction | null,
  noteAnalyses: NoteAnalysis[],
  chordLabel?: string | null,
  chordQuality?: ChordQuality | null
): void {
  // Key center label
  if (key) {
    const modeLabel = key.mode === 'major' ? 'Major' : 'Minor';
    const keyText = `Key: ${key.root} ${modeLabel}`;
    ctx.font = KEY_LABEL_FONT;

    // Dark background for legibility
    const metrics = ctx.measureText(keyText);
    ctx.fillStyle = LABEL_BG_COLOR;
    ctx.fillRect(8, 8, metrics.width + 12, 28);

    ctx.fillStyle = KEY_LABEL_COLOR;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(keyText, 14, 12);
  }

  // Chord quality text label (Story 23.3 — non-color distinction)
  if (chordQuality) {
    const qLabel = qualityLabel(chordQuality);
    if (qLabel) {
      ctx.font = QUALITY_LABEL_FONT;
      ctx.fillStyle = QUALITY_LABEL_COLOR;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(qLabel, canvasWidth / 2, 56);
      ctx.textAlign = 'start';
    }
  }

  // Chord-tone (circles) / passing-tone (diamonds) markers — shape distinction
  const { r, g, b } = CHORD_TONE_COLOR;
  const recent = noteAnalyses.slice(-16);
  for (const analysis of recent) {
    if (!analysis.chordContext) continue;

    const y = noteNumberToY(analysis.note.midiNumber, canvasHeight);
    const x = canvasWidth / 2 + 60; // Offset right of center
    const alpha = analysis.isChordTone ? CHORD_TONE_ALPHA : PASSING_TONE_ALPHA;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

    if (analysis.isChordTone) {
      // Circle for chord tones
      ctx.beginPath();
      ctx.arc(x, y, TONE_MARKER_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Diamond for passing tones
      drawDiamond(ctx, x, y, TONE_MARKER_SIZE / 2);
    }
  }
}
