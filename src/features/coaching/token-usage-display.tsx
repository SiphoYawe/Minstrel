'use client';

import type { TokenUsageSummary } from './token-usage';
import { formatEstimatedCost, formatTokenSummary } from '@/lib/format-utils';

interface TokenUsageDisplayProps {
  summary: TokenUsageSummary | null;
  variant: 'session' | 'total' | 'compact';
}

function EmptyState() {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
      No AI usage yet
    </p>
  );
}

function SessionVariant({ summary }: { summary: TokenUsageSummary }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-[13px] text-foreground">
        {formatTokenSummary(summary.totalTokens, summary.estimatedCost)}
      </span>
      <span className="font-sans text-[11px] text-muted-foreground">this session</span>
    </div>
  );
}

function TotalVariant({ summary }: { summary: TokenUsageSummary }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Total usage
          </span>
        </div>
        <span className="font-mono text-[13px] text-foreground">
          {formatTokenSummary(summary.totalTokens, summary.estimatedCost)}
        </span>
        {summary.interactionCount > 0 && (
          <span className="font-sans text-[11px] text-muted-foreground">
            {summary.interactionCount} interaction{summary.interactionCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <p className="font-sans text-[10px] leading-relaxed text-muted-foreground/60">
        Cost estimates are approximate and based on published pricing. Check your provider dashboard
        for actual charges.
      </p>
    </div>
  );
}

function CompactVariant({ summary }: { summary: TokenUsageSummary }) {
  return (
    <span className="font-mono text-[11px] text-muted-foreground">
      {formatEstimatedCost(summary.estimatedCost)}
    </span>
  );
}

export function TokenUsageDisplay({ summary, variant }: TokenUsageDisplayProps) {
  if (!summary || summary.totalTokens === 0) {
    return <EmptyState />;
  }

  switch (variant) {
    case 'session':
      return <SessionVariant summary={summary} />;
    case 'total':
      return <TotalVariant summary={summary} />;
    case 'compact':
      return <CompactVariant summary={summary} />;
  }
}
