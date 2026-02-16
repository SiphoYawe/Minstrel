'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import { mapSupabaseUser } from './use-auth';

function handleAuthenticated(userId: string): void {
  // Trigger background sync of any unsynced guest data to Supabase
  import('@/lib/dexie/migration').then(({ triggerMigrationIfNeeded }) => {
    triggerMigrationIfNeeded(userId);
  });

  // Check if user has an API key configured
  // Defer slightly so the session cookie is written before the fetch
  setTimeout(() => {
    import('./api-key-manager').then(({ getApiKeyMetadata }) => {
      getApiKeyMetadata().then((result) => {
        useAppStore.getState().setHasApiKey(!!result.data);
        useAppStore.getState().setApiKeyProvider(result.data?.provider ?? null);
      });
    });
  }, 100);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const userInitiatedSignOut = useRef(false);

  // Run orphan session cleanup on app startup (fire-and-forget)
  useEffect(() => {
    import('@/features/session/session-recorder').then(({ cleanupOrphanSessions }) => {
      cleanupOrphanSessions().catch(() => {
        // Best effort — don't block app startup
      });
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let authStateSettled = false;

    // Intercept signOut to mark user-initiated sign-outs
    const originalSignOut = supabase.auth.signOut.bind(supabase.auth);
    supabase.auth.signOut = async (...args: Parameters<typeof originalSignOut>) => {
      userInitiatedSignOut.current = true;
      return originalSignOut(...args);
    };

    // Listen for auth state changes — fires synchronously with INITIAL_SESSION
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      authStateSettled = true;
      if (session?.user) {
        useAppStore.getState().setUser(mapSupabaseUser(session.user));
        // Only trigger migration on initial load or sign-in, not token refresh
        if (event !== 'TOKEN_REFRESHED') {
          handleAuthenticated(session.user.id);
        }
      } else {
        // Detect session expiry: SIGNED_OUT event that wasn't user-initiated
        if (event === 'SIGNED_OUT' && !userInitiatedSignOut.current) {
          useAppStore.getState().setSessionExpired(true);
        }
        userInitiatedSignOut.current = false;
        useAppStore.getState().clearUser();
      }
      useAppStore.getState().setLoading(false);
    });

    // Fallback: if onAuthStateChange didn't fire yet, use getUser()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (authStateSettled) return; // onAuthStateChange already handled it
      if (user) {
        useAppStore.getState().setUser(mapSupabaseUser(user));
        handleAuthenticated(user.id);
      }
      useAppStore.getState().setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
