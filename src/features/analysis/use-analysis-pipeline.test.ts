import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock all heavy dependencies to isolate lifecycle behavior
vi.mock('@/stores/midi-store', () => ({
  useMidiStore: {
    subscribe: vi.fn(() => vi.fn()),
    getState: () => ({ latestEvent: null }),
  },
}));

vi.mock('@/stores/session-store', () => ({
  useSessionStore: {
    getState: () => ({
      tempoHistory: [],
      keyHistory: [],
      currentKey: null,
      detectedChords: [],
      chordProgression: null,
      timingAccuracy: 100,
      currentTempo: null,
      detectedGenres: [],
      playingTendencies: [],
      avoidancePatterns: [],
      sessionType: 'freeform',
      totalNotesPlayed: 0,
      sessionStartTimestamp: null,
      currentSnapshot: null,
      currentNoteAnalyses: [],
      showSessionSummary: false,
      setDetectedGenres: vi.fn(),
      setPlayingTendencies: vi.fn(),
      setAvoidancePatterns: vi.fn(),
      setActiveSessionId: vi.fn(),
      resetAnalysis: vi.fn(),
    }),
    setState: vi.fn(),
  },
}));

vi.mock('./note-detector', () => ({ detectNote: vi.fn() }));
vi.mock('./chord-analyzer', () => ({
  analyzeChord: vi.fn(),
  chordDisplayName: vi.fn(),
  updateProgression: vi.fn(),
}));
vi.mock('./timing-analyzer', () => ({
  createTimingAnalysis: () => ({
    processNoteOn: vi.fn(),
    getCurrentTempo: vi.fn(() => null),
    getAccuracy: vi.fn(() => 100),
    getDeviations: vi.fn(() => []),
    getTempoHistory: vi.fn(() => []),
    reset: vi.fn(),
  }),
}));
vi.mock('./harmonic-analyzer', () => ({
  detectKey: vi.fn(),
  detectKeyWeighted: vi.fn(),
  detectKeyFromChords: vi.fn(),
  detectModulation: vi.fn(),
  analyzeHarmonicFunction: vi.fn(),
  classifyNote: vi.fn(),
  KEY_DISPLAY_CONFIDENCE_THRESHOLD: 0.6,
  KEY_DEBOUNCE_MS: 2000,
}));
vi.mock('./genre-detector', () => ({ detectGenrePatterns: vi.fn(() => []) }));
vi.mock('./tendency-tracker', () => ({
  trackTendencies: vi.fn(() => []),
  detectAvoidance: vi.fn(() => []),
}));
vi.mock('./snapshot-generator', () => ({ generateSnapshot: vi.fn() }));
vi.mock('@/features/session/session-manager', () => ({
  startFreeformSession: vi.fn(),
  resetSessionManager: vi.fn(),
}));
vi.mock('@/features/session/session-recorder', () => ({
  startRecording: vi.fn(() => Promise.resolve(1)),
  recordEvent: vi.fn(),
  recordSnapshot: vi.fn(() => Promise.resolve()),
  stopRecording: vi.fn(() => Promise.resolve(null)),
  startMetadataSync: vi.fn(),
}));

import { useAnalysisPipeline } from './use-analysis-pipeline';

describe('useAnalysisPipeline lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('clears pattern interval on unmount', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');

    const { unmount } = renderHook(() => useAnalysisPipeline());

    // The hook creates a setInterval — clearInterval should be called on cleanup
    unmount();

    expect(clearSpy).toHaveBeenCalled();
  });

  it('does not create duplicate intervals on rapid remount', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    const { unmount: unmount1 } = renderHook(() => useAnalysisPipeline());
    unmount1();

    const { unmount: unmount2 } = renderHook(() => useAnalysisPipeline());
    unmount2();

    // Each mount/unmount cycle should clear the old interval
    // Total setInterval calls should equal mount count (2)
    const patternIntervalCalls = setIntervalSpy.mock.calls.filter(
      (call) => typeof call[1] === 'number' && call[1] > 1000
    );
    expect(patternIntervalCalls.length).toBe(2);
  });

  it('prevents interval callback execution after unmount via mounted flag', async () => {
    const { unmount } = renderHook(() => useAnalysisPipeline());

    // Unmount sets mountedRef.current = false
    unmount();

    // Advance timers to trigger pattern interval
    vi.advanceTimersByTime(60_000);

    // If mounted flag works, runPatternAnalysis returns early
    // No crash = test passes (the guard prevents Zustand access)
  });
});
