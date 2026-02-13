import type { TimingEvent } from './analysis-types';

/** Rolling window duration for flow state detection (ms). */
const FLOW_WINDOW_MS = 30_000;

/** Minimum timing accuracy (0–1) to qualify as flow state. */
const FLOW_ACCURACY_THRESHOLD = 0.85;

/** Minimum notes in the rolling window to trigger flow state. */
const FLOW_MIN_NOTES = 12;

/** On-time tolerance for flow detection — wider than grid (±50ms per AC). */
const FLOW_ON_TIME_TOLERANCE_MS = 50;

export interface FlowState {
  /** Whether the player is currently in flow. */
  isInFlow: boolean;
  /** Rolling accuracy (0–1) over the last 30 seconds. */
  rollingAccuracy: number;
  /** Number of recent notes considered. */
  windowNoteCount: number;
}

/**
 * Determines whether the player is in a "flow state" based on a
 * rolling 30-second window of timing deviations.
 *
 * Flow is detected when:
 * 1. There are at least FLOW_MIN_NOTES in the window.
 * 2. At least FLOW_ACCURACY_THRESHOLD of those notes are within
 *    ±FLOW_ON_TIME_TOLERANCE_MS of the expected beat.
 */
export function detectFlowState(deviations: TimingEvent[], nowMs: number): FlowState {
  if (deviations.length === 0) {
    return { isInFlow: false, rollingAccuracy: 0, windowNoteCount: 0 };
  }

  const windowStart = nowMs - FLOW_WINDOW_MS;

  // Filter to notes within the rolling window
  const recent = deviations.filter((d) => d.noteTimestamp >= windowStart);

  if (recent.length < FLOW_MIN_NOTES) {
    return { isInFlow: false, rollingAccuracy: 0, windowNoteCount: recent.length };
  }

  const onTime = recent.filter((d) => Math.abs(d.deviationMs) <= FLOW_ON_TIME_TOLERANCE_MS).length;
  const rollingAccuracy = onTime / recent.length;

  return {
    isInFlow: rollingAccuracy >= FLOW_ACCURACY_THRESHOLD,
    rollingAccuracy,
    windowNoteCount: recent.length,
  };
}
