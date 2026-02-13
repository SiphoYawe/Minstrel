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
