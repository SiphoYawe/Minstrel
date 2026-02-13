'use client';

import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/stores/session-store';
import type { ChordQuality } from '@/features/analysis/analysis-types';

const MAX_VISIBLE = 8;
const BLOCK_W = 48;
const BLOCK_H = 28;
const GAP = 4;

/** Harmonic function → color mapping */
const FUNCTION_COLORS = {
  tonic: '#7CB9E8', // accent-blue
  dominant: '#E8C77B', // accent-warm
  subdominant: '#B4A7D6', // lavender
  default: '#666666', // neutral grey when no key
} as const;

type HarmonicRole = keyof typeof FUNCTION_COLORS;

/**
 * Determine harmonic role from chord root relative to key.
 * Simplified: I=tonic, IV=subdominant, V=dominant, rest=tonic/subdominant heuristic.
 */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ENHARMONIC: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Fb: 'E',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
  'E#': 'F',
  'B#': 'C',
};

function noteIndex(name: string): number {
  const normalized = ENHARMONIC[name] ?? name;
  return NOTE_NAMES.indexOf(normalized);
}

function getHarmonicRole(chordRoot: string, keyRoot: string | null): HarmonicRole {
  if (!keyRoot) return 'default';
  const ki = noteIndex(keyRoot);
  const ci = noteIndex(chordRoot);
  if (ki < 0 || ci < 0) return 'default';
  const interval = (((ci - ki) % 12) + 12) % 12;
  // I, iii, vi → tonic family
  if (interval === 0 || interval === 4 || interval === 9) return 'tonic';
  // IV, ii → subdominant family
  if (interval === 5 || interval === 2) return 'subdominant';
  // V, vii° → dominant family
  if (interval === 7 || interval === 11) return 'dominant';
  return 'default';
}

/** Render a single chord block onto a canvas context. */
function drawChordBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  quality: ChordQuality,
  color: string
) {
  ctx.save();

  switch (quality) {
    case 'Major':
      // Solid fill
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x, y, w, h);
      break;

    case 'Minor':
      // Outlined
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
      break;

    case 'Dominant7':
    case 'Minor7':
    case 'Major7':
      // Fill with accent dot
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(x + w - 6, y + 6, 3, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'Diminished':
      // Dashed outline
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
      break;

    case 'Augmented':
      // Double outline
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
      break;

    default:
      // Sus2, Sus4 — fill with diagonal line
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w, y);
      ctx.stroke();
      break;
  }

  ctx.restore();
}

/**
 * Chord Progression Strip
 *
 * Renders last 8 detected chords as colored blocks with labels,
 * using canvas for fast rendering that matches the dark studio aesthetic.
 * Positioned at bottom-center of the silent-coach canvas area.
 */
export function ChordProgressionStrip() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevCountRef = useRef(0);

  const detectedChords = useSessionStore((s) => s.detectedChords);
  const currentKey = useSessionStore((s) => s.currentKey);

  const chords = detectedChords.slice(-MAX_VISIBLE);
  const keyRoot = currentKey?.root ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const totalW = chords.length * (BLOCK_W + GAP) - GAP;
    const paddingX = 16;
    const paddingY = 8;
    const labelH = 14;
    const w = Math.max(totalW + paddingX * 2, 80);
    const h = BLOCK_H + labelH + paddingY * 2;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(15, 15, 15, 0.85)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    if (chords.length === 0) {
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('chords', w / 2, h / 2);
      return;
    }

    // Draw chord blocks
    const startX = paddingX;
    for (let i = 0; i < chords.length; i++) {
      const chord = chords[i];
      const role = getHarmonicRole(chord.root, keyRoot);
      const color = FUNCTION_COLORS[role];
      const bx = startX + i * (BLOCK_W + GAP);
      const by = paddingY;

      drawChordBlock(ctx, bx, by, BLOCK_W, BLOCK_H, chord.quality, color);

      // Label
      const shortQuality =
        chord.quality === 'Major'
          ? ''
          : chord.quality === 'Minor'
            ? 'm'
            : chord.quality === 'Dominant7'
              ? '7'
              : chord.quality === 'Minor7'
                ? 'm7'
                : chord.quality === 'Major7'
                  ? 'M7'
                  : chord.quality === 'Diminished'
                    ? '°'
                    : chord.quality === 'Augmented'
                      ? '+'
                      : chord.quality === 'Sus2'
                        ? 'sus2'
                        : 'sus4';
      const label = `${chord.root}${shortQuality}`;

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, bx + BLOCK_W / 2, by + BLOCK_H + 2);
    }

    prevCountRef.current = detectedChords.length;
  }, [chords, keyRoot, detectedChords.length]);

  // Don't render until at least one chord is detected
  if (detectedChords.length === 0) return null;

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[var(--z-base)]">
      <canvas
        ref={canvasRef}
        className="block"
        aria-label={`Chord progression: ${chords.map((c) => `${c.root} ${c.quality}`).join(', ')}`}
        role="img"
      />
    </div>
  );
}
