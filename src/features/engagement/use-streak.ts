'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import type { StreakData } from './engagement-types';
import {
  calculateStreakUpdate,
  getStreakStatus,
  isSessionMeaningful,
  createEmptyStreak,
} from './streak-tracker';
import { fetchStreak, updateStreak } from './streak-service';

const TIMEZONE_STORAGE_KEY = 'minstrel:user-timezone';

/**
 * Get the persisted IANA timezone string (e.g. 'America/New_York').
 *
 * On first call, captures the user's IANA timezone and persists it to
 * localStorage. Subsequent calls — even across sessions or after travel —
 * return the *persisted* IANA timezone, keeping streak day-boundary
 * calculations stable while correctly handling DST transitions (STATE-L1).
 */
export function getPersistedTimezone(): string {
  let iana: string | null = null;
  try {
    iana = localStorage.getItem(TIMEZONE_STORAGE_KEY);
  } catch {
    // SSR or storage unavailable — fall through to dynamic detection
  }

  if (!iana) {
    iana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      localStorage.setItem(TIMEZONE_STORAGE_KEY, iana);
    } catch {
      // storage unavailable — still use the detected value this call
    }
  }

  return iana;
}

export function useStreak() {
  const user = useAppStore((s) => s.user);
  const [streak, setStreak] = useState<StreakData>(() => createEmptyStreak());
  const [fetched, setFetched] = useState(false);

  // Synchronously-updated ref for reading latest streak in async callbacks.
  // Unlike the useEffect-synced ref pattern, this updates immediately on every render
  // to prevent stale reads when recordSession fires between render and effect.
  const streakRef = useRef(streak);
  // eslint-disable-next-line react-hooks/refs -- intentional render-phase sync to prevent stale closure in recordSession
  streakRef.current = streak;

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    let cancelled = false;
    (async () => {
      const data = await fetchStreak(userId);
      if (!cancelled) {
        const timeZone = getPersistedTimezone();
        data.streakStatus = getStreakStatus(data, new Date(), timeZone);
        setStreak(data);
        setFetched(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const loading = !!user?.id && !fetched;

  const recordSession = useCallback(
    async (activePlayDurationMs: number) => {
      const userId = user?.id;
      if (!userId) return;
      if (!isSessionMeaningful(activePlayDurationMs)) return;

      const timeZone = getPersistedTimezone();
      // Read latest streak from ref (synchronously updated each render)
      // to avoid stale closure over the `streak` state variable.
      const currentStreak = streakRef.current;
      const updated = calculateStreakUpdate(currentStreak, new Date(), timeZone);

      // Optimistic update for immediate UI feedback
      setStreak(updated);

      // Persist atomically — use server return value as authority
      const result = await updateStreak(userId, updated);
      if (result) {
        setStreak((prev) => ({
          ...prev,
          currentStreak: result.newCurrentStreak,
          bestStreak: result.newBestStreak,
        }));
      }
    },
    [user?.id]
  );

  return { streak, loading, recordSession };
}

export type { StreakData };
