import type {
  KeyCenter,
  DetectedChord,
  GenrePattern,
  PlayingTendencies,
  AvoidancePatterns,
  InstantSnapshot,
  InsightCategory,
  SnapshotInsight,
  ChordFrequency,
} from './analysis-types';
import type { SessionType } from '@/features/session/session-types';

export interface SnapshotInput {
  currentKey: KeyCenter | null;
  detectedChords: DetectedChord[];
  timingAccuracy: number;
  currentTempo: number | null;
  detectedGenres: GenrePattern[];
  playingTendencies: PlayingTendencies | null;
  avoidancePatterns: AvoidancePatterns | null;
  sessionType: SessionType | null;
  totalNotesPlayed?: number;
}

const BANNED_WORDS = ['wrong', 'failed', 'bad', 'error'];
const MIN_NOTES_FOR_DETAILED_SNAPSHOT = 20;
const MAX_CHORD_FREQUENCIES = 3;
const MAX_INSIGHTS = 3;
const LOW_CONFIDENCE_THRESHOLD = 0.5;
const MAX_TRANSITION_GAP_MS = 5000;

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
 * Computes chord progression frequency analysis.
 * Returns the top N most common chord labels with counts.
 */
export function computeChordFrequencies(
  chords: DetectedChord[],
  limit: number = MAX_CHORD_FREQUENCIES
): ChordFrequency[] {
  const counts: Record<string, number> = {};
  for (const chord of chords) {
    const label = `${chord.root}${chord.quality === 'Major' ? '' : chord.quality === 'Minor' ? 'm' : chord.quality}`;
    counts[label] = (counts[label] || 0) + 1;
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

/**
 * Generates an instant snapshot from current analysis state.
 * Pure function — no side effects, no framework dependencies.
 *
 * Story 14.5: Enriched with multi-insight array, chord frequencies,
 * limited data indicator, and confidence markers.
 */
export function generateSnapshot(input: SnapshotInput): InstantSnapshot {
  const noteCount = input.totalNotesPlayed ?? input.detectedChords.length;
  const isLimitedData = noteCount < MIN_NOTES_FOR_DETAILED_SNAPSHOT;

  const insights = generateInsights(input);
  const chordFrequencies = computeChordFrequencies(input.detectedChords);

  // Primary insight for backward compatibility
  const primary = insights[0] ?? {
    text: 'Keep playing to build your profile',
    category: 'GENERAL' as InsightCategory,
    confidence: 0.3,
  };

  return {
    id: crypto.randomUUID(),
    key: input.currentKey,
    chordsUsed: input.detectedChords.slice(-20),
    timingAccuracy: input.timingAccuracy,
    averageTempo: input.currentTempo,
    keyInsight: applyGrowthMindset(primary.text),
    insightCategory: primary.category,
    insights: insights.map((i) => ({
      ...i,
      text: applyGrowthMindset(i.text),
    })),
    chordFrequencies,
    isLimitedData,
    genrePatterns: [...input.detectedGenres],
    timestamp: Date.now(),
  };
}

/**
 * Generates 2-3 distinct insights from available data.
 * Collects one insight per category (no duplicates), priority-ranked.
 */
export function generateInsights(input: SnapshotInput): SnapshotInsight[] {
  const noteCount = input.totalNotesPlayed ?? input.detectedChords.length;
  const isLimited = noteCount < MIN_NOTES_FOR_DETAILED_SNAPSHOT;

  if (isLimited) {
    return [
      {
        category: 'GENERAL',
        text: `Session captured ${noteCount} notes — keep playing for deeper analysis`,
        confidence: 0.3,
      },
    ];
  }

  const collected: SnapshotInsight[] = [];
  const usedCategories = new Set<InsightCategory>();

  // Collect all candidate insights, priority-ordered
  const candidates = [
    generateTimingInsight(input),
    generateHarmonicInsight(input),
    generateTendencyInsight(input),
    generateFreeformInsight(input),
    generateGeneralInsight(input),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (usedCategories.has(candidate.category) && collected.length >= 2) continue;
    usedCategories.add(candidate.category);
    collected.push(candidate);
    if (collected.length >= MAX_INSIGHTS) break;
  }

  // Ensure at least one insight
  if (collected.length === 0) {
    collected.push({
      category: 'GENERAL',
      text: 'Solid session — keep building on that foundation',
      confidence: 0.5,
    });
  }

  return collected;
}

/**
 * Selects the highest-impact insight from available data.
 * Priority: timing > harmonic > tendency > general
 * @deprecated Use generateInsights() for multi-insight support.
 */
export function generateKeyInsight(input: SnapshotInput): {
  insight: string;
  category: InsightCategory;
} {
  const insights = generateInsights(input);
  const primary = insights[0];
  return { insight: primary.text, category: primary.category };
}

function computeInsightConfidence(input: SnapshotInput, category: InsightCategory): number {
  const noteCount = input.totalNotesPlayed ?? input.detectedChords.length;
  const baseConfidence = Math.min(1, noteCount / 100);

  switch (category) {
    case 'TIMING':
      return baseConfidence * (input.currentTempo !== null ? 0.9 : 0.6);
    case 'HARMONIC':
      return (
        baseConfidence *
        (input.currentKey
          ? input.currentKey.confidence > LOW_CONFIDENCE_THRESHOLD
            ? 0.9
            : 0.5
          : 0.3)
      );
    case 'TENDENCY':
      return baseConfidence * (input.avoidancePatterns ? 0.8 : 0.3);
    case 'GENERAL':
      return baseConfidence * 0.5;
  }
}

function generateTimingInsight(input: SnapshotInput): SnapshotInsight | null {
  if (input.timingAccuracy >= 95) return null;

  const confidence = computeInsightConfidence(input, 'TIMING');

  // Check for chord transition timing patterns (requires tempo context)
  if (input.currentTempo !== null) {
    const chords = input.detectedChords;
    if (chords.length >= 4) {
      // Find the slowest transition between consecutive chords
      let slowestTransition = 0;
      let slowestPair = ['', ''];
      for (let i = 1; i < chords.length; i++) {
        const gap = chords[i].timestamp - chords[i - 1].timestamp;
        if (gap > slowestTransition && gap < MAX_TRANSITION_GAP_MS) {
          slowestTransition = gap;
          slowestPair = [
            chords[i - 1].root + chords[i - 1].quality.charAt(0).toLowerCase(),
            chords[i].root + chords[i].quality.charAt(0).toLowerCase(),
          ];
        }
      }

      if (slowestTransition > 0 && slowestPair[0] && slowestPair[1]) {
        return {
          category: 'TIMING',
          text: `Your ${slowestPair[0]} to ${slowestPair[1]} transition averages ${Math.round(slowestTransition)}ms — smoothing this would improve your flow`,
          confidence,
        };
      }
    }
  }

  // Generic timing insight with accuracy (works even without tempo)
  return {
    category: 'TIMING',
    text: `Timing consistency: getting there — ${Math.round(input.timingAccuracy)}% and climbing`,
    confidence,
  };
}

function generateHarmonicInsight(input: SnapshotInput): SnapshotInsight | null {
  if (!input.currentKey) return null;

  const confidence = computeInsightConfidence(input, 'HARMONIC');
  const keyName = `${input.currentKey.root} ${input.currentKey.mode}`;

  // Mark low-confidence keys
  if (input.currentKey.confidence < LOW_CONFIDENCE_THRESHOLD) {
    return {
      category: 'HARMONIC',
      text: `Key detection suggests ${keyName} (low confidence) — more playing will clarify`,
      confidence: confidence * 0.5,
    };
  }

  // Check chord diversity
  const uniqueRoots = new Set(input.detectedChords.map((c) => c.root));
  if (uniqueRoots.size <= 2 && input.detectedChords.length >= 4) {
    const relativeKey = input.currentKey.mode === 'major' ? 'relative minor' : 'relative major';
    return {
      category: 'HARMONIC',
      text: `You stayed in ${keyName} the entire session — try exploring the ${relativeKey}`,
      confidence,
    };
  }

  // Check chord quality diversity
  const qualities = new Set(input.detectedChords.map((c) => c.quality));
  if (qualities.size === 1 && input.detectedChords.length >= 4) {
    const currentType = input.detectedChords[0].quality;
    const suggestion = currentType === 'Major' ? 'minor or seventh' : 'major or suspended';
    return {
      category: 'HARMONIC',
      text: `Strong command of ${currentType} chords — adding ${suggestion} chords could expand your palette`,
      confidence,
    };
  }

  return null;
}

function generateTendencyInsight(input: SnapshotInput): SnapshotInsight | null {
  if (!input.avoidancePatterns) return null;

  const confidence = computeInsightConfidence(input, 'TENDENCY');

  // Avoided keys
  if (input.avoidancePatterns.avoidedKeys.length >= 5) {
    const avoidedSample = input.avoidancePatterns.avoidedKeys.slice(0, 3).join(', ');
    return {
      category: 'TENDENCY',
      text: `You favor natural keys — exploring ${avoidedSample} could open new sonic territory`,
      confidence,
    };
  }

  // Avoided chord types
  if (input.avoidancePatterns.avoidedChordTypes.length >= 3) {
    const avoidedType = input.avoidancePatterns.avoidedChordTypes[0];
    return {
      category: 'TENDENCY',
      text: `You haven't explored ${avoidedType} chords yet — they could add depth to your playing`,
      confidence,
    };
  }

  // Avoided intervals
  if (input.avoidancePatterns.avoidedIntervals.length >= 6) {
    return {
      category: 'TENDENCY',
      text: `Your melodic movement stays close — wider intervals could add expression`,
      confidence,
    };
  }

  return null;
}

function generateFreeformInsight(input: SnapshotInput): SnapshotInsight | null {
  if (!input.sessionType || input.sessionType !== 'freeform') return null;

  const confidence = computeInsightConfidence(input, 'GENERAL');

  // Count unique keys explored
  const uniqueKeys = new Set(input.detectedChords.map((c) => c.root));

  if (uniqueKeys.size >= 4) {
    return {
      category: 'GENERAL',
      text: `You explored ${uniqueKeys.size} different keys this session — your range is growing`,
      confidence,
    };
  }

  // Tempo range breadth
  if (input.playingTendencies) {
    const histogram = input.playingTendencies.tempoHistogram;
    const activeBins = histogram.filter((count) => count > 0).length;
    if (activeBins >= 3) {
      return {
        category: 'GENERAL',
        text: `Your playing spanned multiple tempo zones — you're comfortable across speeds`,
        confidence,
      };
    }
  }

  // Genre tendency
  if (input.detectedGenres.length > 0) {
    return {
      category: 'GENERAL',
      text: `Strong tendency toward ${input.detectedGenres[0].genre} patterns — your musical identity is developing`,
      confidence,
    };
  }

  return null;
}

function generateGeneralInsight(input: SnapshotInput): SnapshotInsight {
  const confidence = computeInsightConfidence(input, 'GENERAL');
  const keyStr = input.currentKey
    ? `${input.currentKey.root} ${input.currentKey.mode}`
    : 'your chosen key';
  const tempoStr = input.currentTempo !== null ? `at ${Math.round(input.currentTempo)} BPM` : '';

  const genreStr =
    input.detectedGenres.length > 0 ? ` with ${input.detectedGenres[0].genre} flavor` : '';

  return {
    category: 'GENERAL',
    text: `Solid session in ${keyStr} ${tempoStr}${genreStr} — keep building on that foundation`.trim(),
    confidence,
  };
}
