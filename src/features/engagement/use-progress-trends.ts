'use client';

/**
 * Progress Trends Hook — Layer 2 Application Logic (Story 7.4)
 *
 * Manages trend data fetching, period selection, and caching.
 * Fetches 90 days of data once, then computes subsets client-side.
 */

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { TrendPeriod, type ProgressSummary, type SessionMetric } from './engagement-types';
import { generateProgressSummary } from './progress-aggregator';
import { fetchSessionMetrics, fetchSessionCount } from './progress-service';
import { MIN_SESSIONS_FOR_TRENDS } from '@/lib/constants';

async function loadProgressData(
  userId: string | undefined,
  isAuthenticated: boolean
): Promise<{ metrics: SessionMetric[]; sessionCount: number }> {
  if (!isAuthenticated || !userId) {
    return { metrics: [], sessionCount: 0 };
  }

  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 90);

  const [metrics, sessionCount] = await Promise.all([
    fetchSessionMetrics(userId, fromDate, toDate),
    fetchSessionCount(userId),
  ]);

  return { metrics, sessionCount };
}

export function useProgressTrends() {
  const [allMetrics, setAllMetrics] = useState<SessionMetric[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>(TrendPeriod.ThirtyDays);
  const [isLoading, setIsLoading] = useState(true);

  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  useEffect(() => {
    let cancelled = false;

    loadProgressData(user?.id, isAuthenticated).then(({ metrics, sessionCount: count }) => {
      if (!cancelled) {
        setAllMetrics(metrics);
        setSessionCount(count);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const hasMinimumData = sessionCount >= MIN_SESSIONS_FOR_TRENDS;

  const progressSummary: ProgressSummary | null = useMemo(() => {
    if (!hasMinimumData || allMetrics.length === 0) return null;
    return generateProgressSummary(allMetrics, selectedPeriod);
  }, [allMetrics, selectedPeriod, hasMinimumData]);

  return {
    progressSummary,
    selectedPeriod,
    setSelectedPeriod,
    isLoading,
    hasMinimumData,
  };
}
