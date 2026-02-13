import type { InstantSnapshot } from '@/features/analysis/analysis-types';

const BG_COLOR = '#0F0F0F';
const SURFACE_COLOR = '#171717';
const BORDER_COLOR = '#333333';
const TEXT_PRIMARY = '#E0E0E0';
const TEXT_SECONDARY = '#999999';
const ACCENT_COLOR = '#7CB9E8';
const AMBER_COLOR = '#E8C77B';

const FONT_SANS = 'Inter, system-ui, sans-serif';
const FONT_MONO = 'JetBrains Mono, monospace';

/**
 * Renders a snapshot overlay on the Canvas with clean typography.
 * Uses amber tones for progress indicators and growth mindset language.
 */
export function renderSnapshotOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  snapshot: InstantSnapshot,
  transitionAlpha: number
): void {
  if (transitionAlpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = transitionAlpha;

  // Full background fade
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  // Center content area
  const cardW = Math.min(width * 0.7, 480);
  const cardH = Math.min(height * 0.6, 340);
  const cardX = (width - cardW) / 2;
  const cardY = (height - cardH) / 2;

  // Card background
  ctx.fillStyle = SURFACE_COLOR;
  ctx.fillRect(cardX, cardY, cardW, cardH);

  // Card border
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  // Clip content to card bounds
  ctx.beginPath();
  ctx.rect(cardX, cardY, cardW, cardH);
  ctx.clip();

  const padding = 24;
  let y = cardY + padding;
  const textX = cardX + padding;
  const contentW = cardW - padding * 2;

  // Header: "Session Snapshot"
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.font = `500 11px ${FONT_MONO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('SESSION SNAPSHOT', textX, y);
  y += 24;

  // Key
  if (snapshot.key) {
    const keyLabel = `${snapshot.key.root} ${snapshot.key.mode}`;
    ctx.fillStyle = ACCENT_COLOR;
    ctx.font = `600 22px ${FONT_SANS}`;
    ctx.fillText(keyLabel, textX, y);
    y += 32;
  }

  // Stats row: tempo + accuracy
  ctx.font = `500 13px ${FONT_MONO}`;
  const statsY = y;

  if (snapshot.averageTempo !== null) {
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.fillText(`${Math.round(snapshot.averageTempo)} BPM`, textX, statsY);
  }

  // Timing accuracy with amber tones for in-progress
  const accuracyStr = `${Math.round(snapshot.timingAccuracy)}% timing`;
  const accuracyColor = snapshot.timingAccuracy >= 90 ? '#81C995' : AMBER_COLOR;
  ctx.fillStyle = accuracyColor;
  const accuracyX = textX + contentW / 2;
  ctx.fillText(accuracyStr, accuracyX, statsY);
  y += 28;

  // Genre pattern (if detected)
  if (snapshot.genrePatterns.length > 0) {
    const genre = snapshot.genrePatterns[0];
    ctx.fillStyle = TEXT_SECONDARY;
    ctx.font = `400 12px ${FONT_SANS}`;
    ctx.fillText(`${genre.genre} detected (${Math.round(genre.confidence * 100)}%)`, textX, y);
    y += 22;
  }

  // Chords used count
  if (snapshot.chordsUsed.length > 0) {
    const uniqueChords = new Set(snapshot.chordsUsed.map((c) => `${c.root}${c.quality}`));
    ctx.fillStyle = TEXT_SECONDARY;
    ctx.font = `400 12px ${FONT_SANS}`;
    ctx.fillText(`${uniqueChords.size} unique chords played`, textX, y);
    y += 28;
  }

  // Divider
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(textX, y);
  ctx.lineTo(textX + contentW, y);
  ctx.stroke();
  y += 16;

  // Key insight
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.font = `400 14px ${FONT_SANS}`;
  wrapText(ctx, snapshot.keyInsight, textX, y, contentW, 20);

  ctx.restore();
}

/**
 * Simple word-wrap text renderer for Canvas.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
  }
}
