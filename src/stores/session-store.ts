import { create } from 'zustand';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Populated in later stories
interface SessionState {}

export const useSessionStore = create<SessionState>()(() => ({
  // Initial state TBD
}));
