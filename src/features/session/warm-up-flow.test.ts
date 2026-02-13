import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '@/stores/session-store';
import {
  startWarmUp,
  advanceWarmUpExercise,
  onWarmUpComplete,
  skipWarmUp,
  getWarmUpFlowState,
  daysSinceLastSession,
} from './warm-up-flow';
import type { ContinuitySessionSummary } from './session-types';

function makeSession(overrides: Partial<ContinuitySessionSummary> = {}): ContinuitySessionSummary {
  return {
    id: 1,
    date: new Date().toISOString(),
    durationMs: 60000,
    detectedKey: 'C major',
    averageTempo: 100,
    timingAccuracy: 0.8,
    chordsUsed: ['C', 'G'],
    drillsCompleted: 0,
    keyInsight: null,
    weaknessAreas: [],
    snapshotCount: 0,
    ...overrides,
  };
}

describe('warm-up-flow', () => {
  beforeEach(() => {
    useSessionStore.setState({
      isWarmingUp: false,
      currentWarmupExercise: 0,
      warmupRoutine: null,
      sessionType: null,
      skillProfile: {
        dimensions: { Speed: { value: 0.5, confidence: 0.8 } },
        overallLevel: 0.5,
        lastUpdated: new Date().toISOString(),
      },
      recentSessions: [makeSession()],
    });
  });

  describe('startWarmUp', () => {
    it('sets isWarmingUp and sessionType to warmup', () => {
      startWarmUp();
      const state = useSessionStore.getState();
      expect(state.isWarmingUp).toBe(true);
      expect(state.sessionType).toBe('warmup');
    });

    it('generates a warmup routine', () => {
      startWarmUp();
      const state = useSessionStore.getState();
      expect(state.warmupRoutine).not.toBeNull();
      expect(state.warmupRoutine!.exercises.length).toBeGreaterThan(0);
    });

    it('sets currentWarmupExercise to 0', () => {
      startWarmUp();
      expect(useSessionStore.getState().currentWarmupExercise).toBe(0);
    });
  });

  describe('advanceWarmUpExercise', () => {
    it('advances to the next exercise', () => {
      startWarmUp();
      const hasMore = advanceWarmUpExercise();
      expect(useSessionStore.getState().currentWarmupExercise).toBe(1);
      expect(hasMore).toBe(true);
    });

    it('returns false when routine is null', () => {
      const hasMore = advanceWarmUpExercise();
      expect(hasMore).toBe(false);
    });

    it('completes warm-up when on last exercise', () => {
      startWarmUp();
      const routine = useSessionStore.getState().warmupRoutine!;
      // Advance to last exercise
      useSessionStore.setState({
        currentWarmupExercise: routine.exercises.length - 1,
      });
      const hasMore = advanceWarmUpExercise();
      expect(hasMore).toBe(false);
      expect(useSessionStore.getState().isWarmingUp).toBe(false);
    });
  });

  describe('onWarmUpComplete', () => {
    it('transitions to freeform', () => {
      startWarmUp();
      onWarmUpComplete();
      const state = useSessionStore.getState();
      expect(state.isWarmingUp).toBe(false);
      expect(state.warmupRoutine).toBeNull();
      expect(state.sessionType).toBe('freeform');
    });
  });

  describe('skipWarmUp', () => {
    it('transitions to freeform', () => {
      skipWarmUp();
      const state = useSessionStore.getState();
      expect(state.isWarmingUp).toBe(false);
      expect(state.sessionType).toBe('freeform');
    });
  });

  describe('getWarmUpFlowState', () => {
    it('returns idle state when not warming up', () => {
      const flowState = getWarmUpFlowState();
      expect(flowState.isGenerating).toBe(false);
      expect(flowState.totalExercises).toBe(0);
    });

    it('returns active state during warm-up', () => {
      startWarmUp();
      const flowState = getWarmUpFlowState();
      expect(flowState.totalExercises).toBeGreaterThan(0);
      expect(flowState.currentExercise).toBe(0);
      expect(flowState.routine).not.toBeNull();
    });
  });

  describe('daysSinceLastSession', () => {
    it('returns null for empty sessions', () => {
      expect(daysSinceLastSession([])).toBeNull();
    });

    it('returns 0 for a session today', () => {
      const sessions = [makeSession({ date: new Date().toISOString() })];
      expect(daysSinceLastSession(sessions)).toBe(0);
    });

    it('returns correct days for past sessions', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const sessions = [makeSession({ date: threeDaysAgo })];
      expect(daysSinceLastSession(sessions)).toBe(3);
    });
  });
});
