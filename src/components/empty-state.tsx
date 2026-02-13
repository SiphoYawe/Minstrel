'use client';

import Link from 'next/link';

export interface EmptyStateProps {
  /** Render slot for an SVG illustration or icon. */
  illustration?: React.ReactNode;
  /** Primary heading text. */
  title: string;
  /** Secondary descriptive text. */
  description: string;
  /** CTA button label. */
  ctaText?: string;
  /** CTA navigation target. */
  ctaHref?: string;
  /** Optional click handler (for non-navigation CTAs). */
  onCtaClick?: () => void;
}

/**
 * Reusable empty-state component used across session history,
 * achievements, coaching chat, and connection screens.
 *
 * Aesthetic: dark studio — centered column, decorative horizontal lines,
 * subtle illustration, monospace label, sans-serif body, sharp-corner CTA.
 */
export function EmptyState({
  illustration,
  title,
  description,
  ctaText,
  ctaHref,
  onCtaClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Decorative top line */}
      <div className="w-8 h-px bg-primary/30 mb-6" aria-hidden="true" />

      {/* Illustration */}
      {illustration && <div className="mb-6 opacity-60">{illustration}</div>}

      {/* Title */}
      <p className="font-mono text-sm text-foreground tracking-wide">{title}</p>

      {/* Description */}
      <p className="mt-2 max-w-xs text-xs text-muted-foreground leading-relaxed">{description}</p>

      {/* CTA */}
      {ctaText && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-5 border border-primary bg-primary/10 px-5 py-2 font-mono text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
        >
          {ctaText}
        </Link>
      )}
      {ctaText && onCtaClick && !ctaHref && (
        <button
          onClick={onCtaClick}
          className="mt-5 border border-primary bg-primary/10 px-5 py-2 font-mono text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
          type="button"
        >
          {ctaText}
        </button>
      )}

      {/* Decorative bottom line */}
      <div className="w-8 h-px bg-primary/30 mt-6" aria-hidden="true" />
    </div>
  );
}
