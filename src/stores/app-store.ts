import { create } from 'zustand';
import type { AuthUser } from '@/features/auth/auth-types';

export type MigrationStatus = 'idle' | 'migrating' | 'complete' | 'partial-failure';

export interface MigrationProgress {
  synced: number;
  total: number;
}

interface AppState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasApiKey: boolean;
  migrationStatus: MigrationStatus;
  migrationProgress: MigrationProgress;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setHasApiKey: (hasKey: boolean) => void;
  setMigrationStatus: (status: MigrationStatus) => void;
  setMigrationProgress: (progress: MigrationProgress) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasApiKey: false,
  migrationStatus: 'idle',
  migrationProgress: { synced: 0, total: 0 },
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasApiKey: (hasApiKey) => set({ hasApiKey }),
  setMigrationStatus: (migrationStatus) => set({ migrationStatus }),
  setMigrationProgress: (migrationProgress) => set({ migrationProgress }),
}));
