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
            className="inline-flex h-12 items-center bg-[#7CB9E8] px-8 text-sm font-medium text-[#0F0F0F] transition-all duration-150 hover:brightness-110 active:brightness-90"
          >
            Go to Practice
          </Link>
          <Link
            href="/settings"
            className="inline-flex h-12 items-center border border-[#2A2A2A] bg-transparent px-8 text-sm font-medium text-foreground transition-colors duration-150 hover:border-[#444] hover:bg-[#171717]"
          >
            Settings
          </Link>
        </div>
        <p className="mt-6 font-mono text-[11px] tracking-wider text-[#555]">
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
          className="inline-flex h-12 items-center bg-[#7CB9E8] px-8 text-sm font-medium text-[#0F0F0F] transition-all duration-150 hover:brightness-110 active:brightness-90"
        >
          Start Playing
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-12 items-center border border-[#2A2A2A] bg-transparent px-8 text-sm font-medium text-foreground transition-colors duration-150 hover:border-[#444] hover:bg-[#171717]"
        >
          Create Account
        </Link>
      </div>
      <p className="mt-6 font-mono text-[11px] tracking-wider text-[#555]">
        No payment required. Bring your own API key.
      </p>
    </>
  );
}
