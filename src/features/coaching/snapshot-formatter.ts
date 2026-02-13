import type { InstantSnapshot } from '@/features/analysis/analysis-types';

/**
 * Format snapshot data into structured prompt text for AI context.
 * Story 14.5: Include multi-insight array and chord frequencies.
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

    // Use enriched insights when available, fall back to keyInsight
    const insightTexts =
      snap.insights && snap.insights.length > 0
        ? snap.insights.map((i) => i.text)
        : [snap.keyInsight];

    lines.push(
      `[${relTime}] Key: ${keyLabel}, Timing: ${Math.round(snap.timingAccuracy)}%, Tempo: ${tempo}${snap.isLimitedData ? ' (limited data)' : ''}`
    );

    for (const text of insightTexts) {
      lines.push(`  Insight: "${text}"`);
    }

    // Include chord frequencies
    if (snap.chordFrequencies && snap.chordFrequencies.length > 0) {
      const freqStr = snap.chordFrequencies.map((cf) => `${cf.label}(×${cf.count})`).join(', ');
      lines.push(`  Top chords: ${freqStr}`);
    }
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
