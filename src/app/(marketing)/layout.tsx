import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { AuthButton } from '@/components/auth-button';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 top-0 z-[var(--z-nav)] h-14 border-b border-border bg-background/90 backdrop-blur-sm"
      >
        <div className="mx-auto flex h-full max-w-content items-center justify-between px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center transition-opacity duration-150 hover:opacity-80"
          >
            <Image
              src="/minstrel-logo-white.svg"
              alt="Minstrel"
              width={160}
              height={40}
              priority
              className="h-8 w-auto"
            />
          </Link>

          {/* Right nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/play"
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors duration-150 hover:text-foreground/60"
            >
              Try Free
            </Link>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* Content with top padding for fixed nav */}
      <main id="main-content" className="flex flex-1 flex-col pt-14">
        {children}
      </main>
    </div>
  );
}
