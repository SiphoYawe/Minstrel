const BG_COLOR = '#0F0F0F';

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);
}

export function noteNumberToY(noteNumber: number, canvasHeight: number): number {
  // MIDI notes 0-127 mapped to canvas height (high notes at top, low at bottom)
  const normalized = 1 - noteNumber / 127;
  return normalized * canvasHeight;
}

export function velocityToAlpha(velocity: number): number {
  // Map velocity 0-127 to opacity 0.3-1.0
  return 0.3 + (velocity / 127) * 0.7;
}

export function velocityToSize(velocity: number): number {
  // Map velocity 0-127 to size multiplier 0.6-1.4
  return 0.6 + (velocity / 127) * 0.8;
}

/**
 * Build a time-indexed structure for fast lookup of active notes at any timestamp.
 * Returns an array sorted by timestamp for binary search.
 */
export interface TimeIndexedEvent {
  timestamp: number;
  note: number;
  velocity: number;
  type: 'note-on' | 'note-off';
}

export function buildTimeIndex(
  events: Array<{ timestamp: number; note: number; velocity: number; type: string }>
): TimeIndexedEvent[] {
  return events
    .filter((e) => e.type === 'note-on' || e.type === 'note-off')
    .map((e) => ({
      timestamp: e.timestamp,
      note: e.note,
      velocity: e.velocity,
      type: e.type as 'note-on' | 'note-off',
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get the set of active notes at a given timestamp.
 * Scans all events up to the timestamp and tracks note-on/note-off pairs.
 * Uses binary search to find the starting point for efficiency.
 */
export function getEventsAtTimestamp(
  timeIndex: TimeIndexedEvent[],
  timestamp: number
): Map<number, { velocity: number }> {
  const activeNotes = new Map<number, { velocity: number }>();

  // Binary search for upper bound
  let lo = 0;
  let hi = timeIndex.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (timeIndex[mid].timestamp <= timestamp) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  // Process all events up to (and including) the timestamp
  for (let i = 0; i < lo; i++) {
    const evt = timeIndex[i];
    if (evt.type === 'note-on' && evt.velocity > 0) {
      activeNotes.set(evt.note, { velocity: evt.velocity });
    } else {
      activeNotes.delete(evt.note);
    }
  }

  return activeNotes;
}
