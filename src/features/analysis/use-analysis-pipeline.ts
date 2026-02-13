'use client';

import { useEffect, useRef } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';
import { detectNote } from './note-detector';
import { analyzeChord, chordDisplayName, updateProgression } from './chord-analyzer';
import { createTimingAnalysis } from './timing-analyzer';
import {
  detectKey,
  detectKeyFromChords,
  detectModulation,
  analyzeHarmonicFunction,
  classifyNote,
} from './harmonic-analyzer';
import type { DetectedNote } from './analysis-types';
import {
  SIMULTANEITY_WINDOW_MS,
  SILENCE_THRESHOLD_MS,
  TIMING_UPDATE_INTERVAL_MS,
  TIMING_UPDATE_NOTE_COUNT,
  PITCH_CLASS_ROLLING_WINDOW,
  KEY_DETECTION_CHORD_WINDOW,
} from '@/lib/constants';

/**
 * Subscribes to midiStore events, runs note detection, chord analysis,
 * timing analysis, and harmonic analysis, then dispatches results to sessionStore.
 */
export function useAnalysisPipeline() {
  const analysisClusterRef = useRef<DetectedNote[]>([]);
  const heldNotesRef = useRef<Map<number, DetectedNote>>(new Map());
  const clusterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timingAnalysis = createTimingAnalysis();
    let timingNoteCount = 0;
    let lastTimingUpdate = 0;
    const allPitchClasses: number[] = [];
    let lastChord: import('./analysis-types').DetectedChord | null = null;

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

      // Track last chord for chord-tone classification
      lastChord = chord;

      // Harmonic analysis: key detection from chords
      const chords = store.detectedChords;
      const currentKey = store.currentKey;

      if (currentKey) {
        // Check for modulation
        const newKey = detectModulation(currentKey, chords.slice(-3));
        if (newKey) {
          store.addKeySegment({
            key: currentKey,
            startTimestamp:
              store.keyHistory.length > 0
                ? store.keyHistory[store.keyHistory.length - 1].endTimestamp
                : (chords[0]?.timestamp ?? 0),
            endTimestamp: chord.timestamp,
            chordCount: chords.length,
          });
          store.setKeyCenter(newKey);
        }

        // Analyze harmonic function of the new chord
        const activeKey = store.currentKey ?? currentKey;
        const fn = analyzeHarmonicFunction(chord, activeKey);
        store.setHarmonicFunction(fn);
      } else {
        // Try to detect key from recent chords (rolling window)
        const recentChords = chords.slice(-KEY_DETECTION_CHORD_WINDOW);
        const detectedKey = detectKeyFromChords(recentChords);
        if (detectedKey) {
          store.setKeyCenter(detectedKey);
          const fn = analyzeHarmonicFunction(chord, detectedKey);
          store.setHarmonicFunction(fn);
        }
      }
    }

    function resetSilenceTimer() {
      if (silenceTimerRef.current !== null) {
        clearTimeout(silenceTimerRef.current);
      }
      silenceTimerRef.current = setTimeout(() => {
        const silenceStore = useSessionStore.getState();
        silenceStore.setChordProgression(null);
        timingAnalysis.reset();
        silenceStore.setTimingData({
          tempo: null,
          accuracy: 100,
          deviations: [],
          tempoHistory: [],
        });
        // Reset harmonic state
        silenceStore.setKeyCenter(null);
        silenceStore.setHarmonicFunction(null);
        silenceStore.setNoteAnalyses([]);
        lastChord = null;
        allPitchClasses.length = 0;
        silenceTimerRef.current = null;
      }, SILENCE_THRESHOLD_MS);
    }

    function dispatchTimingUpdate(now: number) {
      const store = useSessionStore.getState();
      store.setTimingData({
        tempo: timingAnalysis.getCurrentTempo(),
        accuracy: timingAnalysis.getAccuracy(),
        deviations: timingAnalysis.getDeviations(),
        tempoHistory: timingAnalysis.getTempoHistory(),
      });
      lastTimingUpdate = now;
      timingNoteCount = 0;
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

          // Timing analysis: process each note-on timestamp
          timingAnalysis.processNoteOn(event.timestamp);
          timingNoteCount++;

          // Throttled timing store update
          const now = performance.now();
          if (
            timingNoteCount >= TIMING_UPDATE_NOTE_COUNT ||
            now - lastTimingUpdate >= TIMING_UPDATE_INTERVAL_MS
          ) {
            dispatchTimingUpdate(now);
          }

          // Harmonic analysis: key detection from individual notes (rolling window)
          allPitchClasses.push(detected.midiNumber % 12);
          if (allPitchClasses.length > PITCH_CLASS_ROLLING_WINDOW) {
            allPitchClasses.splice(0, allPitchClasses.length - PITCH_CLASS_ROLLING_WINDOW);
          }
          const store = useSessionStore.getState();
          if (!store.currentKey && allPitchClasses.length >= 8) {
            const key = detectKey(allPitchClasses);
            if (key) store.setKeyCenter(key);
          }

          // Chord-tone classification
          const noteAnalysis = classifyNote(detected, lastChord);
          const currentAnalyses = store.currentNoteAnalyses;
          store.setNoteAnalyses([...currentAnalyses.slice(-31), noteAnalysis]);

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
      timingAnalysis.reset();
      useSessionStore.getState().resetAnalysis();
    };
  }, []);
}
