import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '@/stores/session-store';
import type {
  DetectedNote,
  DetectedChord,
  ChordProgression,
  TimingEvent,
} from '@/features/analysis/analysis-types';

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().resetAnalysis();
  });

  it('exports a Zustand store', () => {
    expect(useSessionStore).toBeDefined();
    expect(typeof useSessionStore.getState).toBe('function');
    expect(typeof useSessionStore.setState).toBe('function');
    expect(typeof useSessionStore.subscribe).toBe('function');
  });

  it('returns initial state with empty analysis fields', () => {
    const state = useSessionStore.getState();
    expect(state.currentNotes).toEqual([]);
    expect(state.detectedChords).toEqual([]);
    expect(state.chordProgression).toBeNull();
    expect(state.currentChordLabel).toBeNull();
  });

  it('setCurrentNotes updates the current notes', () => {
    const notes: DetectedNote[] = [
      { name: 'C', octave: 4, midiNumber: 60, velocity: 100, timestamp: 1000 },
    ];
    useSessionStore.getState().setCurrentNotes(notes);
    expect(useSessionStore.getState().currentNotes).toEqual(notes);
  });

  it('addDetectedChord appends chord and sets label', () => {
    const chord: DetectedChord = {
      root: 'C',
      quality: 'Major',
      notes: [
        { name: 'C', octave: 4, midiNumber: 60, velocity: 100, timestamp: 1000 },
        { name: 'E', octave: 4, midiNumber: 64, velocity: 100, timestamp: 1000 },
        { name: 'G', octave: 4, midiNumber: 67, velocity: 100, timestamp: 1000 },
      ],
      timestamp: 1000,
    };

    useSessionStore.getState().addDetectedChord(chord, 'Cmaj');
    const state = useSessionStore.getState();
    expect(state.detectedChords).toHaveLength(1);
    expect(state.detectedChords[0].root).toBe('C');
    expect(state.currentChordLabel).toBe('Cmaj');
  });

  it('setChordProgression updates progression', () => {
    const progression: ChordProgression = {
      chords: [],
      startTimestamp: 1000,
      endTimestamp: 2000,
    };
    useSessionStore.getState().setChordProgression(progression);
    expect(useSessionStore.getState().chordProgression).toEqual(progression);
  });

  it('setTimingData updates timing fields', () => {
    const deviations: TimingEvent[] = [
      { noteTimestamp: 500, expectedBeatTimestamp: 500, deviationMs: 0, beatIndex: 1 },
    ];
    useSessionStore.getState().setTimingData({
      tempo: 120,
      accuracy: 95,
      deviations,
      tempoHistory: [{ bpm: 120, startTimestamp: 0, endTimestamp: 5000, noteCount: 10 }],
    });

    const state = useSessionStore.getState();
    expect(state.currentTempo).toBe(120);
    expect(state.timingAccuracy).toBe(95);
    expect(state.timingDeviations).toEqual(deviations);
    expect(state.tempoHistory).toHaveLength(1);
  });

  it('returns initial timing state', () => {
    const state = useSessionStore.getState();
    expect(state.currentTempo).toBeNull();
    expect(state.timingAccuracy).toBe(100);
    expect(state.timingDeviations).toEqual([]);
    expect(state.tempoHistory).toEqual([]);
  });

  it('resetAnalysis restores initial state including timing', () => {
    const note: DetectedNote = {
      name: 'C',
      octave: 4,
      midiNumber: 60,
      velocity: 100,
      timestamp: 1000,
    };
    const chord: DetectedChord = {
      root: 'C',
      quality: 'Major',
      notes: [note],
      timestamp: 1000,
    };

    useSessionStore.getState().setCurrentNotes([note]);
    useSessionStore.getState().addDetectedChord(chord, 'Cmaj');
    useSessionStore
      .getState()
      .setChordProgression({ chords: [chord], startTimestamp: 1000, endTimestamp: 1000 });
    useSessionStore.getState().setTimingData({
      tempo: 120,
      accuracy: 85,
      deviations: [
        { noteTimestamp: 500, expectedBeatTimestamp: 500, deviationMs: 0, beatIndex: 1 },
      ],
      tempoHistory: [],
    });

    useSessionStore.getState().resetAnalysis();
    const state = useSessionStore.getState();
    expect(state.currentNotes).toEqual([]);
    expect(state.detectedChords).toEqual([]);
    expect(state.chordProgression).toBeNull();
    expect(state.currentChordLabel).toBeNull();
    expect(state.currentTempo).toBeNull();
    expect(state.timingAccuracy).toBe(100);
    expect(state.timingDeviations).toEqual([]);
    expect(state.tempoHistory).toEqual([]);
  });
});
