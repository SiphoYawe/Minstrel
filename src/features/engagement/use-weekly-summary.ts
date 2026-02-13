'use client';

/**
 * Weekly Summary Hook — Layer 2 Application Logic (Story 7.5)
 *
 * Fetches weekly session data and computes the summary.
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import type { WeeklySummary, SessionMetric } from './engagement-types';
import { computeWeeklySummary } from './weekly-summary-generator';
import { fetchWeeklySummaryData } from './progress-service';

async function loadWeeklyData(
  userId: string | undefined,
  isAuthenticated: boolean
): Promise<{ currentWeek: SessionMetric[]; previousWeek: SessionMetric[] }> {
  if (!isAuthenticated || !userId) {
    return { currentWeek: [], previousWeek: [] };
  }
  return fetchWeeklySummaryData(userId);
}

export function useWeeklySummary() {
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  useEffect(() => {
    let cancelled = false;

    loadWeeklyData(user?.id, isAuthenticated).then(({ currentWeek, previousWeek }) => {
      if (!cancelled) {
        if (currentWeek.length > 0) {
          setWeeklySummary(computeWeeklySummary(currentWeek, previousWeek, 0));
          setHasData(true);
        } else {
          setHasData(false);
        }
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  return {
    weeklySummary,
    isLoading,
    hasData,
  };
}
