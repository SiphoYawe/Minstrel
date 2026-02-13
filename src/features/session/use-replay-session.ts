'use client';

import { useEffect, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { db } from '@/lib/dexie/db';
import type { GuestSession, StoredMidiEvent } from '@/lib/dexie/db';

export interface ReplaySessionData {
  session: GuestSession | null;
  events: StoredMidiEvent[];
  status: 'idle' | 'loading' | 'success' | 'error';
}

async function loadSessionFromDexie(id: number): Promise<GuestSession | undefined> {
  if (!db) return undefined;
  return db.sessions.get(id);
}

async function loadEventsFromDexie(sessionId: number): Promise<StoredMidiEvent[]> {
  if (!db) return [];
  return db.midiEvents.where('sessionId').equals(sessionId).sortBy('timestamp');
}

export async function loadSessionList(): Promise<GuestSession[]> {
  if (!db) return [];
  const sessions = await db.sessions
    .where('status')
    .equals('completed')
    .reverse()
    .sortBy('startedAt');
  return sessions;
}

export function useReplaySession(sessionId: number | null) {
  const setReplaySession = useSessionStore((s) => s.setReplaySession);
  const setReplayEvents = useSessionStore((s) => s.setReplayEvents);
  const setReplayStatus = useSessionStore((s) => s.setReplayStatus);
  const setReplayPosition = useSessionStore((s) => s.setReplayPosition);
  const resetReplay = useSessionStore((s) => s.resetReplay);

  const loadSession = useCallback(
    async (id: number) => {
      setReplayStatus('loading');
      setReplayPosition(0);

      try {
        // Load metadata first for fast render
        const session = await loadSessionFromDexie(id);
        if (!session) {
          setReplayStatus('error');
          return;
        }
        setReplaySession(session);

        // Load MIDI events
        const events = await loadEventsFromDexie(id);
        setReplayEvents(events);
        setReplayStatus('success');
      } catch {
        setReplayStatus('error');
      }
    },
    [setReplaySession, setReplayEvents, setReplayStatus, setReplayPosition]
  );

  useEffect(() => {
    if (sessionId === null) {
      resetReplay();
      return;
    }
    loadSession(sessionId);
    return () => {
      resetReplay();
    };
  }, [sessionId, loadSession, resetReplay]);
}
