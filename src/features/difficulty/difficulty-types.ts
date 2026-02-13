import type {
  DetectedChord,
  TimingEvent,
  TempoSegment,
  GenrePattern,
  PlayingTendencies,
  AvoidancePatterns,
} from '@/features/analysis/analysis-types';

export enum SkillDimension {
  TimingAccuracy = 'TimingAccuracy',
  HarmonicComplexity = 'HarmonicComplexity',
  TechniqueRange = 'TechniqueRange',
  Speed = 'Speed',
  GenreFamiliarity = 'GenreFamiliarity',
}

export interface DimensionScore {
  value: number;
  confidence: number;
  dataPoints: number;
  lastUpdated: string;
}

export interface SkillProfile {
  userId: string | null;
  profileVersion: number;
  lastAssessedAt: string;
  dimensions: Record<SkillDimension, DimensionScore>;
}

// Story 5.2: Dynamic Difficulty Adjustment types

export interface DifficultyParameters {
  tempo: number;
  harmonicComplexity: number;
  keyDifficulty: number;
  rhythmicDensity: number;
  noteRange: number;
}

export interface DifficultyAdjustment {
  parameter: keyof DifficultyParameters;
  direction: 'increase' | 'decrease' | 'maintain';
  magnitude: number;
}

export enum GrowthZoneStatus {
  TooEasy = 'TooEasy',
  GrowthZone = 'GrowthZone',
  TooHard = 'TooHard',
}

export type AccuracyTrend = 'improving' | 'declining' | 'stable';

export interface RepPerformance {
  repNumber: number;
  accuracy: number;
  timingDeviation: number;
  completedAt: string;
}

export interface DifficultyState {
  currentParameters: DifficultyParameters;
  zoneStatus: GrowthZoneStatus;
  repHistory: RepPerformance[];
  pendingAdjustment: DifficultyAdjustment | null;
}

// Story 5.3: Progressive Overload types

export interface OverloadStrategy {
  focusDimension: SkillDimension;
  incrementScale: number;
  plateauFlags: Record<SkillDimension, boolean>;
  sessionsSinceLastRecalibration: number;
}

export interface RecalibrationResult {
  recommendedFocus: SkillDimension;
  parameterAdjustments: Partial<DifficultyParameters>;
  plateauDimensions: SkillDimension[];
  reasoning: string;
}

export const PROGRESSIVE_OVERLOAD_CONFIG = {
  MAX_INCREMENT_SCALE: 1.5,
  PLATEAU_SESSION_THRESHOLD: 3,
  PLATEAU_IMPROVEMENT_THRESHOLD: 0.02,
  RECALIBRATION_INTERVAL: 5,
  BASE_INCREMENTS: {
    tempo: 3,
    harmonicComplexity: 0.03,
    keyDifficulty: 0.05,
    rhythmicDensity: 0.03,
    noteRange: 0.02,
  } as Record<keyof DifficultyParameters, number>,
} as const;

export interface SessionPerformanceData {
  timingEvents: TimingEvent[];
  tempoSegments: TempoSegment[];
  detectedChords: DetectedChord[];
  genrePatterns: GenrePattern[];
  playingTendencies: PlayingTendencies | null;
  avoidancePatterns: AvoidancePatterns | null;
  noteCount: number;
  uniqueNoteRange: number; // semitones between lowest and highest note
  maxCleanTempoBpm: number | null; // highest tempo where timing accuracy > threshold
  timingAccuracy: number; // 0-100
}
