'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import type { StreakData } from './engagement-types';
import {
  calculateStreakUpdate,
  getStreakStatus,
  isSessionMeaningful,
  createEmptyStreak,
} from './streak-tracker';
import { fetchStreak, updateStreak } from './streak-service';

export function useStreak() {
  const user = useAppStore((s) => s.user);
  const [streak, setStreak] = useState<StreakData>(() => createEmptyStreak());
  const [fetched, setFetched] = useState(false);
  const streakRef = useRef(streak);

  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    let cancelled = false;
    (async () => {
      const data = await fetchStreak(userId);
      if (!cancelled) {
        const timezoneOffsetMinutes = -new Date().getTimezoneOffset();
        data.streakStatus = getStreakStatus(data, new Date(), timezoneOffsetMinutes);
        setStreak(data);
        setFetched(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const loading = !!user?.id && !fetched;

  async function recordSession(activePlayDurationMs: number) {
    const userId = user?.id;
    if (!userId) return;
    if (!isSessionMeaningful(activePlayDurationMs)) return;

    const timezoneOffsetMinutes = -new Date().getTimezoneOffset();
    const updated = calculateStreakUpdate(streakRef.current, new Date(), timezoneOffsetMinutes);

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
  }

  return { streak, loading, recordSession };
}

export type { StreakData };
