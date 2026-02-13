import type { PlayingTendencies, AvoidancePatterns } from '@/features/analysis/analysis-types';

/**
 * Format tendency data into human-readable prompt text for AI context.
 */
export function formatTendenciesForPrompt(
  tendencies: PlayingTendencies | null,
  avoidances: AvoidancePatterns | null
): string {
  if (!tendencies && !avoidances) {
    return 'Not enough session data for tendency analysis yet.';
  }

  const lines: string[] = [];

  if (tendencies) {
    // Comfort zones
    const topKeys = Object.entries(tendencies.keyDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    if (topKeys.length > 0) {
      const total = Object.values(tendencies.keyDistribution).reduce((s, v) => s + v, 0);
      const formatted = topKeys
        .map(([key, count]) => `${key} (${total > 0 ? Math.round((count / total) * 100) : 0}%)`)
        .join(', ');
      lines.push(`Most played keys: ${formatted}`);
    }

    const topChordTypes = Object.entries(tendencies.chordTypeDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    if (topChordTypes.length > 0) {
      const total = Object.values(tendencies.chordTypeDistribution).reduce((s, v) => s + v, 0);
      const formatted = topChordTypes
        .map(([type, count]) => `${type} (${total > 0 ? Math.round((count / total) * 100) : 0}%)`)
        .join(', ');
      lines.push(`Most played chord types: ${formatted}`);
    }

    if (tendencies.tempoHistogram.length > 0) {
      const min = Math.min(...tendencies.tempoHistogram);
      const max = Math.max(...tendencies.tempoHistogram);
      const avg = Math.round(
        tendencies.tempoHistogram.reduce((s, v) => s + v, 0) / tendencies.tempoHistogram.length
      );
      lines.push(`Tempo range: ${min}-${max} BPM (average ${avg} BPM)`);
    }
  }

  if (avoidances) {
    if (avoidances.avoidedKeys.length > 0) {
      lines.push(`Avoided keys: ${avoidances.avoidedKeys.join(', ')}`);
    }
    if (avoidances.avoidedChordTypes.length > 0) {
      lines.push(`Avoided chord types: ${avoidances.avoidedChordTypes.join(', ')}`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'Not enough session data for tendency analysis yet.';
}
