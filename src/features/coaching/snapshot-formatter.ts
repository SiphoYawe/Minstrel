import type { InstantSnapshot } from '@/features/analysis/analysis-types';

/**
 * Format snapshot data into structured prompt text for AI context.
 */
export function formatSnapshotsForPrompt(
  snapshots: InstantSnapshot[],
  sessionStartTimestamp: number | null
): string {
  if (snapshots.length === 0) {
    return 'No session snapshots yet.';
  }

  const lines: string[] = [];
  const recent = snapshots.slice(-3);

  for (const snap of recent) {
    const relTime =
      sessionStartTimestamp !== null
        ? formatRelativeTime(snap.timestamp - sessionStartTimestamp)
        : formatRelativeTime(0);

    const keyLabel = snap.key ? `${snap.key.root} ${snap.key.mode}` : 'Unknown';
    const tempo = snap.averageTempo ? `${Math.round(snap.averageTempo)} BPM` : 'N/A';

    lines.push(
      `[${relTime}] Key: ${keyLabel}, Timing: ${Math.round(snap.timingAccuracy)}%, Tempo: ${tempo}, Insight: "${snap.keyInsight}"`
    );
  }

  // Add trajectory summary if multiple snapshots
  if (snapshots.length >= 2) {
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const timingDelta = last.timingAccuracy - first.timingAccuracy;
    const direction = timingDelta > 0 ? 'improving' : timingDelta < 0 ? 'declining' : 'stable';
    lines.push(
      `Timing accuracy trajectory: ${Math.round(first.timingAccuracy)}% -> ${Math.round(last.timingAccuracy)}% (${direction})`
    );
  } else {
    lines.push('Only one snapshot available — play more for trend analysis.');
  }

  return lines.join('\n');
}

function formatRelativeTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
