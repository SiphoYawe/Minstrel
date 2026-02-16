import type { MidiEvent } from '@/features/midi/midi-types';
import { noteNumberToY, velocityToAlpha, velocityToSize } from './canvas-utils';
import { VIZ_PRIMARY_RGB, vizRgba } from '@/lib/viz-colors';

const ACCENT_COLOR = VIZ_PRIMARY_RGB;
const LABEL_COLOR = vizRgba(VIZ_PRIMARY_RGB, 0.7);
const CHORD_LABEL_COLOR = 'hsl(206, 70%, 70%)';
const BASE_NOTE_WIDTH = 24;
const BASE_NOTE_HEIGHT = 10; // increased ~30% from 8 for better visibility
const NOTE_LABEL_OFFSET_X = 20;
const NOTE_LABEL_FONT = '12px "JetBrains Mono", monospace';
const CHORD_LABEL_FONT = '16px "Inter", sans-serif';
const GLOW_PADDING = 4;
const GLOW_ALPHA = 0.15;
const CHORD_LABEL_BASE_Y = 24;
const CHORD_LABEL_COLLISION_ZONE = 44; // notes within this Y trigger repositioning

export interface FadingNote {
  note: number;
  y: number;
  alpha: number;
  size: number;
  fadeStart: number;
}

const FADE_DURATION = 200; // ms

export function renderNotes(
  ctx: CanvasRenderingContext2D,
  activeNotes: Record<number, MidiEvent>,
  fadingNotes: FadingNote[],
  canvasWidth: number,
  canvasHeight: number,
  now: number,
  chordLabel?: string | null
): FadingNote[] {
  const centerX = canvasWidth / 2;

  // Render fading notes, remove expired ones
  const remainingFading: FadingNote[] = [];
  for (const fn of fadingNotes) {
    const elapsed = now - fn.fadeStart;
    if (elapsed >= FADE_DURATION) continue;

    const fadeAlpha = fn.alpha * (1 - elapsed / FADE_DURATION);
    const w = BASE_NOTE_WIDTH * fn.size;
    const h = BASE_NOTE_HEIGHT * fn.size;

    ctx.fillStyle = `rgba(${ACCENT_COLOR.r}, ${ACCENT_COLOR.g}, ${ACCENT_COLOR.b}, ${fadeAlpha})`;
    ctx.fillRect(centerX - w / 2, fn.y - h / 2, w, h);
    remainingFading.push(fn);
  }

  // Render active notes with glow effect and labels
  const noteEntries = Object.values(activeNotes);
  for (const event of noteEntries) {
    const y = noteNumberToY(event.note, canvasHeight);
    const alpha = velocityToAlpha(event.velocity);
    const size = velocityToSize(event.velocity);
    const w = BASE_NOTE_WIDTH * size;
    const h = BASE_NOTE_HEIGHT * size;

    // Glow/bloom effect behind active note
    ctx.fillStyle = `rgba(${ACCENT_COLOR.r}, ${ACCENT_COLOR.g}, ${ACCENT_COLOR.b}, ${GLOW_ALPHA})`;
    ctx.fillRect(
      centerX - w / 2 - GLOW_PADDING,
      y - h / 2 - GLOW_PADDING,
      w + GLOW_PADDING * 2,
      h + GLOW_PADDING * 2
    );

    // Main note bar
    ctx.fillStyle = `rgba(${ACCENT_COLOR.r}, ${ACCENT_COLOR.g}, ${ACCENT_COLOR.b}, ${alpha})`;
    ctx.fillRect(centerX - w / 2, y - h / 2, w, h);
  }

  // Note name labels (set font once, outside the loop)
  if (noteEntries.length > 0) {
    ctx.font = NOTE_LABEL_FONT;
    ctx.fillStyle = LABEL_COLOR;
    ctx.textBaseline = 'middle';
    for (const event of noteEntries) {
      const y = noteNumberToY(event.note, canvasHeight);
      const size = velocityToSize(event.velocity);
      const w = BASE_NOTE_WIDTH * size;
      ctx.fillText(event.noteName, centerX + w / 2 + NOTE_LABEL_OFFSET_X, y);
    }
  }

  // Render chord label in the upper area, repositioning if high notes collide
  if (chordLabel) {
    let chordY = CHORD_LABEL_BASE_Y;
    if (noteEntries.length > 0) {
      let minNoteY = canvasHeight;
      for (const event of noteEntries) {
        minNoteY = Math.min(minNoteY, noteNumberToY(event.note, canvasHeight));
      }
      if (minNoteY < CHORD_LABEL_COLLISION_ZONE) {
        chordY = minNoteY + 28;
      }
    }
    ctx.font = CHORD_LABEL_FONT;
    ctx.fillStyle = CHORD_LABEL_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(chordLabel, centerX, chordY);
    ctx.textAlign = 'start'; // reset
  }

  return remainingFading;
}

export function createFadingNote(event: MidiEvent, canvasHeight: number, now: number): FadingNote {
  return {
    note: event.note,
    y: noteNumberToY(event.note, canvasHeight),
    alpha: velocityToAlpha(event.velocity),
    size: velocityToSize(event.velocity),
    fadeStart: now,
  };
}
