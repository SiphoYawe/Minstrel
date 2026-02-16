'use client';

import { useEffect, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { db } from '@/lib/dexie/db';
import type { GuestSession, StoredMidiEvent } from '@/lib/dexie/db';
import { resetReplayDispatcher, pausePlayback } from '@/features/session/replay-engine';

export interface ReplaySessionData {
  session: GuestSession | null;
  events: StoredMidiEvent[];
  status: 'idle' | 'loading' | 'success' | 'error' | 'deleted';
}

const DELETION_POLL_INTERVAL_MS = 5000;

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
  const sessions = await db.sessions.where('status').equals('completed').toArray();
  sessions.sort((a, b) => b.startedAt - a.startedAt);
  return sessions;
}

export async function loadLatestSession(): Promise<GuestSession | undefined> {
  if (!db) return undefined;
  const sessions = await db.sessions.where('status').equals('completed').toArray();
  if (sessions.length === 0) return undefined;
  sessions.sort((a, b) => b.startedAt - a.startedAt);
  return sessions[0];
}

export function useReplaySession(sessionId: number | null) {
  const setReplaySession = useSessionStore((s) => s.setReplaySession);
  const setReplayEvents = useSessionStore((s) => s.setReplayEvents);
  const setReplayStatus = useSessionStore((s) => s.setReplayStatus);
  const setReplayErrorMessage = useSessionStore((s) => s.setReplayErrorMessage);
  const setReplayPosition = useSessionStore((s) => s.setReplayPosition);
  const resetReplay = useSessionStore((s) => s.resetReplay);

  const loadSession = useCallback(
    async (id: number) => {
      setReplayStatus('loading');
      setReplayPosition(0);
      setReplayErrorMessage(null);

      try {
        const session = await loadSessionFromDexie(id);
        if (!session) {
          setReplayErrorMessage('Session not found. It may have been deleted.');
          setReplayStatus('error');
          return;
        }
        setReplaySession(session);

        const events = await loadEventsFromDexie(id);
        setReplayEvents(events);
        resetReplayDispatcher();
        setReplayStatus('success');
      } catch {
        setReplayErrorMessage('Failed to load session data.');
        setReplayStatus('error');
      }
    },
    [setReplaySession, setReplayEvents, setReplayStatus, setReplayPosition, setReplayErrorMessage]
  );

  const loadLatest = useCallback(async () => {
    setReplayStatus('loading');
    setReplayPosition(0);
    setReplayErrorMessage(null);

    try {
      const latest = await loadLatestSession();
      if (!latest || !latest.id) {
        setReplayErrorMessage(
          'No sessions to replay. Play a session first, then come back here to review your playing.'
        );
        setReplayStatus('error');
        return;
      }
      setReplaySession(latest);

      const events = await loadEventsFromDexie(latest.id);
      setReplayEvents(events);
      resetReplayDispatcher();
      setReplayStatus('success');
    } catch {
      setReplayErrorMessage('Failed to load session data.');
      setReplayStatus('error');
    }
  }, [
    setReplaySession,
    setReplayEvents,
    setReplayStatus,
    setReplayPosition,
    setReplayErrorMessage,
  ]);

  // Load session on mount / ID change
  useEffect(() => {
    if (sessionId === null || sessionId === 0) {
      loadLatest();
      return () => {
        resetReplay();
      };
    }
    loadSession(sessionId);
    return () => {
      resetReplay();
    };
  }, [sessionId, loadSession, loadLatest, resetReplay]);

  // Poll for mid-playback session deletion
  useEffect(() => {
    const replaySessionId = useSessionStore.getState().replaySession?.id;
    if (!replaySessionId) return;

    const interval = setInterval(async () => {
      const { replayStatus } = useSessionStore.getState();
      // Only poll while actively playing or paused with a loaded session
      if (replayStatus !== 'success') return;

      try {
        const exists = await loadSessionFromDexie(replaySessionId);
        if (!exists) {
          pausePlayback();
          setReplayErrorMessage('This session is no longer available.');
          setReplayStatus('deleted');
        }
      } catch {
        // Ignore transient DB errors during polling
      }
    }, DELETION_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [sessionId, setReplayStatus, setReplayErrorMessage]);
}
