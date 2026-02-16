/**
 * Cross-store coordination layer (Story 24.2).
 *
 * Subscribes to MIDI connection state changes and coordinates
 * session recording pause/resume with timeline markers.
 * Call `initStoreCoordinator()` once on app mount to wire up subscriptions.
 */
import { useMidiStore } from './midi-store';
import { useSessionStore } from './session-store';
import type { MidiConnectionStatus } from '@/features/midi/midi-types';

let unsubscribe: (() => void) | null = null;

/**
 * Initialize cross-store subscriptions. Safe to call multiple times
 * — subsequent calls are no-ops until `teardownStoreCoordinator()` is called.
 */
export function initStoreCoordinator(): void {
  if (unsubscribe) return;

  unsubscribe = useMidiStore.subscribe(
    (state) => state.connectionStatus,
    (status: MidiConnectionStatus, prevStatus: MidiConnectionStatus) => {
      const sessionStore = useSessionStore.getState();

      // Only coordinate if a session is active
      if (sessionStore.sessionStartTimestamp === null) return;

      // MIDI disconnected during active session → pause recording
      if (prevStatus === 'connected' && (status === 'disconnected' || status === 'error')) {
        sessionStore.setRecordingPaused(true);
        sessionStore.addSessionMarker({
          type: 'midi-disconnected',
          timestamp: Date.now(),
        });
      }

      // MIDI reconnected → resume recording
      if ((prevStatus === 'disconnected' || prevStatus === 'error') && status === 'connected') {
        sessionStore.setRecordingPaused(false);
        sessionStore.addSessionMarker({
          type: 'midi-reconnected',
          timestamp: Date.now(),
        });
      }
    }
  );
}

/**
 * Tear down cross-store subscriptions. Used in tests and app cleanup.
 */
export function teardownStoreCoordinator(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
