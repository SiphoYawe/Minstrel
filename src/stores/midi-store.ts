import { create } from 'zustand';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Populated in Story 1.3
interface MidiState {}

export const useMidiStore = create<MidiState>()(() => ({
  // Initial state TBD
}));
