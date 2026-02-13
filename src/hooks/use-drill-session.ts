'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { createDrillCycle } from '@/features/drills/drill-player';
import type { DrillOutput, DrillCycleController } from '@/features/drills/drill-player';
import { DrillPhase } from '@/features/drills/drill-types';
import type { GeneratedDrill } from '@/features/drills/drill-types';
import { comparePerformance, getDrillMessage } from '@/features/drills/drill-tracker';
import type { DrillRepResult } from '@/features/drills/drill-tracker';
import type { MidiEvent } from '@/features/midi/midi-types';

/** Duration (ms) to capture MIDI input during attempt before auto-analyzing. */
const ATTEMPT_TIMEOUT_MS = 15000;

export interface DrillSessionState {
  /** Current phase of the drill. null = no active session. */
  phase: DrillPhase | null;
  currentRep: number;
  repHistory: DrillRepResult[];
  improvementMessage: string;
  activeNoteIndex: number;
  /** Start the drill (enters Demonstrate phase). */
  startDrill: () => void;
  /** Try another rep. */
  tryAgain: () => void;
  /** End the drill session. */
  complete: () => void;
}

/**
 * Hook that orchestrates the full drill session lifecycle:
 * Setup → Demonstrate → Listen → Attempt → Analyze → (repeat or complete)
 *
 * Automatically resolves MIDI output or Web Audio fallback.
 * Captures MIDI input during Attempt phase and compares against drill notes.
 */
export function useDrillSession(drill: GeneratedDrill | null): DrillSessionState {
  const [phase, setPhase] = useState<DrillPhase | null>(null);
  const [currentRep, setCurrentRep] = useState(1);
  const [repHistory, setRepHistory] = useState<DrillRepResult[]>([]);
  const [activeNoteIndex, setActiveNoteIndex] = useState(-1);

  const cycleRef = useRef<DrillCycleController | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const attemptStartRef = useRef<number>(0);
  const capturedNotesRef = useRef<MidiEvent[]>([]);
  const attemptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const resolveOutput = useCallback((): DrillOutput => {
    const port = useMidiStore.getState().outputPort;
    if (port) return { type: 'midi', port };
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    return { type: 'audio', audioContext: audioCtxRef.current };
  }, []);

  /** Stop any active playback and clean up subscriptions. */
  const cleanup = useCallback(() => {
    cycleRef.current?.stop();
    cycleRef.current = null;
    if (attemptTimerRef.current) {
      clearTimeout(attemptTimerRef.current);
      attemptTimerRef.current = null;
    }
    unsubRef.current?.();
    unsubRef.current = null;
    setActiveNoteIndex(-1);
  }, []);

  /** Analyze captured MIDI input against drill notes. */
  const analyzeAttempt = useCallback(() => {
    if (!drill) return;

    // Unsubscribe from MIDI events
    unsubRef.current?.();
    unsubRef.current = null;
    if (attemptTimerRef.current) {
      clearTimeout(attemptTimerRef.current);
      attemptTimerRef.current = null;
    }

    const result = comparePerformance(
      capturedNotesRef.current,
      drill.sequence.notes,
      drill.targetTempo,
      attemptStartRef.current,
      currentRep
    );

    setRepHistory((prev) => [...prev, result]);
    setPhase(DrillPhase.Analyze);
  }, [drill, currentRep]);

  /** Begin the demonstrate → listen → attempt cycle. */
  const runCycle = useCallback(() => {
    if (!drill) return;
    cleanup();
    capturedNotesRef.current = [];

    const output = resolveOutput();

    setPhase(DrillPhase.Demonstrate);

    const cycle = createDrillCycle(
      drill,
      output,
      (p) => {
        setPhase(p);

        if (p === DrillPhase.Attempt) {
          // Capture MIDI input during attempt
          attemptStartRef.current = performance.now();
          capturedNotesRef.current = [];

          const unsub = useMidiStore.subscribe(
            (state) => state.latestEvent,
            (event) => {
              if (event && event.type === 'note-on') {
                capturedNotesRef.current.push(event);
              }
            }
          );
          unsubRef.current = unsub;

          // Auto-analyze after timeout
          attemptTimerRef.current = setTimeout(() => {
            analyzeAttempt();
          }, ATTEMPT_TIMEOUT_MS);
        }
      },
      (_note, index) => {
        setActiveNoteIndex(index);
      }
    );

    cycleRef.current = cycle;
    cycle.startDemonstration();

    // When attempt phase begins, wait for user to play all notes or timeout
    cycle.readyForAttempt.then(() => {
      // The Attempt phase is already set via onPhaseChange callback
    });
  }, [drill, resolveOutput, cleanup, analyzeAttempt]);

  const startDrill = useCallback(() => {
    setCurrentRep(1);
    setRepHistory([]);
    runCycle();
  }, [runCycle]);

  const tryAgain = useCallback(() => {
    setCurrentRep((prev) => prev + 1);
    runCycle();
  }, [runCycle]);

  const complete = useCallback(() => {
    cleanup();
    setPhase(DrillPhase.Complete);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  const improvementMessage = getDrillMessage(repHistory);

  return {
    phase,
    currentRep,
    repHistory,
    improvementMessage,
    activeNoteIndex,
    startDrill,
    tryAgain,
    complete,
  };
}
