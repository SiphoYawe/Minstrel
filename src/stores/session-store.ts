import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  DetectedNote,
  DetectedChord,
  ChordProgression,
} from '@/features/analysis/analysis-types';

interface SessionState {
  currentNotes: DetectedNote[];
  detectedChords: DetectedChord[];
  chordProgression: ChordProgression | null;
  currentChordLabel: string | null;
}

interface SessionActions {
  setCurrentNotes: (notes: DetectedNote[]) => void;
  addDetectedChord: (chord: DetectedChord, label: string) => void;
  setChordProgression: (progression: ChordProgression | null) => void;
  resetAnalysis: () => void;
}

type SessionStore = SessionState & SessionActions;

const initialState: SessionState = {
  currentNotes: [],
  detectedChords: [],
  chordProgression: null,
  currentChordLabel: null,
};

export const useSessionStore = create<SessionStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,

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

    resetAnalysis: () => set(initialState),
  }))
);
