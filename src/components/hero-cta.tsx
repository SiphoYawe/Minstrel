'use client';

import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';

export function HeroCTA() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return (
      <>
        <div className="mt-10 flex gap-4">
          <Link
            href="/session"
            className="inline-flex h-12 items-center bg-primary px-8 text-sm font-medium text-primary-foreground transition-all duration-150 hover:brightness-110 active:brightness-90"
          >
            Go to Practice
          </Link>
          <Link
            href="/settings"
            className="inline-flex h-12 items-center border border-border bg-transparent px-8 text-sm font-medium text-foreground transition-colors duration-150 hover:border-surface-border hover:bg-card"
          >
            Settings
          </Link>
        </div>
        <p className="mt-6 font-mono text-[11px] tracking-wider text-muted-foreground">
          Welcome back. Your instrument is waiting.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="mt-10 flex gap-4">
        <Link
          href="/play"
          className="inline-flex h-12 items-center bg-primary px-8 text-sm font-medium text-primary-foreground transition-all duration-150 hover:brightness-110 active:brightness-90"
        >
          Start Playing
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-12 items-center border border-border bg-transparent px-8 text-sm font-medium text-foreground transition-colors duration-150 hover:border-surface-border hover:bg-card"
        >
          Create Account
        </Link>
      </div>
      <p className="mt-6 font-mono text-[11px] tracking-wider text-muted-foreground">
        No payment required. Bring your own API key.
      </p>
    </>
  );
}
