import { create } from 'zustand';
import type { AuthUser } from '@/features/auth/auth-types';

interface AppState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasApiKey: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setHasApiKey: (hasKey: boolean) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasApiKey: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasApiKey: (hasApiKey) => set({ hasApiKey }),
}));
