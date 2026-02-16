'use client';

/**
 * XP Hook — Layer 2 Application Logic (Story 7.2)
 *
 * Exposes lifetime XP and the latest session's XP breakdown.
 * Orchestrates XP calculation on session end and persistence.
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import type { XpBreakdown, SessionXpInput } from './engagement-types';
import { calculateSessionXp } from './xp-calculator';
import { fetchLifetimeXp, awardXp } from './xp-service';

async function loadXp(userId: string | undefined, isAuthenticated: boolean): Promise<number> {
  if (!isAuthenticated || !userId) return 0;
  return fetchLifetimeXp(userId).catch(() => 0);
}

export function useXp() {
  const [lifetimeXp, setLifetimeXp] = useState(0);
  const [lastBreakdown, setLastBreakdown] = useState<XpBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  // Load lifetime XP on mount for authenticated users
  useEffect(() => {
    let cancelled = false;

    loadXp(user?.id, isAuthenticated).then((xp) => {
      if (!cancelled) {
        setLifetimeXp(xp);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  /**
   * Calculate and award XP for a completed session.
   * Returns the breakdown for display.
   */
  async function awardSessionXp(input: SessionXpInput, sessionId: string): Promise<XpBreakdown> {
    void sessionId; // Reserved for future per-session persistence
    const breakdown = calculateSessionXp(input);
    setLastBreakdown(breakdown);

    if (breakdown.totalXp > 0) {
      // Optimistic update for immediate UI feedback
      setLifetimeXp((prev) => prev + breakdown.totalXp);

      // Persist for authenticated users — use server return value as authority
      const currentUser = useAppStore.getState().user;
      const currentAuth = useAppStore.getState().isAuthenticated;
      if (currentAuth && currentUser?.id) {
        try {
          const result = await awardXp(currentUser.id, breakdown);
          if (result.success && result.newTotal != null) {
            // Server-authoritative: override optimistic value
            setLifetimeXp(result.newTotal);
          } else if (!result.success) {
            // Rollback optimistic update on failure
            console.warn('[xp] XP award failed — rolling back optimistic update');
            setLifetimeXp((prev) => prev - breakdown.totalXp);
          }
        } catch {
          console.warn('[xp] Failed to persist XP to Supabase — rolling back');
          setLifetimeXp((prev) => prev - breakdown.totalXp);
        }
      }
    }

    return breakdown;
  }

  return {
    lifetimeXp,
    lastBreakdown,
    isLoading,
    awardSessionXp,
  };
}
