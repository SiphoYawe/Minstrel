'use client';

import { useEffect, useRef } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import {
  startGuestSession,
  recordGuestEvent,
  getActiveSessionId,
  resetGuestSession,
} from './guest-session';

/**
 * Subscribes to the MIDI event store and records events to IndexedDB
 * for guest users. Auto-starts a session on the first note-on event.
 */
export function useGuestSession() {
  const startingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = useMidiStore.subscribe(
      (state) => state.latestEvent,
      (event) => {
        if (!event || event.type !== 'note-on') return;

        const sessionId = getActiveSessionId();

        if (sessionId !== null) {
          recordGuestEvent(sessionId, event).catch((err) => {
            console.warn('Failed to record guest event:', err);
          });
          return;
        }

        // Auto-start session on first note-on
        if (startingRef.current) return;
        startingRef.current = true;

        startGuestSession(event.source)
          .then((newId) => {
            recordGuestEvent(newId, event).catch((err) => {
              console.warn('Failed to record first guest event:', err);
            });
          })
          .catch((err) => {
            console.warn('Failed to start guest session:', err);
          })
          .finally(() => {
            startingRef.current = false;
          });
      }
    );

    return () => {
      unsubscribe();
      resetGuestSession();
    };
  }, []);
}
