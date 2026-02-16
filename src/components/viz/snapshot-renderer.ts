import type { InstantSnapshot } from '@/features/analysis/analysis-types';

const BG_COLOR = '#0F0F0F';
const SURFACE_COLOR = '#171717';
const BORDER_COLOR = '#333333';
const TEXT_PRIMARY = '#E0E0E0';
const TEXT_SECONDARY = '#999999';
const ACCENT_COLOR = '#7CB9E8';
const AMBER_COLOR = '#E8C77B';
const LIMITED_DATA_COLOR = '#666666';

const FONT_SANS = 'Inter, system-ui, sans-serif';
const FONT_MONO = 'JetBrains Mono, monospace';

/**
 * Renders a snapshot overlay on the Canvas with clean typography.
 * Uses amber tones for progress indicators and growth mindset language.
 * Story 14.5: Renders multiple insights and chord frequency data.
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
  const cardH = Math.min(height * 0.7, 420);
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

  // Header: "Session Snapshot" + limited data badge
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.font = `500 11px ${FONT_MONO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('SESSION SNAPSHOT', textX, y);

  if (snapshot.isLimitedData) {
    const badgeText = 'LIMITED DATA';
    const badgeX = textX + contentW - ctx.measureText(badgeText).width;
    ctx.fillStyle = LIMITED_DATA_COLOR;
    ctx.fillText(badgeText, badgeX, y);
  }
  y += 24;

  // Key
  if (snapshot.key) {
    const keyLabel = `${snapshot.key.root} ${snapshot.key.mode}`;
    ctx.fillStyle = ACCENT_COLOR;
    ctx.font = `600 22px ${FONT_SANS}`;
    ctx.fillText(keyLabel, textX, y);

    // Confidence badge for low-confidence key
    if (snapshot.key.confidence < 0.5) {
      const confText = `(${Math.round(snapshot.key.confidence * 100)}%)`;
      ctx.fillStyle = AMBER_COLOR;
      ctx.font = `400 12px ${FONT_MONO}`;
      const keyWidth = ctx.measureText(keyLabel).width;
      ctx.font = `600 22px ${FONT_SANS}`;
      ctx.font = `400 12px ${FONT_MONO}`;
      ctx.fillText(confText, textX + keyWidth + 8, y + 6);
    }
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

  // Chord frequencies (Story 14.5)
  if (snapshot.chordFrequencies.length > 0) {
    ctx.fillStyle = TEXT_SECONDARY;
    ctx.font = `400 12px ${FONT_SANS}`;
    const freqText = snapshot.chordFrequencies.map((cf) => `${cf.label} ×${cf.count}`).join('  ');
    ctx.fillText(freqText, textX, y);
    y += 22;
  } else if (snapshot.chordsUsed.length > 0) {
    const uniqueChords = new Set(snapshot.chordsUsed.map((c) => `${c.root}${c.quality}`));
    ctx.fillStyle = TEXT_SECONDARY;
    ctx.font = `400 12px ${FONT_SANS}`;
    ctx.fillText(`${uniqueChords.size} unique chords played`, textX, y);
    y += 22;
  }

  // Divider
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(textX, y);
  ctx.lineTo(textX + contentW, y);
  ctx.stroke();
  y += 16;

  // Render multiple insights (Story 14.5)
  const insights =
    snapshot.insights && snapshot.insights.length > 0
      ? snapshot.insights
      : [{ text: snapshot.keyInsight, category: snapshot.insightCategory, confidence: 1 }];

  for (const insight of insights) {
    // Confidence dot indicator
    const dotColor =
      insight.confidence >= 0.7
        ? '#81C995'
        : insight.confidence >= 0.4
          ? AMBER_COLOR
          : LIMITED_DATA_COLOR;
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(textX + 4, y + 7, 3, 0, Math.PI * 2);
    ctx.fill();

    // Insight text — 16px minimum for reading distance (Story 23.6)
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.font = `400 16px ${FONT_SANS}`;
    const insightY = wrapText(ctx, insight.text, textX + 14, y, contentW - 14, 22);
    y = insightY + 10;
  }

  ctx.restore();
}

/**
 * Simple word-wrap text renderer for Canvas.
 * Returns the Y position after the last line.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      if (line) {
        ctx.fillText(line, x, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        // Single word exceeds maxWidth — render it anyway and move on
        ctx.fillText(word, x, currentY);
        currentY += lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
  }
  return currentY;
}
