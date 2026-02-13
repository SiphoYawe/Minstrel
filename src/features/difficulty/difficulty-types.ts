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
