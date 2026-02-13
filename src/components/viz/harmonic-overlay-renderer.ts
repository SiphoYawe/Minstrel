import type {
  KeyCenter,
  HarmonicFunction,
  NoteAnalysis,
  ChordQuality,
} from '@/features/analysis/analysis-types';
import { noteNumberToY } from './canvas-utils';

const CHORD_TONE_COLOR = 'rgba(180, 167, 214, 0.8)'; // #B4A7D6
const PASSING_TONE_COLOR = 'rgba(180, 167, 214, 0.3)';
const KEY_LABEL_FONT = '20px "Inter", sans-serif';
const KEY_LABEL_COLOR = 'rgba(180, 167, 214, 0.85)';
const NUMERAL_LABEL_FONT = '14px "JetBrains Mono", monospace';
const NUMERAL_LABEL_COLOR = 'rgba(180, 167, 214, 0.7)';
const CHORD_BLOCK_FONT = '13px "JetBrains Mono", monospace';
const LABEL_BG_COLOR = 'rgba(15, 15, 15, 0.7)';
const TONE_MARKER_SIZE = 5;
const CHORD_BLOCK_W = 40;
const CHORD_BLOCK_H = 26;

/** Harmonic function → color */
const FUNCTION_COLORS: Record<string, string> = {
  tonic: '#7CB9E8',
  dominant: '#E8C77B',
  subdominant: '#B4A7D6',
};

function getFunctionColor(fn: HarmonicFunction | null): string {
  if (!fn) return '#666666';
  const numeral = fn.romanNumeral.replace(/°|⁷|\/.*$/g, '').toLowerCase();
  // I, iii, vi → tonic; IV, ii → subdominant; V, vii → dominant
  if (numeral === 'i' || numeral === 'iii' || numeral === 'vi') return FUNCTION_COLORS.tonic;
  if (numeral === 'iv' || numeral === 'ii') return FUNCTION_COLORS.subdominant;
  if (numeral === 'v' || numeral === 'vii') return FUNCTION_COLORS.dominant;
  return '#666666';
}

/** Draw a chord quality block at given position. */
function drawQualityBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  quality: ChordQuality,
  color: string
): void {
  ctx.save();
  switch (quality) {
    case 'Major':
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.65;
      ctx.fillRect(x, y, w, h);
      break;
    case 'Minor':
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
      break;
    case 'Dominant7':
    case 'Minor7':
    case 'Major7':
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(x + w - 6, y + 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'Diminished':
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
      break;
    default:
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x, y, w, h);
      break;
  }
  ctx.restore();
}

/**
 * Renders harmonic analysis overlay on the canvas:
 * - Key center label (top-left)
 * - Roman numeral label (below chord label area)
 * - Chord-tone / passing-tone markers on the piano roll
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

  // Chord quality block + Roman numeral (top center)
  if (chordLabel && chordQuality) {
    const color = getFunctionColor(harmonicFunction);
    const blockX = canvasWidth / 2 - CHORD_BLOCK_W / 2;
    const blockY = 10;

    // Draw quality-shaped block
    drawQualityBlock(ctx, blockX, blockY, CHORD_BLOCK_W, CHORD_BLOCK_H, chordQuality, color);

    // Chord label text centered inside block
    ctx.save();
    ctx.font = CHORD_BLOCK_FONT;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(chordLabel, canvasWidth / 2, blockY + CHORD_BLOCK_H / 2);
    ctx.restore();

    // Roman numeral below block
    if (harmonicFunction) {
      ctx.font = NUMERAL_LABEL_FONT;
      const numeralMetrics = ctx.measureText(harmonicFunction.romanNumeral);
      const numeralBgW = numeralMetrics.width + 10;
      const numeralY = blockY + CHORD_BLOCK_H + 4;
      ctx.fillStyle = LABEL_BG_COLOR;
      ctx.fillRect(canvasWidth / 2 - numeralBgW / 2, numeralY, numeralBgW, 20);
      ctx.fillStyle = NUMERAL_LABEL_COLOR;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(harmonicFunction.romanNumeral, canvasWidth / 2, numeralY + 3);
      ctx.textAlign = 'start';
    }
  } else if (harmonicFunction) {
    // Fallback: just Roman numeral without block
    ctx.font = NUMERAL_LABEL_FONT;
    const numeralMetrics = ctx.measureText(harmonicFunction.romanNumeral);
    const numeralBgW = numeralMetrics.width + 10;
    ctx.fillStyle = LABEL_BG_COLOR;
    ctx.fillRect(canvasWidth / 2 - numeralBgW / 2, 46, numeralBgW, 22);
    ctx.fillStyle = NUMERAL_LABEL_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(harmonicFunction.romanNumeral, canvasWidth / 2, 49);
    ctx.textAlign = 'start';
  }

  // Chord-tone / passing-tone markers
  const recent = noteAnalyses.slice(-16);
  for (const analysis of recent) {
    if (!analysis.chordContext) continue;

    const y = noteNumberToY(analysis.note.midiNumber, canvasHeight);
    const x = canvasWidth / 2 + 60; // Offset right of center

    ctx.fillStyle = analysis.isChordTone ? CHORD_TONE_COLOR : PASSING_TONE_COLOR;
    ctx.fillRect(
      x - TONE_MARKER_SIZE / 2,
      y - TONE_MARKER_SIZE / 2,
      TONE_MARKER_SIZE,
      TONE_MARKER_SIZE
    );
  }
}
