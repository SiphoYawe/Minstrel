import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  DetectedNote,
  DetectedChord,
  ChordProgression,
  TimingEvent,
  TempoSegment,
  KeyCenter,
  KeySegment,
  HarmonicFunction,
  NoteAnalysis,
  GenrePattern,
  PlayingTendencies,
  AvoidancePatterns,
  InstantSnapshot,
} from '@/features/analysis/analysis-types';
import type { SessionMode } from '@/features/modes/mode-types';
import type { SessionType } from '@/features/session/session-types';
import type { ChatMessage } from '@/features/coaching/coaching-types';

interface SessionState {
  currentMode: SessionMode;
  sessionStartTimestamp: number | null;
  sessionType: SessionType | null;
  interruptionsAllowed: boolean;
  activeSessionId: number | null;
  currentNotes: DetectedNote[];
  detectedChords: DetectedChord[];
  chordProgression: ChordProgression | null;
  currentChordLabel: string | null;
  currentTempo: number | null;
  timingAccuracy: number;
  timingDeviations: TimingEvent[];
  tempoHistory: TempoSegment[];
  currentKey: KeyCenter | null;
  keyHistory: KeySegment[];
  currentHarmonicFunction: HarmonicFunction | null;
  currentNoteAnalyses: NoteAnalysis[];
  detectedGenres: GenrePattern[];
  playingTendencies: PlayingTendencies | null;
  avoidancePatterns: AvoidancePatterns | null;
  currentSnapshot: InstantSnapshot | null;
  snapshots: InstantSnapshot[];
  chatHistory: ChatMessage[];
  totalNotesPlayed: number;
}

interface SessionActions {
  setCurrentMode: (mode: SessionMode) => void;
  setSessionStartTimestamp: (ts: number | null) => void;
  setSessionType: (type: SessionType | null) => void;
  setInterruptionsAllowed: (allowed: boolean) => void;
  setActiveSessionId: (id: number | null) => void;
  setCurrentNotes: (notes: DetectedNote[]) => void;
  addDetectedChord: (chord: DetectedChord, label: string) => void;
  setChordProgression: (progression: ChordProgression | null) => void;
  setTimingData: (data: {
    tempo: number | null;
    accuracy: number;
    deviations: TimingEvent[];
    tempoHistory: TempoSegment[];
  }) => void;
  setKeyCenter: (key: KeyCenter | null) => void;
  addKeySegment: (segment: KeySegment) => void;
  setHarmonicFunction: (fn: HarmonicFunction | null) => void;
  setNoteAnalyses: (analyses: NoteAnalysis[]) => void;
  setDetectedGenres: (genres: GenrePattern[]) => void;
  setPlayingTendencies: (tendencies: PlayingTendencies | null) => void;
  setAvoidancePatterns: (patterns: AvoidancePatterns | null) => void;
  setCurrentSnapshot: (snapshot: InstantSnapshot | null) => void;
  addSnapshot: (snapshot: InstantSnapshot) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;
  incrementNotesPlayed: (count?: number) => void;
  resetAnalysis: () => void;
}

type SessionStore = SessionState & SessionActions;

const initialState: SessionState = {
  currentMode: 'silent-coach',
  sessionStartTimestamp: null,
  sessionType: null,
  interruptionsAllowed: false,
  activeSessionId: null,
  currentNotes: [],
  detectedChords: [],
  chordProgression: null,
  currentChordLabel: null,
  currentTempo: null,
  timingAccuracy: 100,
  timingDeviations: [],
  tempoHistory: [],
  currentKey: null,
  keyHistory: [],
  currentHarmonicFunction: null,
  currentNoteAnalyses: [],
  detectedGenres: [],
  playingTendencies: null,
  avoidancePatterns: null,
  currentSnapshot: null,
  snapshots: [],
  chatHistory: [],
  totalNotesPlayed: 0,
};

export const useSessionStore = create<SessionStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    setCurrentMode: (mode) => set({ currentMode: mode }),

    setSessionStartTimestamp: (ts) => set({ sessionStartTimestamp: ts }),

    setSessionType: (type) => set({ sessionType: type }),
    setInterruptionsAllowed: (allowed) => set({ interruptionsAllowed: allowed }),
    setActiveSessionId: (id) => set({ activeSessionId: id }),

    setCurrentNotes: (notes) => set({ currentNotes: notes }),

    addDetectedChord: (chord, label) =>
      set((state) => {
        const MAX_DETECTED_CHORDS = 200;
        const chords =
          state.detectedChords.length >= MAX_DETECTED_CHORDS
            ? [...state.detectedChords.slice(-(MAX_DETECTED_CHORDS - 1)), chord]
            : [...state.detectedChords, chord];
        return { detectedChords: chords, currentChordLabel: label };
      }),

    setChordProgression: (progression) => set({ chordProgression: progression }),

    setTimingData: (data) =>
      set({
        currentTempo: data.tempo,
        timingAccuracy: data.accuracy,
        timingDeviations: data.deviations,
        tempoHistory: data.tempoHistory,
      }),

    setKeyCenter: (key) => set({ currentKey: key }),

    addKeySegment: (segment) =>
      set((state) => {
        const MAX_KEY_SEGMENTS = 100;
        const segments =
          state.keyHistory.length >= MAX_KEY_SEGMENTS
            ? [...state.keyHistory.slice(-(MAX_KEY_SEGMENTS - 1)), segment]
            : [...state.keyHistory, segment];
        return { keyHistory: segments };
      }),

    setHarmonicFunction: (fn) => set({ currentHarmonicFunction: fn }),

    setNoteAnalyses: (analyses) => set({ currentNoteAnalyses: analyses }),

    setDetectedGenres: (genres) => set({ detectedGenres: genres }),

    setPlayingTendencies: (tendencies) => set({ playingTendencies: tendencies }),

    setAvoidancePatterns: (patterns) => set({ avoidancePatterns: patterns }),

    setCurrentSnapshot: (snapshot) => set({ currentSnapshot: snapshot }),

    addSnapshot: (snapshot) =>
      set((state) => {
        const MAX_SNAPSHOTS = 50;
        const snaps =
          state.snapshots.length >= MAX_SNAPSHOTS
            ? [...state.snapshots.slice(-(MAX_SNAPSHOTS - 1)), snapshot]
            : [...state.snapshots, snapshot];
        return { snapshots: snaps };
      }),

    addChatMessage: (message) =>
      set((state) => ({
        chatHistory: [...state.chatHistory, message],
      })),

    clearChatHistory: () => set({ chatHistory: [] }),

    incrementNotesPlayed: (count = 1) =>
      set((state) => ({
        totalNotesPlayed: state.totalNotesPlayed + count,
      })),

    resetAnalysis: () =>
      set((state) => ({
        ...initialState,
        // Preserve UI preferences and session identity across analysis resets
        currentMode: state.currentMode,
        sessionStartTimestamp: state.sessionStartTimestamp,
        sessionType: state.sessionType,
        interruptionsAllowed: state.interruptionsAllowed,
        activeSessionId: state.activeSessionId,
      })),
  }))
);
