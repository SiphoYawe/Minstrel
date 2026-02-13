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
 * Get a persisted timezone offset in minutes (UTC offset, e.g. UTC+2 = 120).
 *
 * On first call, captures the user's IANA timezone and persists it to
 * localStorage. Subsequent calls — even across sessions or after travel —
 * return the offset derived from the *persisted* IANA timezone, keeping
 * streak day-boundary calculations stable.
 */
export function getPersistedTimezoneOffsetMinutes(): number {
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

  // Derive the current UTC offset for the persisted IANA timezone.
  // Using the persisted IANA name means the *timezone identity* stays
  // stable across travel while DST transitions are still respected.
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: iana,
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(now);
  const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';

  // tzPart looks like "GMT", "GMT+2", "GMT-5:30", etc.
  if (tzPart === 'GMT' || tzPart === 'UTC') return 0;

  const match = tzPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) {
    // Fallback: use the runtime offset (negated to match our convention)
    return -now.getTimezoneOffset();
  }

  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3] ?? '0', 10);
  return sign * (hours * 60 + minutes);
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
        const timezoneOffsetMinutes = getPersistedTimezoneOffsetMinutes();
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

  const recordSession = useCallback(
    async (activePlayDurationMs: number) => {
      const userId = user?.id;
      if (!userId) return;
      if (!isSessionMeaningful(activePlayDurationMs)) return;

      const timezoneOffsetMinutes = getPersistedTimezoneOffsetMinutes();
      // Read latest streak from ref (synchronously updated each render)
      // to avoid stale closure over the `streak` state variable.
      const currentStreak = streakRef.current;
      const updated = calculateStreakUpdate(currentStreak, new Date(), timezoneOffsetMinutes);

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
