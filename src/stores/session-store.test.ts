import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '@/stores/session-store';
import type {
  DetectedNote,
  DetectedChord,
  ChordProgression,
  TimingEvent,
  KeyCenter,
  KeySegment,
  HarmonicFunction,
  NoteAnalysis,
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

  it('returns initial harmonic state', () => {
    const state = useSessionStore.getState();
    expect(state.currentKey).toBeNull();
    expect(state.keyHistory).toEqual([]);
    expect(state.currentHarmonicFunction).toBeNull();
    expect(state.currentNoteAnalyses).toEqual([]);
  });

  it('setKeyCenter updates current key', () => {
    const key: KeyCenter = { root: 'C', mode: 'major', confidence: 0.9 };
    useSessionStore.getState().setKeyCenter(key);
    expect(useSessionStore.getState().currentKey).toEqual(key);
  });

  it('setKeyCenter clears key with null', () => {
    useSessionStore.getState().setKeyCenter({ root: 'C', mode: 'major', confidence: 0.9 });
    useSessionStore.getState().setKeyCenter(null);
    expect(useSessionStore.getState().currentKey).toBeNull();
  });

  it('addKeySegment appends to key history', () => {
    const segment: KeySegment = {
      key: { root: 'C', mode: 'major', confidence: 0.9 },
      startTimestamp: 0,
      endTimestamp: 5000,
      chordCount: 10,
    };
    useSessionStore.getState().addKeySegment(segment);
    expect(useSessionStore.getState().keyHistory).toHaveLength(1);
    expect(useSessionStore.getState().keyHistory[0]).toEqual(segment);

    const segment2: KeySegment = {
      key: { root: 'G', mode: 'major', confidence: 0.85 },
      startTimestamp: 5000,
      endTimestamp: 10000,
      chordCount: 8,
    };
    useSessionStore.getState().addKeySegment(segment2);
    expect(useSessionStore.getState().keyHistory).toHaveLength(2);
  });

  it('setHarmonicFunction updates harmonic function', () => {
    const fn: HarmonicFunction = { romanNumeral: 'IV', quality: 'Major', isSecondary: false };
    useSessionStore.getState().setHarmonicFunction(fn);
    expect(useSessionStore.getState().currentHarmonicFunction).toEqual(fn);
  });

  it('setNoteAnalyses updates note analyses', () => {
    const analyses: NoteAnalysis[] = [
      {
        note: { name: 'C', octave: 4, midiNumber: 60, velocity: 100, timestamp: 1000 },
        isChordTone: true,
        chordContext: null,
      },
    ];
    useSessionStore.getState().setNoteAnalyses(analyses);
    expect(useSessionStore.getState().currentNoteAnalyses).toEqual(analyses);
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
    useSessionStore.getState().setKeyCenter({ root: 'G', mode: 'major', confidence: 0.8 });
    useSessionStore.getState().addKeySegment({
      key: { root: 'C', mode: 'major', confidence: 0.9 },
      startTimestamp: 0,
      endTimestamp: 5000,
      chordCount: 10,
    });
    useSessionStore.getState().setHarmonicFunction({
      romanNumeral: 'V',
      quality: 'Major',
      isSecondary: false,
    });
    useSessionStore.getState().setNoteAnalyses([
      {
        note: { name: 'C', octave: 4, midiNumber: 60, velocity: 100, timestamp: 1000 },
        isChordTone: true,
        chordContext: null,
      },
    ]);

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
    expect(state.currentKey).toBeNull();
    expect(state.keyHistory).toEqual([]);
    expect(state.currentHarmonicFunction).toBeNull();
    expect(state.currentNoteAnalyses).toEqual([]);
  });
});
