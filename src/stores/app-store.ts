import { create } from 'zustand';
import type { AuthUser } from '@/features/auth/auth-types';

export type MigrationStatus = 'idle' | 'migrating' | 'complete' | 'partial-failure';
export type ApiKeyStatus = 'none' | 'active' | 'invalid' | 'validating';

export interface MigrationProgress {
  synced: number;
  total: number;
}

interface AppState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasApiKey: boolean;
  apiKeyStatus: ApiKeyStatus;
  apiKeyProvider: string | null;
  migrationStatus: MigrationStatus;
  migrationProgress: MigrationProgress;
  sessionExpired: boolean;
  sidebarCollapsed: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setHasApiKey: (hasKey: boolean) => void;
  setApiKeyStatus: (status: ApiKeyStatus) => void;
  setApiKeyProvider: (provider: string | null) => void;
  setMigrationStatus: (status: MigrationStatus) => void;
  setMigrationProgress: (progress: MigrationProgress) => void;
  setSessionExpired: (expired: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

function getInitialSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem('minstrel:sidebar-collapsed');
    if (stored !== null) return stored === 'true';
    return window.innerWidth < 1024;
  } catch {
    return false;
  }
}

export const useAppStore = create<AppState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasApiKey: false,
  apiKeyStatus: 'none' as ApiKeyStatus,
  apiKeyProvider: null,
  migrationStatus: 'idle',
  migrationProgress: { synced: 0, total: 0 },
  sessionExpired: false,
  sidebarCollapsed: getInitialSidebarCollapsed(),
  setUser: (user) => set({ user, isAuthenticated: true, sessionExpired: false }),
  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      hasApiKey: false,
      apiKeyStatus: 'none',
      apiKeyProvider: null,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasApiKey: (hasKey) =>
    set({
      hasApiKey: hasKey,
      apiKeyStatus: hasKey ? 'active' : 'none',
    }),
  setApiKeyStatus: (apiKeyStatus) =>
    set({
      apiKeyStatus,
      hasApiKey: apiKeyStatus === 'active',
    }),
  setApiKeyProvider: (apiKeyProvider) => set({ apiKeyProvider }),
  setMigrationStatus: (migrationStatus) => set({ migrationStatus }),
  setMigrationProgress: (migrationProgress) => set({ migrationProgress }),
  setSessionExpired: (sessionExpired) => set({ sessionExpired }),
  setSidebarCollapsed: (sidebarCollapsed) => {
    try {
      localStorage.setItem('minstrel:sidebar-collapsed', String(sidebarCollapsed));
    } catch {
      /* noop */
    }
    set({ sidebarCollapsed });
  },
}));
