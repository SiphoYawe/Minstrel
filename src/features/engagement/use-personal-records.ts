'use client';

/**
 * Personal Records Hook — Layer 2 Application Logic (Story 7.6)
 *
 * Manages record state, triggers detection on session end.
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import type {
  PersonalRecord,
  PersonalRecordWithHistory,
  RecordDetectionInput,
} from './engagement-types';
import { detectNewRecords, applyNewRecords, createEmptyRecordSet } from './record-tracker';
import { fetchPersonalRecords, saveNewRecords } from './record-service';

async function loadRecords(
  userId: string | undefined,
  isAuthenticated: boolean
): Promise<PersonalRecordWithHistory[]> {
  if (!isAuthenticated || !userId) return createEmptyRecordSet();
  return fetchPersonalRecords(userId).catch(() => createEmptyRecordSet());
}

export function usePersonalRecords() {
  const [records, setRecords] = useState<PersonalRecordWithHistory[]>(createEmptyRecordSet());
  const [recentNewRecords, setRecentNewRecords] = useState<PersonalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  useEffect(() => {
    let cancelled = false;

    loadRecords(user?.id, isAuthenticated).then((loaded) => {
      if (!cancelled) {
        if (loaded.length > 0) {
          setRecords(loaded);
        }
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  /**
   * Detect and apply new records from session data.
   * Returns newly set records for display.
   */
  async function checkSessionRecords(input: RecordDetectionInput): Promise<PersonalRecord[]> {
    const newRecords = detectNewRecords(records, input);

    if (newRecords.length > 0) {
      const updated = applyNewRecords(records, newRecords);
      setRecords(updated);
      setRecentNewRecords(newRecords);

      // Persist for authenticated users
      const currentUser = useAppStore.getState().user;
      if (useAppStore.getState().isAuthenticated && currentUser?.id) {
        // Only save the records that changed
        const changedTypes = new Set(newRecords.map((r) => r.recordType));
        const changedRecords = updated.filter((r) => changedTypes.has(r.recordType));

        try {
          await saveNewRecords(currentUser.id, changedRecords);
        } catch {
          console.warn('[records] Failed to persist to Supabase');
        }
      }
    }

    return newRecords;
  }

  function dismissRecentRecords() {
    setRecentNewRecords([]);
  }

  return {
    records,
    recentNewRecords,
    isLoading,
    checkSessionRecords,
    dismissRecentRecords,
  };
}
