import { useSessionStore } from '@/stores/session-store';
import type { SessionType } from './session-types';

/**
 * Starts a freeform session. Called on the first MIDI note-on event
 * when no structured activity has been selected.
 * Sets session type to 'freeform' and marks interruptions as disallowed.
 */
export function startFreeformSession(): void {
  const store = useSessionStore.getState();
  // Only start if no session type is set yet
  if (store.sessionType !== null) return;

  store.setSessionType('freeform');
  store.setInterruptionsAllowed(false);
}

/**
 * Transitions to a structured session type.
 * Called when the user explicitly requests a drill, micro-session, or warmup.
 * Requires an active session (sessionType must not be null).
 * Preserves all existing session data.
 */
export function transitionSessionType(newType: SessionType): void {
  const store = useSessionStore.getState();
  // Guard: cannot transition if no session is active
  if (store.sessionType === null) return;

  store.setSessionType(newType);
  // Structured sessions allow interruptions (drill prompts, coaching suggestions)
  store.setInterruptionsAllowed(newType !== 'freeform');
}

/**
 * Resets session type and interruption state.
 * Called when the session ends or the component unmounts.
 */
export function resetSessionManager(): void {
  const store = useSessionStore.getState();
  store.setSessionType(null);
  store.setInterruptionsAllowed(false);
}
