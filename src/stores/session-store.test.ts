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
  GenrePattern,
  PlayingTendencies,
  AvoidancePatterns,
  InstantSnapshot,
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
    expect(state.currentMode).toBe('silent-coach');
    expect(state.sessionStartTimestamp).toBeNull();
    expect(state.sessionType).toBeNull();
    expect(state.interruptionsAllowed).toBe(false);
    expect(state.currentNotes).toEqual([]);
    expect(state.detectedChords).toEqual([]);
    expect(state.chordProgression).toBeNull();
    expect(state.currentChordLabel).toBeNull();
  });

  it('setCurrentMode updates mode', () => {
    useSessionStore.getState().setCurrentMode('dashboard-chat');
    expect(useSessionStore.getState().currentMode).toBe('dashboard-chat');
    useSessionStore.getState().setCurrentMode('replay-studio');
    expect(useSessionStore.getState().currentMode).toBe('replay-studio');
  });

  it('setSessionStartTimestamp sets and clears timestamp', () => {
    useSessionStore.getState().setSessionStartTimestamp(12345);
    expect(useSessionStore.getState().sessionStartTimestamp).toBe(12345);
    useSessionStore.getState().setSessionStartTimestamp(null);
    expect(useSessionStore.getState().sessionStartTimestamp).toBeNull();
  });

  it('setSessionType updates session type', () => {
    useSessionStore.getState().setSessionType('freeform');
    expect(useSessionStore.getState().sessionType).toBe('freeform');
    useSessionStore.getState().setSessionType('drill');
    expect(useSessionStore.getState().sessionType).toBe('drill');
    useSessionStore.getState().setSessionType(null);
    expect(useSessionStore.getState().sessionType).toBeNull();
  });

  it('setInterruptionsAllowed updates flag', () => {
    useSessionStore.getState().setInterruptionsAllowed(true);
    expect(useSessionStore.getState().interruptionsAllowed).toBe(true);
    useSessionStore.getState().setInterruptionsAllowed(false);
    expect(useSessionStore.getState().interruptionsAllowed).toBe(false);
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

  it('returns initial genre and tendency state', () => {
    const state = useSessionStore.getState();
    expect(state.detectedGenres).toEqual([]);
    expect(state.playingTendencies).toBeNull();
    expect(state.avoidancePatterns).toBeNull();
  });

  it('setDetectedGenres updates detected genres', () => {
    const genres: GenrePattern[] = [
      { genre: 'Blues', confidence: 0.8, matchedPatterns: ['dominant-chords', 'pentatonic'] },
      { genre: 'Jazz', confidence: 0.4, matchedPatterns: ['chord-voicing'] },
    ];
    useSessionStore.getState().setDetectedGenres(genres);
    const state = useSessionStore.getState();
    expect(state.detectedGenres).toHaveLength(2);
    expect(state.detectedGenres[0].genre).toBe('Blues');
    expect(state.detectedGenres[1].confidence).toBe(0.4);
  });

  it('setPlayingTendencies updates playing tendencies', () => {
    const tendencies: PlayingTendencies = {
      keyDistribution: {
        C: 10,
        D: 5,
        E: 3,
        F: 0,
        G: 0,
        A: 0,
        B: 0,
        'C#': 0,
        'D#': 0,
        'F#': 0,
        'G#': 0,
        'A#': 0,
      },
      chordTypeDistribution: {
        Major: 5,
        Minor: 3,
        Dominant7: 1,
        Diminished: 0,
        Augmented: 0,
        Minor7: 0,
        Major7: 0,
        Sus2: 0,
        Sus4: 0,
      },
      tempoHistogram: new Array(16).fill(0),
      intervalDistribution: new Array(13).fill(0),
      rhythmProfile: { averageDensity: 4.2, swingRatio: 0, commonSubdivisions: [] },
    };
    useSessionStore.getState().setPlayingTendencies(tendencies);
    expect(useSessionStore.getState().playingTendencies).toEqual(tendencies);
  });

  it('setPlayingTendencies clears with null', () => {
    const tendencies: PlayingTendencies = {
      keyDistribution: {
        C: 1,
        D: 0,
        E: 0,
        F: 0,
        G: 0,
        A: 0,
        B: 0,
        'C#': 0,
        'D#': 0,
        'F#': 0,
        'G#': 0,
        'A#': 0,
      },
      chordTypeDistribution: {
        Major: 1,
        Minor: 0,
        Dominant7: 0,
        Diminished: 0,
        Augmented: 0,
        Minor7: 0,
        Major7: 0,
        Sus2: 0,
        Sus4: 0,
      },
      tempoHistogram: new Array(16).fill(0),
      intervalDistribution: new Array(13).fill(0),
      rhythmProfile: { averageDensity: 0, swingRatio: 0, commonSubdivisions: [] },
    };
    useSessionStore.getState().setPlayingTendencies(tendencies);
    useSessionStore.getState().setPlayingTendencies(null);
    expect(useSessionStore.getState().playingTendencies).toBeNull();
  });

  it('setAvoidancePatterns updates avoidance patterns', () => {
    const patterns: AvoidancePatterns = {
      avoidedKeys: ['C#', 'F#', 'G#'],
      avoidedChordTypes: ['Diminished', 'Augmented'],
      avoidedTempoRanges: [{ minBpm: 90, maxBpm: 110 }],
      avoidedIntervals: [1, 6, 11],
    };
    useSessionStore.getState().setAvoidancePatterns(patterns);
    expect(useSessionStore.getState().avoidancePatterns).toEqual(patterns);
  });

  it('setAvoidancePatterns clears with null', () => {
    useSessionStore.getState().setAvoidancePatterns({
      avoidedKeys: ['C#'],
      avoidedChordTypes: [],
      avoidedTempoRanges: [],
      avoidedIntervals: [],
    });
    useSessionStore.getState().setAvoidancePatterns(null);
    expect(useSessionStore.getState().avoidancePatterns).toBeNull();
  });

  it('returns initial snapshot state', () => {
    const state = useSessionStore.getState();
    expect(state.currentSnapshot).toBeNull();
    expect(state.snapshots).toEqual([]);
  });

  it('setCurrentSnapshot updates current snapshot', () => {
    const snap: InstantSnapshot = {
      id: 'snap-1',
      key: { root: 'C', mode: 'major', confidence: 0.9 },
      chordsUsed: [],
      timingAccuracy: 85,
      averageTempo: 120,
      keyInsight: 'Great session',
      insightCategory: 'GENERAL',
      genrePatterns: [],
      timestamp: 1000,
    };
    useSessionStore.getState().setCurrentSnapshot(snap);
    expect(useSessionStore.getState().currentSnapshot).toEqual(snap);
  });

  it('setCurrentSnapshot clears with null', () => {
    const snap: InstantSnapshot = {
      id: 'snap-2',
      key: null,
      chordsUsed: [],
      timingAccuracy: 100,
      averageTempo: null,
      keyInsight: 'Keep going',
      insightCategory: 'GENERAL',
      genrePatterns: [],
      timestamp: 2000,
    };
    useSessionStore.getState().setCurrentSnapshot(snap);
    useSessionStore.getState().setCurrentSnapshot(null);
    expect(useSessionStore.getState().currentSnapshot).toBeNull();
  });

  it('addSnapshot appends to snapshots array', () => {
    const snap1: InstantSnapshot = {
      id: 'snap-a',
      key: null,
      chordsUsed: [],
      timingAccuracy: 80,
      averageTempo: 100,
      keyInsight: 'First',
      insightCategory: 'GENERAL',
      genrePatterns: [],
      timestamp: 1000,
    };
    const snap2: InstantSnapshot = {
      id: 'snap-b',
      key: null,
      chordsUsed: [],
      timingAccuracy: 90,
      averageTempo: 110,
      keyInsight: 'Second',
      insightCategory: 'TIMING',
      genrePatterns: [],
      timestamp: 2000,
    };
    useSessionStore.getState().addSnapshot(snap1);
    useSessionStore.getState().addSnapshot(snap2);
    expect(useSessionStore.getState().snapshots).toHaveLength(2);
    expect(useSessionStore.getState().snapshots[0].id).toBe('snap-a');
    expect(useSessionStore.getState().snapshots[1].id).toBe('snap-b');
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

    useSessionStore.getState().setCurrentMode('dashboard-chat');
    useSessionStore.getState().setSessionStartTimestamp(99999);
    useSessionStore.getState().setSessionType('freeform');
    useSessionStore.getState().setInterruptionsAllowed(false);
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
    useSessionStore
      .getState()
      .setDetectedGenres([
        { genre: 'Blues', confidence: 0.7, matchedPatterns: ['dominant-chords'] },
      ]);
    useSessionStore.getState().setPlayingTendencies({
      keyDistribution: {
        C: 1,
        D: 0,
        E: 0,
        F: 0,
        G: 0,
        A: 0,
        B: 0,
        'C#': 0,
        'D#': 0,
        'F#': 0,
        'G#': 0,
        'A#': 0,
      },
      chordTypeDistribution: {
        Major: 1,
        Minor: 0,
        Dominant7: 0,
        Diminished: 0,
        Augmented: 0,
        Minor7: 0,
        Major7: 0,
        Sus2: 0,
        Sus4: 0,
      },
      tempoHistogram: new Array(16).fill(0),
      intervalDistribution: new Array(13).fill(0),
      rhythmProfile: { averageDensity: 0, swingRatio: 0, commonSubdivisions: [] },
    });
    useSessionStore.getState().setAvoidancePatterns({
      avoidedKeys: ['C#'],
      avoidedChordTypes: [],
      avoidedTempoRanges: [],
      avoidedIntervals: [],
    });
    useSessionStore.getState().setCurrentSnapshot({
      id: 'snap-reset',
      key: null,
      chordsUsed: [],
      timingAccuracy: 90,
      averageTempo: 100,
      keyInsight: 'Test',
      insightCategory: 'GENERAL',
      genrePatterns: [],
      timestamp: 1000,
    });
    useSessionStore.getState().addSnapshot({
      id: 'snap-reset',
      key: null,
      chordsUsed: [],
      timingAccuracy: 90,
      averageTempo: 100,
      keyInsight: 'Test',
      insightCategory: 'GENERAL',
      genrePatterns: [],
      timestamp: 1000,
    });

    useSessionStore.getState().resetAnalysis();
    const state = useSessionStore.getState();
    // Mode and session timestamp are preserved across analysis resets
    expect(state.currentMode).toBe('dashboard-chat');
    expect(state.sessionStartTimestamp).toBe(99999);
    expect(state.sessionType).toBe('freeform');
    expect(state.interruptionsAllowed).toBe(false);
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
    expect(state.detectedGenres).toEqual([]);
    expect(state.playingTendencies).toBeNull();
    expect(state.avoidancePatterns).toBeNull();
    expect(state.currentSnapshot).toBeNull();
    expect(state.snapshots).toEqual([]);
  });
});
