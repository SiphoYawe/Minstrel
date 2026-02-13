'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';

/**
 * Modal overlay shown when a user's Supabase session expires unexpectedly.
 * Renders a semi-transparent backdrop with a centered dialog directing the
 * user to re-authenticate. Uses dark studio aesthetic with 0px border radius.
 */
export function SessionExpiredModal() {
  const sessionExpired = useAppStore((s) => s.sessionExpired);
  const setSessionExpired = useAppStore((s) => s.setSessionExpired);
  const router = useRouter();

  const handleLogin = useCallback(() => {
    setSessionExpired(false);
    const redirectTo = encodeURIComponent(window.location.pathname);
    router.push(`/login?redirectTo=${redirectTo}`);
  }, [setSessionExpired, router]);

  if (!sessionExpired) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
    >
      <div className="mx-4 w-full max-w-sm border border-border bg-card p-8">
        <h2
          id="session-expired-title"
          className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent-warm"
        >
          Session Expired
        </h2>
        <div className="mt-2 h-px w-8 bg-accent-warm" />
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Your session has expired. Please log in again to continue.
        </p>
        <Button
          className="mt-6 w-full"
          onClick={handleLogin}
        >
          Log In
        </Button>
      </div>
    </div>
  );
}
