'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { DashboardView } from '@/components/dashboard-view';

export default function DashboardPage() {
  return (
    <div className="min-h-svh bg-background px-6 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="sr-only">Dashboard</h1>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/session"
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-primary"
          >
            <ChevronLeft className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
            Back to practice
          </Link>
          <Link href="/" className="transition-opacity duration-150 hover:opacity-70">
            <Image
              src="/minstrel-logo-white.svg"
              alt="Minstrel"
              width={80}
              height={20}
              className="h-4 w-auto opacity-30"
            />
          </Link>
        </div>

        {/* Page header */}
        <div className="mt-6 mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
            Dashboard
          </p>
          <div className="mt-2 h-px w-12 bg-primary" />
        </div>

        {/* Dashboard content */}
        <DashboardView />
      </div>
    </div>
  );
}
