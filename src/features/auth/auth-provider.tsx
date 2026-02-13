'use client';

import { useEffect } from 'react';
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
      });
    });
  }, 100);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    let authStateSettled = false;

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
