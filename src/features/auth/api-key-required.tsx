'use client';

import Link from 'next/link';
import { KeyRound, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

interface ApiKeyRequiredProps {
  feature: 'coaching' | 'drills' | 'analysis';
  children: React.ReactNode;
}

const featureMessages: Record<ApiKeyRequiredProps['feature'], string> = {
  coaching: 'Connect your API key in Settings to unlock AI coaching',
  drills: 'Connect your API key to get personalized drills',
  analysis: 'Connect your API key for AI-powered analysis',
};

export function ApiKeyRequired({ feature, children }: ApiKeyRequiredProps) {
  const hasApiKey = useAppStore((s) => s.hasApiKey);

  if (hasApiKey) {
    return <>{children}</>;
  }

  return (
    <div role="status" className="border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background">
          <KeyRound className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="font-sans text-[13px] leading-relaxed text-foreground">
            {featureMessages[feature]}
          </p>
          <Link
            href="/settings#api-keys"
            className="mt-2 inline-block font-mono text-[13px] text-primary transition-colors duration-150 hover:brightness-110"
          >
            Go to Settings{' '}
            <ChevronRight className="inline h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
          </Link>
          <p className="mt-3 font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Minstrel uses a Bring-Your-Own-Key model &mdash; your key, your data.
          </p>
        </div>
      </div>
    </div>
  );
}
