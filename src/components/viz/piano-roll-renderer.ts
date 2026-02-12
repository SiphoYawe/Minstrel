import type { MidiEvent } from '@/features/midi/midi-types';
import { clearCanvas, noteNumberToY, velocityToAlpha, velocityToSize } from './canvas-utils';

const ACCENT_COLOR = { r: 124, g: 185, b: 232 }; // #7CB9E8
const BASE_NOTE_WIDTH = 24;
const BASE_NOTE_HEIGHT = 8;

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
  now: number
): FadingNote[] {
  clearCanvas(ctx, canvasWidth, canvasHeight);

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

  // Render active notes
  const noteEntries = Object.values(activeNotes);
  for (const event of noteEntries) {
    const y = noteNumberToY(event.note, canvasHeight);
    const alpha = velocityToAlpha(event.velocity);
    const size = velocityToSize(event.velocity);
    const w = BASE_NOTE_WIDTH * size;
    const h = BASE_NOTE_HEIGHT * size;

    ctx.fillStyle = `rgba(${ACCENT_COLOR.r}, ${ACCENT_COLOR.g}, ${ACCENT_COLOR.b}, ${alpha})`;
    ctx.fillRect(centerX - w / 2, y - h / 2, w, h);
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
