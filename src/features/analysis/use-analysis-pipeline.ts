'use client';

import { useEffect, useRef } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';
import { detectNote } from './note-detector';
import { analyzeChord, chordDisplayName, updateProgression } from './chord-analyzer';
import { createTimingAnalysis } from './timing-analyzer';
import {
  detectKey,
  detectKeyWeighted,
  detectKeyFromChords,
  detectModulation,
  analyzeHarmonicFunction,
  classifyNote,
  KEY_DISPLAY_CONFIDENCE_THRESHOLD,
  KEY_DEBOUNCE_MS,
} from './harmonic-analyzer';
import { detectGenrePatterns } from './genre-detector';
import { trackTendencies, detectAvoidance } from './tendency-tracker';
import { generateSnapshot } from './snapshot-generator';
import { startFreeformSession, resetSessionManager } from '@/features/session/session-manager';
import {
  startRecording,
  recordEvent,
  recordSnapshot,
  stopRecording,
  startMetadataSync,
} from '@/features/session/session-recorder';
import type { DetectedNote, AnalysisAccumulator } from './analysis-types';
import {
  SIMULTANEITY_WINDOW_MS,
  SILENCE_THRESHOLD_MS,
  SESSION_END_SILENCE_MS,
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
  const sessionEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timingAnalysis = createTimingAnalysis();
    let timingNoteCount = 0;
    let lastTimingUpdate = 0;
    const allPitchClasses: number[] = [];
    const weightedNotes: Array<{ pitchClass: number; velocity: number }> = [];
    let lastKeyChangeTime = 0;
    let lastConfidentKey: import('./analysis-types').KeyCenter | null = null;
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
        // Run pattern analysis first so snapshot captures latest genre/tendency data
        runPatternAnalysis();

        // Generate snapshot before resetting analysis state
        if (accumulator.totalNoteCount > 0) {
          const store = useSessionStore.getState();
          const snapshot = generateSnapshot({
            currentKey: store.currentKey,
            detectedChords: store.detectedChords,
            timingAccuracy: store.timingAccuracy,
            currentTempo: store.currentTempo,
            detectedGenres: store.detectedGenres,
            playingTendencies: store.playingTendencies,
            avoidancePatterns: store.avoidancePatterns,
            sessionType: store.sessionType,
            totalNotesPlayed: store.totalNotesPlayed,
          });
          store.setCurrentSnapshot(snapshot);
          store.addSnapshot(snapshot);
          // Persist snapshot to IndexedDB
          recordSnapshot(snapshot).catch((err) => {
            console.warn('Failed to record snapshot:', err);
          });
        }

        // Reset phrase-level analysis state (session identity preserved)
        const resetStore = useSessionStore.getState();
        resetStore.setChordProgression(null);
        timingAnalysis.reset();
        resetStore.setTimingData({
          tempo: null,
          accuracy: 100,
          deviations: [],
          tempoHistory: [],
        });
        resetStore.setKeyCenter(null);
        resetStore.setHarmonicFunction(null);
        resetStore.setNoteAnalyses([]);
        // Reset accumulator so next phrase starts clean
        resetAccumulator();
        lastChord = null;
        allPitchClasses.length = 0;
        weightedNotes.length = 0;
        silenceTimerRef.current = null;
      }, SILENCE_THRESHOLD_MS);
    }

    function resetSessionEndTimer() {
      if (sessionEndTimerRef.current !== null) {
        clearTimeout(sessionEndTimerRef.current);
      }
      // Clear summary if user resumes playing
      const store = useSessionStore.getState();
      if (store.showSessionSummary) {
        store.setShowSessionSummary(false);
      }
      sessionEndTimerRef.current = setTimeout(() => {
        // Only trigger if user has actually played notes in this session
        const s = useSessionStore.getState();
        if (s.totalNotesPlayed > 0 && s.sessionStartTimestamp !== null) {
          s.setShowSessionSummary(true);
        }
        sessionEndTimerRef.current = null;
      }, SESSION_END_SILENCE_MS);
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

          // Set session start timestamp and freeform type on first note
          const noteStore = useSessionStore.getState();
          if (noteStore.sessionStartTimestamp === null) {
            noteStore.setSessionStartTimestamp(Date.now());
            startFreeformSession();
            // Start recording to IndexedDB
            startRecording('freeform', event.source)
              .then((sessionId) => {
                useSessionStore.getState().setActiveSessionId(sessionId);
                startMetadataSync(() => {
                  const s = useSessionStore.getState();
                  const keyStr = s.currentKey ? `${s.currentKey.root} ${s.currentKey.mode}` : null;
                  return { key: keyStr, tempo: s.currentTempo };
                });
              })
              .catch((err) => {
                console.warn('Failed to start recording:', err);
              });
          }

          // Record MIDI event to buffer
          recordEvent(event);

          // Clear snapshot on play resume (transition back to real-time mode)
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

          // Harmonic analysis: velocity-weighted key detection (Story 14.6)
          allPitchClasses.push(detected.midiNumber % 12);
          if (allPitchClasses.length > PITCH_CLASS_ROLLING_WINDOW) {
            allPitchClasses.splice(0, allPitchClasses.length - PITCH_CLASS_ROLLING_WINDOW);
          }
          weightedNotes.push({ pitchClass: detected.midiNumber % 12, velocity: detected.velocity });
          if (weightedNotes.length > PITCH_CLASS_ROLLING_WINDOW) {
            weightedNotes.splice(0, weightedNotes.length - PITCH_CLASS_ROLLING_WINDOW);
          }
          const store = useSessionStore.getState();
          if (allPitchClasses.length >= 8) {
            // Use velocity-weighted detection, fall back to unweighted
            const key = detectKeyWeighted(weightedNotes) ?? detectKey(allPitchClasses);
            if (key) {
              const now = performance.now();
              const isNewKey =
                !store.currentKey ||
                key.root !== store.currentKey.root ||
                key.mode !== store.currentKey.mode;
              const passesDebounce = !isNewKey || now - lastKeyChangeTime >= KEY_DEBOUNCE_MS;
              const passesConfidence = key.confidence >= KEY_DISPLAY_CONFIDENCE_THRESHOLD;

              if (passesConfidence && passesDebounce) {
                if (isNewKey) lastKeyChangeTime = now;
                lastConfidentKey = key;
                store.setKeyCenter(key);
              } else if (!store.currentKey && lastConfidentKey) {
                // Show last confident key if nothing displayed yet
                store.setKeyCenter(lastConfidentKey);
              }
            }
          }

          // Chord-tone classification
          const noteAnalysis = classifyNote(detected, lastChord);
          const currentAnalyses = store.currentNoteAnalyses;
          store.setNoteAnalyses([...currentAnalyses.slice(-31), noteAnalysis]);

          // Reset silence timer
          resetSilenceTimer();
          resetSessionEndTimer();
        }

        if (event.type === 'note-off' || (event.type === 'note-on' && event.velocity === 0)) {
          // Record note-off event
          recordEvent(event);

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
      if (sessionEndTimerRef.current !== null) clearTimeout(sessionEndTimerRef.current);
      analysisClusterRef.current = [];
      heldNotes.clear();
      timingAnalysis.reset();
      // Stop recording (final flush + session update).
      // stopRecording clears all recorder state internally — do NOT call resetRecorder
      // afterward as it would wipe the buffer before the async flush completes.
      stopRecording().catch((err) => {
        console.warn('Failed to stop recording:', err);
      });
      // Order matters: resetSessionManager clears sessionType/interruptionsAllowed,
      // then resetAnalysis preserves the now-cleared values (both become initial state)
      resetSessionManager();
      useSessionStore.getState().setActiveSessionId(null);
      useSessionStore.getState().resetAnalysis();
    };
  }, []);
}
