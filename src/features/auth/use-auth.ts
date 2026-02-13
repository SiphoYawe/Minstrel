'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import type { AuthUser, SignInData, SignUpData } from './auth-types';
import { MIN_AGE, MIN_PASSWORD_LENGTH } from './auth-types';

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function validateSignUp(data: SignUpData): string | null {
  if (!data.email || !data.email.includes('@')) {
    return 'Please enter a valid email address.';
  }
  if (data.password.length < MIN_PASSWORD_LENGTH) {
    return `Password needs at least ${MIN_PASSWORD_LENGTH} characters — you're almost there.`;
  }
  if (data.password !== data.confirmPassword) {
    return 'Passwords don\u2019t match \u2014 give it another try.';
  }
  if (!data.dateOfBirth) {
    return 'Date of birth is required.';
  }
  const age = calculateAge(data.dateOfBirth);
  if (age < MIN_AGE) {
    return 'You must be at least 13 years old to create an account.';
  }
  return null;
}

export function validateSignIn(data: SignInData): string | null {
  if (!data.email || !data.email.includes('@')) {
    return 'Please enter a valid email address.';
  }
  if (!data.password) {
    return 'Password is required.';
  }
  return null;
}

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Email or password didn\u2019t match \u2014 try again or reset your password.';
  }
  if (message.includes('User already registered')) {
    return 'That email is already in use \u2014 try logging in instead.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please check your inbox and confirm your email first.';
  }
  if (message.includes('Password should be at least')) {
    return `Password needs at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return 'Something went wrong \u2014 please try again in a moment.';
}

export function useAuth() {
  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const isLoading = useAppStore((s) => s.isLoading);
  const router = useRouter();

  const signUp = useCallback(async (data: SignUpData): Promise<{ error: string | null }> => {
    const validationError = validateSignUp(data);
    if (validationError) return { error: validationError };

    const supabase = createClient();
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    if (error) return { error: mapAuthError(error.message) };

    // Associate guest IndexedDB data with the new user ID (local only — no Supabase write yet).
    // The actual sync to Supabase happens in AuthProvider when the user signs in.
    if (authData.user) {
      import('@/lib/dexie/migration').then(({ associateGuestData }) => {
        associateGuestData(authData.user!.id).catch(() => {
          // Silently fail — association will be retried on sign-in
        });
      });
    }

    return { error: null };
  }, []);

  const signIn = useCallback(
    async (data: SignInData, redirectTo?: string): Promise<{ error: string | null }> => {
      const validationError = validateSignIn(data);
      if (validationError) return { error: validationError };

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) return { error: mapAuthError(error.message) };

      router.push(redirectTo ?? '/session');
      router.refresh();
      return { error: null };
    },
    [router]
  );

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAppStore.getState().clearUser();
    router.push('/');
    router.refresh();
  }, [router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    signUp,
    signIn,
    signOut,
  } as const;
}

export function mapSupabaseUser(supabaseUser: {
  id: string;
  email?: string;
  user_metadata?: { display_name?: string };
}): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    displayName: supabaseUser.user_metadata?.display_name ?? null,
  };
}
