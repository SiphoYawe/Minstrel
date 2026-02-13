'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/dexie/db';

export interface DashboardStats {
  totalPracticeMs: number;
  totalSessions: number;
  totalNotesPlayed: number;
  averageSessionMs: number;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!db) {
        setIsLoading(false);
        return;
      }

      const sessions = await db.sessions.toArray();
      const completedSessions = sessions.filter(
        (s) => s.status === 'completed' && s.duration && s.duration > 0
      );

      const totalPracticeMs = completedSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0);
      const totalSessions = completedSessions.length;

      // Count total notes from midi events
      let totalNotesPlayed = 0;
      if (totalSessions > 0) {
        totalNotesPlayed = await db.midiEvents
          .where('type')
          .equals('noteon')
          .count()
          .catch(() => 0);
        // Fallback: if type index doesn't exist, count all events
        if (totalNotesPlayed === 0) {
          totalNotesPlayed = await db.midiEvents.count().catch(() => 0);
        }
      }

      const averageSessionMs = totalSessions > 0 ? Math.round(totalPracticeMs / totalSessions) : 0;

      if (!cancelled) {
        setStats({
          totalPracticeMs,
          totalSessions,
          totalNotesPlayed,
          averageSessionMs,
        });
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, isLoading, formatDuration };
}
