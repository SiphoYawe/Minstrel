/**
 * Drill Tracking & Improvement Measurement — Layer 3 Domain Logic
 *
 * Measures user performance against drill targets, calculates improvement
 * deltas across reps, generates key insights after freeform play, and
 * persists drill results.
 */

import type { MidiEvent } from '@/features/midi/midi-types';
import type { DrillNote } from './drill-types';
import type {
  RepPerformance,
  SessionPerformanceData,
} from '@/features/difficulty/difficulty-types';
import type { StoredDrillRecord, SyncStatus } from '@/lib/dexie/db';
import type { DrillStatus } from './drill-types';

// --- Types ---

export interface DrillRepResult {
  repNumber: number;
  accuracy: number;
  timingDeviationMs: number;
  notesCorrect: number;
  notesTotal: number;
  tempoAchievedBpm: number | null;
  completedAt: string;
}

export interface ImprovementDelta {
  timingTrend: number[];
  accuracyTrend: number[];
  overallImprovement: number | null;
  trend: 'improving' | 'declining' | 'stable';
}

export interface KeyInsight {
  weakness: string;
  description: string;
  metric: string;
  currentValue: number;
  potentialImprovement: string;
  canGenerateDrill: boolean;
}

// --- Constants ---

/** Timing window in ms: a user note within this range of the target counts as correct. */
export const TIMING_WINDOW_MS = 100;

/** Growth mindset messages — never "failed", "wrong", or "error". */
export const DRILL_MESSAGES = {
  IMPROVING: 'Closing in',
  STABLE: 'Building consistency',
  FIRST_REP: 'Setting your baseline',
  COMPLETE: 'Solid progress',
  DECLINING: 'Hang in there',
} as const;

// --- Core Measurement ---

/**
 * Compare a user's played notes against the drill's target notes.
 *
 * @param userNotes - note-on MidiEvents captured during the attempt
 * @param drillNotes - target notes from the drill sequence
 * @param targetTempo - BPM of the drill
 * @param attemptStartMs - timestamp (performance.now) when attempt began
 * @param repNumber - current rep number (1-indexed)
 */
export function comparePerformance(
  userNotes: MidiEvent[],
  drillNotes: DrillNote[],
  targetTempo: number,
  attemptStartMs: number,
  repNumber: number
): DrillRepResult {
  const noteOnEvents = userNotes.filter((e) => e.type === 'note-on');
  const timing = measureTimingAccuracy(noteOnEvents, drillNotes, targetTempo, attemptStartMs);
  const noteAcc = measureNoteAccuracy(noteOnEvents, drillNotes, targetTempo, attemptStartMs);
  const tempoResult = measureTempoAdherence(noteOnEvents, targetTempo);

  return {
    repNumber,
    accuracy: noteAcc.accuracyPercent,
    timingDeviationMs: timing.avgDeviationMs,
    notesCorrect: noteAcc.correct,
    notesTotal: noteAcc.total,
    tempoAchievedBpm: tempoResult.actualBpm,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Calculate average timing deviation between user notes and target notes.
 */
export function measureTimingAccuracy(
  userNotes: MidiEvent[],
  drillNotes: DrillNote[],
  targetTempo: number,
  attemptStartMs: number
): { avgDeviationMs: number; perNoteDeviations: number[] } {
  const beatMs = 60000 / targetTempo;
  const deviations: number[] = [];

  for (const target of drillNotes) {
    const targetTimeMs = attemptStartMs + target.startBeat * beatMs;
    const match = findMatchingNote(userNotes, target.midiNote, targetTimeMs);
    if (match) {
      deviations.push(Math.abs(match.timestamp - targetTimeMs));
    }
  }

  const avgDeviationMs =
    deviations.length > 0 ? deviations.reduce((a, b) => a + b, 0) / deviations.length : 0;

  return { avgDeviationMs, perNoteDeviations: deviations };
}

/**
 * Count how many target notes the user played correctly (right pitch within timing window).
 */
export function measureNoteAccuracy(
  userNotes: MidiEvent[],
  drillNotes: DrillNote[],
  targetTempo: number,
  attemptStartMs: number
): { correct: number; total: number; accuracyPercent: number } {
  const beatMs = 60000 / targetTempo;
  let correct = 0;
  const total = drillNotes.length;

  for (const target of drillNotes) {
    const targetTimeMs = attemptStartMs + target.startBeat * beatMs;
    const match = findMatchingNote(userNotes, target.midiNote, targetTimeMs);
    if (match) correct++;
  }

  return {
    correct,
    total,
    accuracyPercent: total > 0 ? correct / total : 0,
  };
}

/**
 * Calculate actual tempo from user's note intervals and compare to target.
 */
export function measureTempoAdherence(
  userNotes: MidiEvent[],
  targetTempo: number
): { actualBpm: number | null; deviationBpm: number | null } {
  if (userNotes.length < 2) {
    return { actualBpm: null, deviationBpm: null };
  }

  const sorted = [...userNotes].sort((a, b) => a.timestamp - b.timestamp);
  let totalInterval = 0;
  let intervals = 0;

  for (let i = 1; i < sorted.length; i++) {
    const interval = sorted[i].timestamp - sorted[i - 1].timestamp;
    if (interval > 0 && interval < 5000) {
      totalInterval += interval;
      intervals++;
    }
  }

  if (intervals === 0) {
    return { actualBpm: null, deviationBpm: null };
  }

  const avgIntervalMs = totalInterval / intervals;
  const actualBpm = 60000 / avgIntervalMs;

  return {
    actualBpm: Math.round(actualBpm * 10) / 10,
    deviationBpm: Math.round(Math.abs(actualBpm - targetTempo) * 10) / 10,
  };
}

/**
 * Find the closest user note matching the target pitch within the timing window.
 */
function findMatchingNote(
  userNotes: MidiEvent[],
  targetPitch: number,
  targetTimeMs: number
): MidiEvent | null {
  let bestMatch: MidiEvent | null = null;
  let bestDistance = Infinity;

  for (const n of userNotes) {
    if (n.note !== targetPitch) continue;
    const distance = Math.abs(n.timestamp - targetTimeMs);
    if (distance <= TIMING_WINDOW_MS && distance < bestDistance) {
      bestMatch = n;
      bestDistance = distance;
    }
  }

  return bestMatch;
}

// --- Improvement Delta ---

/**
 * Calculate improvement delta across a sequence of rep results.
 */
export function calculateImprovementDelta(repHistory: DrillRepResult[]): ImprovementDelta {
  const timingTrend = repHistory.map((r) => r.timingDeviationMs);
  const accuracyTrend = repHistory.map((r) => r.accuracy);

  if (repHistory.length < 2) {
    return { timingTrend, accuracyTrend, overallImprovement: null, trend: 'stable' };
  }

  const firstAccuracy = accuracyTrend[0];
  const lastAccuracy = accuracyTrend[accuracyTrend.length - 1];
  const improvement = lastAccuracy - firstAccuracy;

  let trend: 'improving' | 'declining' | 'stable';
  if (improvement > 0.05) {
    trend = 'improving';
  } else if (improvement < -0.05) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  const overallImprovement =
    firstAccuracy > 0 ? ((lastAccuracy - firstAccuracy) / firstAccuracy) * 100 : null;

  return { timingTrend, accuracyTrend, overallImprovement, trend };
}

// --- Formatting ---

/**
 * Format timing values across reps as "400ms -> 280ms -> 180ms".
 */
export function formatTimingDelta(repHistory: DrillRepResult[]): string {
  return repHistory.map((r) => `${Math.round(r.timingDeviationMs)}ms`).join(' \u2192 ');
}

/**
 * Format accuracy values across reps as "65% -> 78% -> 88%".
 */
export function formatAccuracyDelta(repHistory: DrillRepResult[]): string {
  return repHistory.map((r) => `${Math.round(r.accuracy * 100)}%`).join(' \u2192 ');
}

/**
 * Format overall improvement as "42%" (positive) or "-12%" (negative).
 */
export function formatImprovementPercent(first: number, last: number): string | null {
  if (first === 0) return null;
  const improvement = ((last - first) / first) * 100;
  const rounded = Math.round(improvement);
  return rounded >= 0 ? `\u2191 ${rounded}%` : `\u2193 ${Math.abs(rounded)}%`;
}

/**
 * Get the appropriate growth mindset message for the current improvement state.
 */
export function getDrillMessage(
  repHistory: DrillRepResult[]
): (typeof DRILL_MESSAGES)[keyof typeof DRILL_MESSAGES] {
  if (repHistory.length === 0) return DRILL_MESSAGES.FIRST_REP;
  if (repHistory.length === 1) return DRILL_MESSAGES.FIRST_REP;

  const delta = calculateImprovementDelta(repHistory);
  switch (delta.trend) {
    case 'improving':
      return DRILL_MESSAGES.IMPROVING;
    case 'declining':
      return DRILL_MESSAGES.DECLINING;
    case 'stable':
      return DRILL_MESSAGES.STABLE;
  }
}

// --- Key Insight Generation ---

/**
 * Analyze freeform play data to find the single highest-impact area for improvement.
 * Returns a specific, actionable insight with growth mindset framing.
 */
export function generateKeyInsight(sessionData: SessionPerformanceData): KeyInsight | null {
  const insights: Array<KeyInsight & { impact: number }> = [];

  // Check chord transitions (slowest transition pair)
  if (sessionData.detectedChords.length >= 2) {
    const transitions = analyzeChordTransitions(sessionData.detectedChords);
    if (transitions) {
      insights.push({ ...transitions, impact: transitions.currentValue * 2 });
    }
  }

  // Check timing accuracy
  if (sessionData.timingAccuracy < 80 && sessionData.timingEvents.length > 0) {
    const avgDeviation =
      sessionData.timingEvents.reduce((sum, e) => sum + Math.abs(e.deviationMs), 0) /
      sessionData.timingEvents.length;
    insights.push({
      weakness: 'Timing consistency',
      description: `Your timing averages ${Math.round(avgDeviation)}ms off the beat \u2014 a focused timing drill could tighten that up`,
      metric: 'timing deviation',
      currentValue: avgDeviation,
      potentialImprovement: 'A targeted drill could halve your timing deviation',
      canGenerateDrill: true,
      impact: avgDeviation * 1.5,
    });
  }

  // Check avoidance patterns
  if (sessionData.avoidancePatterns) {
    const { avoidedKeys, avoidedChordTypes } = sessionData.avoidancePatterns;
    if (avoidedKeys && avoidedKeys.length > 0) {
      insights.push({
        weakness: `Unfamiliar keys`,
        description: `You\u2019re staying away from ${avoidedKeys[0]} \u2014 exploring it with a drill could open new territory`,
        metric: 'key avoidance',
        currentValue: avoidedKeys.length,
        potentialImprovement: 'Building comfort in new keys expands your musical range',
        canGenerateDrill: true,
        impact: avoidedKeys.length * 30,
      });
    }
    if (avoidedChordTypes && avoidedChordTypes.length > 0) {
      insights.push({
        weakness: `Chord type gaps`,
        description: `${avoidedChordTypes[0]} chords haven\u2019t appeared yet \u2014 a drill could help build familiarity`,
        metric: 'chord type avoidance',
        currentValue: avoidedChordTypes.length,
        potentialImprovement: 'Exploring varied chord types builds harmonic vocabulary',
        canGenerateDrill: true,
        impact: avoidedChordTypes.length * 25,
      });
    }
  }

  // Check tempo ceiling
  if (sessionData.maxCleanTempoBpm !== null && sessionData.maxCleanTempoBpm < 120) {
    insights.push({
      weakness: 'Speed ceiling',
      description: `Your timing stays clean up to ${sessionData.maxCleanTempoBpm} BPM \u2014 a progressive tempo drill could push that higher`,
      metric: 'max clean tempo',
      currentValue: sessionData.maxCleanTempoBpm,
      potentialImprovement: 'Gradual tempo increases build speed without sacrificing accuracy',
      canGenerateDrill: true,
      impact: (120 - sessionData.maxCleanTempoBpm) * 1.2,
    });
  }

  if (insights.length === 0) return null;

  // Return highest-impact insight
  insights.sort((a, b) => b.impact - a.impact);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { impact, ...best } = insights[0];
  return best;
}

/**
 * Analyze chord transition speeds from detected chords.
 * Returns an insight about the slowest transition pair.
 */
function analyzeChordTransitions(
  chords: SessionPerformanceData['detectedChords']
): KeyInsight | null {
  if (chords.length < 2) return null;

  let slowestTransitionMs = 0;
  let slowestPair = '';

  for (let i = 1; i < chords.length; i++) {
    const gap = chords[i].timestamp - chords[i - 1].timestamp;
    if (gap > slowestTransitionMs && gap < 10000) {
      slowestTransitionMs = gap;
      slowestPair = `${chords[i - 1].root}${chords[i - 1].quality === 'Minor' ? 'm' : ''} to ${chords[i].root}${chords[i].quality === 'Minor' ? 'm' : ''}`;
    }
  }

  if (slowestTransitionMs < 200) return null;

  return {
    weakness: 'Chord transitions',
    description: `Your ${slowestPair} transition averages ${Math.round(slowestTransitionMs)}ms \u2014 a targeted drill could cut that in half`,
    metric: 'transition speed',
    currentValue: slowestTransitionMs,
    potentialImprovement: 'Focused repetition builds muscle memory for smooth transitions',
    canGenerateDrill: true,
  };
}

// --- Conversion ---

/**
 * Convert a DrillRepResult to the RepPerformance type expected by the Difficulty Engine.
 */
export function toRepPerformance(result: DrillRepResult): RepPerformance {
  return {
    repNumber: result.repNumber,
    accuracy: result.accuracy,
    timingDeviation: result.timingDeviationMs,
    completedAt: result.completedAt,
  };
}

// --- Persistence ---

/**
 * Save drill results to Dexie local storage.
 */
export async function saveDrillResults(
  drillId: string,
  userId: string,
  repHistory: DrillRepResult[],
  status: DrillStatus
): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { db } = await import('@/lib/dexie/db');
  if (!db) return;

  const record = await db.drillRecords.where('drillId').equals(drillId).first();
  if (!record) return;

  const results = {
    avgTimingDeviationMs:
      repHistory.length > 0
        ? repHistory.reduce((s, r) => s + r.timingDeviationMs, 0) / repHistory.length
        : 0,
    accuracyAchieved:
      repHistory.length > 0
        ? repHistory.reduce((s, r) => s + r.accuracy, 0) / repHistory.length
        : 0,
    tempoAchievedBpm: repHistory.find((r) => r.tempoAchievedBpm !== null)?.tempoAchievedBpm ?? 0,
    repsCompleted: repHistory.length,
    passed: repHistory.length > 0 && repHistory[repHistory.length - 1].accuracy >= 0.8,
    repDetails: repHistory,
  };

  await db.drillRecords.update(record.id!, {
    status,
    completedAt: new Date().toISOString(),
    results,
    syncStatus: 'pending' as SyncStatus,
  });
}

/**
 * Save a new drill record to Dexie local storage when a drill is generated.
 */
export async function createDrillRecord(
  drill: {
    id: string;
    targetSkill: string;
    weaknessDescription: string;
    sequence: Record<string, unknown>;
    targetTempo: number;
    successCriteria: Record<string, unknown>;
    reps: number;
    instructions: string;
    difficultyLevel: Record<string, number>;
  },
  userId: string,
  sessionId: string | null
): Promise<void> {
  const { db } = await import('@/lib/dexie/db');
  if (!db) return;

  const record: StoredDrillRecord = {
    drillId: drill.id,
    userId,
    sessionId,
    targetSkill: drill.targetSkill,
    weaknessDescription: drill.weaknessDescription,
    drillData: {
      sequence: drill.sequence,
      targetTempo: drill.targetTempo,
      successCriteria: drill.successCriteria,
      reps: drill.reps,
      instructions: drill.instructions,
    },
    difficultyParameters: drill.difficultyLevel,
    status: 'generated',
    createdAt: new Date().toISOString(),
    completedAt: null,
    results: null,
    syncStatus: 'pending',
  };

  await db.drillRecords.add(record);
}
