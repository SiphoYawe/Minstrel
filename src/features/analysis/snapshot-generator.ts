import type {
  KeyCenter,
  DetectedChord,
  GenrePattern,
  PlayingTendencies,
  AvoidancePatterns,
  InstantSnapshot,
  InsightCategory,
} from './analysis-types';

export interface SnapshotInput {
  currentKey: KeyCenter | null;
  detectedChords: DetectedChord[];
  timingAccuracy: number;
  currentTempo: number | null;
  detectedGenres: GenrePattern[];
  playingTendencies: PlayingTendencies | null;
  avoidancePatterns: AvoidancePatterns | null;
}

const BANNED_WORDS = ['wrong', 'failed', 'bad', 'error'];

/**
 * Applies growth mindset language to a string.
 * Replaces negative framing with constructive alternatives.
 */
export function applyGrowthMindset(text: string): string {
  const replacements: Record<string, string> = {
    wrong: 'not yet there',
    failed: 'in progress',
    bad: 'developing',
    error: 'opportunity',
  };

  let result = text;
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const replacement = replacements[word];
    result = result.replace(regex, (matched) => {
      if (matched[0] === matched[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }
  return result;
}

/**
 * Generates an instant snapshot from current analysis state.
 * Pure function — no side effects, no framework dependencies.
 */
export function generateSnapshot(input: SnapshotInput): InstantSnapshot {
  const { insight, category } = generateKeyInsight(input);

  return {
    id: crypto.randomUUID(),
    key: input.currentKey,
    chordsUsed: input.detectedChords.slice(-20),
    timingAccuracy: input.timingAccuracy,
    averageTempo: input.currentTempo,
    keyInsight: applyGrowthMindset(insight),
    insightCategory: category,
    genrePatterns: [...input.detectedGenres],
    timestamp: Date.now(),
  };
}

/**
 * Selects the highest-impact insight from available data.
 * Priority: timing > harmonic > tendency > general
 */
export function generateKeyInsight(input: SnapshotInput): {
  insight: string;
  category: InsightCategory;
} {
  // 1. Timing weakness (most actionable)
  const timingInsight = generateTimingInsight(input);
  if (timingInsight) return timingInsight;

  // 2. Harmonic observation
  const harmonicInsight = generateHarmonicInsight(input);
  if (harmonicInsight) return harmonicInsight;

  // 3. Tendency observation
  const tendencyInsight = generateTendencyInsight(input);
  if (tendencyInsight) return tendencyInsight;

  // 4. General encouragement (fallback)
  return generateGeneralInsight(input);
}

function generateTimingInsight(
  input: SnapshotInput
): { insight: string; category: InsightCategory } | null {
  if (input.timingAccuracy >= 95) return null;

  // Check for chord transition timing patterns (requires tempo context)
  if (input.currentTempo !== null) {
    const chords = input.detectedChords;
    if (chords.length >= 4) {
      // Find the slowest transition between consecutive chords
      let slowestTransition = 0;
      let slowestPair = ['', ''];
      for (let i = 1; i < chords.length; i++) {
        const gap = chords[i].timestamp - chords[i - 1].timestamp;
        if (gap > slowestTransition && gap < 5000) {
          slowestTransition = gap;
          slowestPair = [
            chords[i - 1].root + chords[i - 1].quality.charAt(0).toLowerCase(),
            chords[i].root + chords[i].quality.charAt(0).toLowerCase(),
          ];
        }
      }

      if (slowestTransition > 0 && slowestPair[0] && slowestPair[1]) {
        return {
          insight: `Your ${slowestPair[0]} to ${slowestPair[1]} transition averages ${Math.round(slowestTransition)}ms — smoothing this would improve your flow`,
          category: 'TIMING',
        };
      }
    }
  }

  // Generic timing insight with accuracy (works even without tempo)
  return {
    insight: `Timing consistency: getting there — ${Math.round(input.timingAccuracy)}% and climbing`,
    category: 'TIMING',
  };
}

function generateHarmonicInsight(
  input: SnapshotInput
): { insight: string; category: InsightCategory } | null {
  if (!input.currentKey) return null;

  const keyName = `${input.currentKey.root} ${input.currentKey.mode}`;

  // Check chord diversity
  const uniqueRoots = new Set(input.detectedChords.map((c) => c.root));
  if (uniqueRoots.size <= 2 && input.detectedChords.length >= 4) {
    const relativeKey = input.currentKey.mode === 'major' ? 'relative minor' : 'relative major';
    return {
      insight: `You stayed in ${keyName} the entire session — try exploring the ${relativeKey}`,
      category: 'HARMONIC',
    };
  }

  // Check chord quality diversity
  const qualities = new Set(input.detectedChords.map((c) => c.quality));
  if (qualities.size === 1 && input.detectedChords.length >= 4) {
    const currentType = input.detectedChords[0].quality;
    const suggestion = currentType === 'Major' ? 'minor or seventh' : 'major or suspended';
    return {
      insight: `Strong command of ${currentType} chords — adding ${suggestion} chords could expand your palette`,
      category: 'HARMONIC',
    };
  }

  return null;
}

function generateTendencyInsight(
  input: SnapshotInput
): { insight: string; category: InsightCategory } | null {
  if (!input.avoidancePatterns) return null;

  // Avoided keys
  if (input.avoidancePatterns.avoidedKeys.length >= 5) {
    const avoidedSample = input.avoidancePatterns.avoidedKeys.slice(0, 3).join(', ');
    return {
      insight: `You favor natural keys — exploring ${avoidedSample} could open new sonic territory`,
      category: 'TENDENCY',
    };
  }

  // Avoided chord types
  if (input.avoidancePatterns.avoidedChordTypes.length >= 3) {
    const avoidedType = input.avoidancePatterns.avoidedChordTypes[0];
    return {
      insight: `You haven't explored ${avoidedType} chords yet — they could add depth to your playing`,
      category: 'TENDENCY',
    };
  }

  // Avoided intervals
  if (input.avoidancePatterns.avoidedIntervals.length >= 6) {
    return {
      insight: `Your melodic movement stays close — wider intervals could add expression`,
      category: 'TENDENCY',
    };
  }

  return null;
}

function generateGeneralInsight(input: SnapshotInput): {
  insight: string;
  category: InsightCategory;
} {
  const keyStr = input.currentKey
    ? `${input.currentKey.root} ${input.currentKey.mode}`
    : 'your chosen key';
  const tempoStr = input.currentTempo !== null ? `at ${Math.round(input.currentTempo)} BPM` : '';

  const genreStr =
    input.detectedGenres.length > 0 ? ` with ${input.detectedGenres[0].genre} flavor` : '';

  return {
    insight:
      `Solid session in ${keyStr} ${tempoStr}${genreStr} — keep building on that foundation`.trim(),
    category: 'GENERAL',
  };
}
