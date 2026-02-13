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
import { detectGenrePatterns } from './genre-detector';
import { trackTendencies, detectAvoidance } from './tendency-tracker';
import { generateSnapshot } from './snapshot-generator';
import type { DetectedNote, AnalysisAccumulator } from './analysis-types';
import {
  SIMULTANEITY_WINDOW_MS,
  SILENCE_THRESHOLD_MS,
  TIMING_UPDATE_INTERVAL_MS,
  TIMING_UPDATE_NOTE_COUNT,
  PITCH_CLASS_ROLLING_WINDOW,
  KEY_DETECTION_CHORD_WINDOW,
  PATTERN_ANALYSIS_INTERVAL_MS,
  ACCUMULATOR_MAX_NOTES,
  ACCUMULATOR_MAX_CHORDS,
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

    // Analysis accumulator for genre/tendency tracking
    const accumulator: AnalysisAccumulator = {
      notes: [],
      chords: [],
      tempoSegments: [],
      keySegments: [],
      totalNoteCount: 0,
      totalChordCount: 0,
      startTimestamp: 0,
      lastTimestamp: 0,
    };
    let lastPatternNoteCount = 0;

    function resetAccumulator() {
      accumulator.notes.length = 0;
      accumulator.chords.length = 0;
      accumulator.tempoSegments = [];
      accumulator.keySegments = [];
      accumulator.totalNoteCount = 0;
      accumulator.totalChordCount = 0;
      accumulator.startTimestamp = 0;
      accumulator.lastTimestamp = 0;
      lastPatternNoteCount = 0;
    }

    function runPatternAnalysis() {
      // Skip if no new data since last run (fix #4: avoid idle updates)
      if (accumulator.totalNoteCount === lastPatternNoteCount) return;
      if (accumulator.notes.length < 8 && accumulator.chords.length < 3) return;

      lastPatternNoteCount = accumulator.totalNoteCount;
      const store = useSessionStore.getState();

      // Snapshot current tempo/key segments from store (fix #10: copy arrays)
      accumulator.tempoSegments = [...store.tempoHistory];
      accumulator.keySegments = [...store.keyHistory];

      const genres = detectGenrePatterns(accumulator);
      store.setDetectedGenres(genres);

      const tendencies = trackTendencies(accumulator);
      store.setPlayingTendencies(tendencies);

      const avoidance = detectAvoidance(tendencies, accumulator);
      store.setAvoidancePatterns(avoidance);
    }

    // Schedule pattern analysis every 30 seconds during active play
    const patternInterval = setInterval(runPatternAnalysis, PATTERN_ANALYSIS_INTERVAL_MS);

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

      // Accumulator: track chord for genre/tendency analysis
      if (accumulator.chords.length >= ACCUMULATOR_MAX_CHORDS) {
        accumulator.chords.splice(0, accumulator.chords.length - ACCUMULATOR_MAX_CHORDS + 1);
      }
      accumulator.chords.push(chord);
      accumulator.totalChordCount++;

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

        // Run pattern analysis first so snapshot captures latest genre/tendency data
        runPatternAnalysis();

        // Generate snapshot before resetting analysis state
        if (accumulator.totalNoteCount > 0) {
          const updatedStore = useSessionStore.getState();
          const snapshot = generateSnapshot({
            currentKey: updatedStore.currentKey,
            detectedChords: updatedStore.detectedChords,
            timingAccuracy: updatedStore.timingAccuracy,
            currentTempo: updatedStore.currentTempo,
            detectedGenres: updatedStore.detectedGenres,
            playingTendencies: updatedStore.playingTendencies,
            avoidancePatterns: updatedStore.avoidancePatterns,
          });
          updatedStore.setCurrentSnapshot(snapshot);
          updatedStore.addSnapshot(snapshot);
        }

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
        // Reset accumulator so next phrase starts clean
        resetAccumulator();
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

          // Clear snapshot on play resume (transition back to real-time mode)
          const noteStore = useSessionStore.getState();
          if (noteStore.currentSnapshot !== null) {
            noteStore.setCurrentSnapshot(null);
          }

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

          // Accumulator: track note for genre/tendency analysis
          if (accumulator.totalNoteCount === 0) {
            accumulator.startTimestamp = event.timestamp;
          }
          accumulator.lastTimestamp = event.timestamp;
          if (accumulator.notes.length >= ACCUMULATOR_MAX_NOTES) {
            accumulator.notes.splice(0, accumulator.notes.length - ACCUMULATOR_MAX_NOTES + 1);
          }
          accumulator.notes.push(detected);
          accumulator.totalNoteCount++;

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
      clearInterval(patternInterval);
      if (clusterTimerRef.current !== null) clearTimeout(clusterTimerRef.current);
      if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current);
      analysisClusterRef.current = [];
      heldNotes.clear();
      timingAnalysis.reset();
      useSessionStore.getState().resetAnalysis();
    };
  }, []);
}
