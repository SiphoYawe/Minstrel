/**
 * Warm-Up Flow Orchestrator — Layer 2 Application Logic (Story 10.7)
 *
 * Coordinates the warm-up experience: generation, exercise tracking,
 * progress updates, and transition to freeform play.
 */

import { generateWarmup } from './warmup-generator';
import { buildWarmupContext } from './continuity-service';
import { useSessionStore } from '@/stores/session-store';
import type { WarmupRoutine } from '@/features/drills/drill-types';
import type { ContinuitySessionSummary } from './session-types';

export interface WarmUpFlowState {
  currentExercise: number;
  totalExercises: number;
  isGenerating: boolean;
  isComplete: boolean;
  routine: WarmupRoutine | null;
}

/**
 * Start a warm-up session.
 * Generates exercises from skill profile and recent session data,
 * then writes the routine into the session store.
 */
export function startWarmUp(): void {
  const state = useSessionStore.getState();
  const { skillProfile, recentSessions } = state;

  // Signal that generation is in progress
  useSessionStore.setState({
    isWarmingUp: true,
    currentWarmupExercise: 0,
    sessionType: 'warmup',
  });

  // Build warmup context from recent sessions
  const warmupCtx = buildWarmupContext(recentSessions);

  // Convert ContinuitySessionSummary[] to SessionSummary[] for the generator
  const sessionSummaries = recentSessions.map(toSessionSummary);

  const routine = generateWarmup(skillProfile, sessionSummaries, undefined, warmupCtx);

  useSessionStore.setState({
    warmupRoutine: routine,
    currentWarmupExercise: 0,
  });
}

/**
 * Advance to the next exercise in the warm-up routine.
 * Returns true if there are more exercises, false if warm-up is complete.
 */
export function advanceWarmUpExercise(): boolean {
  const state = useSessionStore.getState();
  const routine = state.warmupRoutine;
  if (!routine) return false;

  const next = state.currentWarmupExercise + 1;
  if (next >= routine.exercises.length) {
    onWarmUpComplete();
    return false;
  }

  useSessionStore.setState({ currentWarmupExercise: next });
  return true;
}

/**
 * Called when the warm-up is finished (all exercises done or user skips).
 * Transitions the session to freeform mode.
 */
export function onWarmUpComplete(): void {
  useSessionStore.setState({
    isWarmingUp: false,
    currentWarmupExercise: 0,
    warmupRoutine: null,
    sessionType: 'freeform',
  });
}

/**
 * Skip the warm-up entirely and go straight to freeform.
 */
export function skipWarmUp(): void {
  onWarmUpComplete();
}

/**
 * Read the current warm-up flow state from the session store.
 */
export function getWarmUpFlowState(): WarmUpFlowState {
  const state = useSessionStore.getState();
  const routine = state.warmupRoutine;

  return {
    currentExercise: state.currentWarmupExercise,
    totalExercises: routine?.exercises.length ?? 0,
    isGenerating: state.isWarmingUp && !routine,
    isComplete: !state.isWarmingUp && routine === null && state.sessionType === 'freeform',
    routine,
  };
}

/**
 * Compute how many days since the last session.
 */
export function daysSinceLastSession(sessions: ContinuitySessionSummary[]): number | null {
  if (sessions.length === 0) return null;
  const lastDate = new Date(sessions[0].date);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Internal helper — convert ContinuitySessionSummary to the simpler SessionSummary
function toSessionSummary(s: ContinuitySessionSummary) {
  return {
    key: s.detectedKey,
    weaknesses: s.weaknessAreas,
    avgTempo: s.averageTempo,
  };
}
