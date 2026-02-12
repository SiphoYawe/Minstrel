import { create } from 'zustand';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Populated in later stories
interface AppState {}

export const useAppStore = create<AppState>()(() => ({
  // Initial state TBD
}));
