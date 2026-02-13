'use client';

/**
 * Achievements Hook — Layer 2 Application Logic (Story 7.3)
 *
 * Manages achievement state and triggers evaluation on session end.
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import type { UnlockedAchievement, TriggerContext } from './engagement-types';
import { evaluateAchievements } from './achievement-engine';
import { fetchUnlockedAchievements, saveUnlockedAchievements } from './achievement-service';

async function loadAchievements(
  userId: string | undefined,
  isAuthenticated: boolean
): Promise<UnlockedAchievement[]> {
  if (!isAuthenticated || !userId) return [];
  return fetchUnlockedAchievements(userId).catch(() => []);
}

export function useAchievements() {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<UnlockedAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  // Load unlocked achievements on mount
  useEffect(() => {
    let cancelled = false;

    loadAchievements(user?.id, isAuthenticated).then((achievements) => {
      if (!cancelled) {
        setUnlockedIds(achievements.map((a) => a.achievementId));
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  /**
   * Evaluate achievements at session end. Returns newly unlocked ones.
   */
  async function evaluateSessionAchievements(
    context: TriggerContext,
    sessionId: string | null
  ): Promise<UnlockedAchievement[]> {
    const currentUser = useAppStore.getState().user;
    const userId = currentUser?.id ?? 'guest';

    const newlyUnlocked = evaluateAchievements(context, unlockedIds, userId, sessionId);

    if (newlyUnlocked.length > 0) {
      setRecentlyUnlocked(newlyUnlocked);
      setUnlockedIds((prev) => [...prev, ...newlyUnlocked.map((a) => a.achievementId)]);

      // Persist for authenticated users
      if (useAppStore.getState().isAuthenticated && currentUser?.id) {
        try {
          await saveUnlockedAchievements(newlyUnlocked);
        } catch {
          console.warn('[achievements] Failed to persist to Supabase');
        }
      }
    }

    return newlyUnlocked;
  }

  /**
   * Dismiss the recently unlocked toast notifications.
   */
  function dismissRecent() {
    setRecentlyUnlocked([]);
  }

  return {
    unlockedIds,
    recentlyUnlocked,
    isLoading,
    evaluateSessionAchievements,
    dismissRecent,
  };
}
