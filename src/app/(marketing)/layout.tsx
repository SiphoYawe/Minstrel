import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { AuthButton } from '@/components/auth-button';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <nav className="fixed inset-x-0 top-0 z-50 h-14 border-b border-[#1A1A1A] bg-[#0F0F0F]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-content items-center justify-between px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center transition-opacity duration-150 hover:opacity-80"
          >
            <Image
              src="/minstrel-logo-white.svg"
              alt="Minstrel"
              width={120}
              height={30}
              priority
              className="h-6 w-auto"
            />
          </Link>

          {/* Right nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/play"
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#666] transition-colors duration-150 hover:text-[#A3A3A3]"
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
      <div className="flex flex-1 flex-col pt-14">{children}</div>
    </div>
  );
}
