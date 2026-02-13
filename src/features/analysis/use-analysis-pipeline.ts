'use client';

import { useEffect, useRef } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';
import { detectNote } from './note-detector';
import { analyzeChord, chordDisplayName, updateProgression } from './chord-analyzer';
import type { DetectedNote } from './analysis-types';
import { SIMULTANEITY_WINDOW_MS, SILENCE_THRESHOLD_MS } from '@/lib/constants';

/**
 * Subscribes to midiStore events, runs note detection and chord analysis,
 * and dispatches results to sessionStore.
 *
 * Uses separate tracking for:
 * - analysisCluster: notes in the current simultaneity window (for chord detection)
 * - heldNotes: notes currently held down (for display via sessionStore.currentNotes)
 */
export function useAnalysisPipeline() {
  const analysisClusterRef = useRef<DetectedNote[]>([]);
  const heldNotesRef = useRef<Map<number, DetectedNote>>(new Map());
  const clusterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function flushCluster() {
      const cluster = analysisClusterRef.current;
      analysisClusterRef.current = [];

      if (cluster.length < 3) return;

      const chord = analyzeChord(cluster);
      if (!chord) return;

      const store = useSessionStore.getState();
      const label = chordDisplayName(chord);
      store.addDetectedChord(chord, label);

      const progression = updateProgression(chord, store.chordProgression);
      store.setChordProgression(progression);
    }

    function resetSilenceTimer() {
      if (silenceTimerRef.current !== null) {
        clearTimeout(silenceTimerRef.current);
      }
      silenceTimerRef.current = setTimeout(() => {
        useSessionStore.getState().setChordProgression(null);
        silenceTimerRef.current = null;
      }, SILENCE_THRESHOLD_MS);
    }

    const unsubscribe = useMidiStore.subscribe(
      (state) => state.latestEvent,
      (event) => {
        if (!event) return;

        if (event.type === 'note-on' && event.velocity > 0) {
          const detected = detectNote(event.note, event.velocity, event.timestamp);

          // Track held note for display
          heldNotesRef.current.set(detected.midiNumber, detected);
          useSessionStore.getState().setCurrentNotes(Array.from(heldNotesRef.current.values()));

          // Add to analysis cluster (not affected by note-off)
          analysisClusterRef.current = [...analysisClusterRef.current, detected];

          // Reset cluster timer — wait for more simultaneous notes
          if (clusterTimerRef.current !== null) {
            clearTimeout(clusterTimerRef.current);
          }
          clusterTimerRef.current = setTimeout(() => {
            flushCluster();
            clusterTimerRef.current = null;
          }, SIMULTANEITY_WINDOW_MS);

          // Reset silence timer
          resetSilenceTimer();
        }

        if (event.type === 'note-off' || (event.type === 'note-on' && event.velocity === 0)) {
          // Remove from held notes display only (not from analysis cluster)
          heldNotesRef.current.delete(event.note);
          useSessionStore.getState().setCurrentNotes(Array.from(heldNotesRef.current.values()));

          // Clear chord label when all notes are released
          if (heldNotesRef.current.size === 0) {
            useSessionStore.setState({ currentChordLabel: null });
          }

          resetSilenceTimer();
        }
      }
    );

    const heldNotes = heldNotesRef.current;

    return () => {
      unsubscribe();
      if (clusterTimerRef.current !== null) clearTimeout(clusterTimerRef.current);
      if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current);
      analysisClusterRef.current = [];
      heldNotes.clear();
      useSessionStore.getState().resetAnalysis();
    };
  }, []);
}
