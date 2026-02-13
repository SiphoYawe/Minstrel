import type { DifficultyParameters } from '@/features/difficulty/difficulty-types';

export interface DrillNote {
  midiNote: number;
  duration: number; // in beats
  velocity: number;
  startBeat: number;
}

export interface DrillSequence {
  notes: DrillNote[];
  chordSymbols?: string[];
  timeSignature: [number, number];
  measures: number;
}

export interface DrillSuccessCriteria {
  timingThresholdMs: number;
  accuracyTarget: number;
  tempoToleranceBpm: number;
}

export interface GeneratedDrill {
  id: string;
  targetSkill: string;
  weaknessDescription: string;
  sequence: DrillSequence;
  targetTempo: number;
  successCriteria: DrillSuccessCriteria;
  reps: number;
  instructions: string;
  difficultyLevel: DifficultyParameters;
}

export type DrillStatus = 'generated' | 'in_progress' | 'completed' | 'abandoned';

export interface DrillRecord extends GeneratedDrill {
  userId: string;
  sessionId: string | null;
  status: DrillStatus;
  createdAt: string;
  completedAt: string | null;
  results: DrillResults | null;
}

export interface DrillResults {
  avgTimingDeviationMs: number;
  accuracyAchieved: number;
  tempoAchievedBpm: number;
  repsCompleted: number;
  passed: boolean;
}

export interface DrillGenerationRequest {
  weakness: string;
  skillProfile: {
    dimensions: Record<string, { value: number; confidence: number }>;
  };
  difficultyParameters: DifficultyParameters;
  genreContext?: string;
  previousDrillDescriptions?: string[];
}

// Story 5.7: Warm-Up and Micro-Session types

export type WarmupDifficulty = 'easy' | 'moderate' | 'target';

export interface WarmupExercise {
  id: string;
  title: string;
  sequence: DrillSequence;
  targetTempo: number;
  durationSeconds: number;
  difficulty: WarmupDifficulty;
}

export interface WarmupRoutine {
  exercises: WarmupExercise[];
  totalDurationSeconds: number;
  basedOn: {
    recentKeys: string[];
    recentWeaknesses: string[];
    upcomingFocus?: string;
  };
}

export interface MicroSession {
  id: string;
  targetWeakness: string;
  warmupReps: number;
  challengeReps: number;
  cooldownReps: number;
  targetDurationSeconds: number;
  drill: GeneratedDrill;
}

export interface MicroSessionStack {
  sessions: MicroSession[];
  totalDurationSeconds: number;
  weaknessesTargeted: string[];
}

export interface SessionSummary {
  key: string | null;
  weaknesses: string[];
  avgTempo: number | null;
}

export enum DrillPhase {
  Setup = 'Setup',
  Demonstrate = 'Demonstrate',
  Listen = 'Listen',
  Attempt = 'Attempt',
  Analyze = 'Analyze',
  Complete = 'Complete',
}
