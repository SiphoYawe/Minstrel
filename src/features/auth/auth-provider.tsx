'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import { mapSupabaseUser } from './use-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    let authStateSettled = false;

    // Listen for auth state changes — fires synchronously with INITIAL_SESSION
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authStateSettled = true;
      if (session?.user) {
        useAppStore.getState().setUser(mapSupabaseUser(session.user));
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
      }
      useAppStore.getState().setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
