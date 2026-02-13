import {
  SkillDimension,
  type DimensionScore,
  type SkillProfile,
  type SessionPerformanceData,
} from './difficulty-types';

const CONFIDENCE_RATE = 10;
const DEFAULT_ALPHA = 0.3;
const PROFILE_VERSION = 1;

// Max clean tempo normalization bounds
const TEMPO_MIN = 40;
const TEMPO_MAX = 220;

// Chord complexity weights
const CHORD_COMPLEXITY: Record<string, number> = {
  Major: 0.2,
  Minor: 0.25,
  Sus2: 0.3,
  Sus4: 0.3,
  Dominant7: 0.5,
  Minor7: 0.55,
  Major7: 0.6,
  Diminished: 0.7,
  Augmented: 0.75,
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function calculateConfidence(dataPoints: number): number {
  return 1 - Math.exp(-dataPoints / CONFIDENCE_RATE);
}

export function assessTimingAccuracy(data: SessionPerformanceData): number {
  if (data.timingEvents.length === 0) return 0;
  // timingAccuracy is 0-100, normalize to 0-1
  return clamp(data.timingAccuracy / 100);
}

export function assessHarmonicComplexity(data: SessionPerformanceData): number {
  if (data.detectedChords.length === 0) return 0;

  const qualityScores = data.detectedChords.map((c) => CHORD_COMPLEXITY[c.quality] ?? 0.2);
  const avgComplexity = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;

  // Bonus for variety of chord types
  const uniqueQualities = new Set(data.detectedChords.map((c) => c.quality));
  const varietyBonus = Math.min(uniqueQualities.size * 0.05, 0.2);

  return clamp(avgComplexity + varietyBonus);
}

export function assessTechniqueRange(data: SessionPerformanceData): number {
  if (data.noteCount === 0) return 0;

  // Score based on note range (semitones)
  const rangeScore = clamp(data.uniqueNoteRange / 48); // 4 octaves = full score

  // Score based on chord type diversity
  const uniqueChordTypes = new Set(data.detectedChords.map((c) => c.quality));
  const chordDiversity = clamp(uniqueChordTypes.size / 6); // 6 types = full score

  // Score based on interval variety from tendencies
  let intervalDiversity = 0;
  if (data.playingTendencies) {
    const intervals = Object.keys(data.playingTendencies.intervalDistribution);
    intervalDiversity = clamp(intervals.length / 8); // 8 unique intervals = full score
  }

  return clamp((rangeScore + chordDiversity + intervalDiversity) / 3);
}

export function assessSpeed(data: SessionPerformanceData): number {
  if (data.maxCleanTempoBpm === null || data.maxCleanTempoBpm <= TEMPO_MIN) return 0;
  return clamp((data.maxCleanTempoBpm - TEMPO_MIN) / (TEMPO_MAX - TEMPO_MIN));
}

export function assessGenreFamiliarity(data: SessionPerformanceData): number {
  if (data.genrePatterns.length === 0) return 0;

  // Highest genre confidence
  const maxConfidence = Math.max(...data.genrePatterns.map((g) => g.confidence));

  // Variety bonus for multi-genre exposure
  const genreCount = data.genrePatterns.filter((g) => g.confidence > 0.2).length;
  const varietyBonus = Math.min(genreCount * 0.1, 0.2);

  return clamp(maxConfidence * 0.8 + varietyBonus);
}

export function createSkillProfile(
  data: SessionPerformanceData,
  userId: string | null = null
): SkillProfile {
  const now = new Date().toISOString();
  const totalDataPoints = data.noteCount + data.detectedChords.length + data.timingEvents.length;

  function makeDimension(value: number): DimensionScore {
    return {
      value: clamp(value),
      confidence: calculateConfidence(totalDataPoints),
      dataPoints: totalDataPoints,
      lastUpdated: now,
    };
  }

  return {
    userId,
    profileVersion: PROFILE_VERSION,
    lastAssessedAt: now,
    dimensions: {
      [SkillDimension.TimingAccuracy]: makeDimension(assessTimingAccuracy(data)),
      [SkillDimension.HarmonicComplexity]: makeDimension(assessHarmonicComplexity(data)),
      [SkillDimension.TechniqueRange]: makeDimension(assessTechniqueRange(data)),
      [SkillDimension.Speed]: makeDimension(assessSpeed(data)),
      [SkillDimension.GenreFamiliarity]: makeDimension(assessGenreFamiliarity(data)),
    },
  };
}

export function blendProfiles(
  existing: SkillProfile,
  newSession: SkillProfile,
  alpha: number = DEFAULT_ALPHA
): SkillProfile {
  const now = new Date().toISOString();
  const blended: Record<SkillDimension, DimensionScore> = {} as Record<
    SkillDimension,
    DimensionScore
  >;

  for (const dim of Object.values(SkillDimension)) {
    const e = existing.dimensions[dim];
    const n = newSession.dimensions[dim];
    const combinedDataPoints = e.dataPoints + n.dataPoints;

    blended[dim] = {
      value: clamp(alpha * n.value + (1 - alpha) * e.value),
      confidence: calculateConfidence(combinedDataPoints),
      dataPoints: combinedDataPoints,
      lastUpdated: now,
    };
  }

  return {
    userId: existing.userId ?? newSession.userId,
    profileVersion: PROFILE_VERSION,
    lastAssessedAt: now,
    dimensions: blended,
  };
}

export function updateConfidence(existing: DimensionScore, newDataPoints: number): DimensionScore {
  const totalPoints = existing.dataPoints + newDataPoints;
  return {
    ...existing,
    confidence: calculateConfidence(totalPoints),
    dataPoints: totalPoints,
    lastUpdated: new Date().toISOString(),
  };
}
