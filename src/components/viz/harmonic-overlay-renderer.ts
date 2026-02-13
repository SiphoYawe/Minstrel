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
const LABEL_BG_COLOR = 'rgba(15, 15, 15, 0.7)';
const TONE_MARKER_SIZE = 5;

/**
 * Renders harmonic analysis overlay on the canvas:
 * - Key center label (top-left)
 * - Chord-tone / passing-tone markers on the piano roll
 *
 * Note: Chord label + roman numeral rendering moved to ChordHud React overlay
 * to prevent canvas text ghosting / overlap issues.
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
