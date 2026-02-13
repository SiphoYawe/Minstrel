/**
 * Guest session management (Story 1.7).
 * NOTE: This module manages its own activeSessionId independently from session-recorder.ts.
 * guest-session handles the inactivity timeout lifecycle for guest users;
 * session-recorder handles the MIDI event buffering and IndexedDB writes.
 * The analysis pipeline (use-analysis-pipeline.ts) coordinates both — do not
 * use guest-session and session-recorder for the same session simultaneously.
 */
import { db } from '@/lib/dexie/db';
import type { MidiEvent } from '@/features/midi/midi-types';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

let activeSessionId: number | null = null;
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

function clearInactivityTimer(): void {
  if (inactivityTimer !== null) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
}

function resetInactivityTimer(): void {
  clearInactivityTimer();
  inactivityTimer = setTimeout(() => {
    if (activeSessionId !== null) {
      endGuestSession(activeSessionId).catch((err) => {
        console.warn('Failed to auto-end guest session:', err);
      });
    }
  }, INACTIVITY_TIMEOUT_MS);
}

export async function startGuestSession(inputSource: MidiEvent['source']): Promise<number> {
  if (activeSessionId !== null) return activeSessionId;

  const id = await db.sessions.add({
    startedAt: Date.now(),
    endedAt: null,
    duration: null,
    inputSource,
    sessionType: null,
    status: 'recording',
    key: null,
    tempo: null,
  });
  activeSessionId = id as number;
  resetInactivityTimer();
  return activeSessionId;
}

export async function endGuestSession(sessionId: number): Promise<void> {
  clearInactivityTimer();
  const session = await db.sessions.get(sessionId);
  if (session) {
    const endedAt = Date.now();
    await db.sessions.update(sessionId, {
      endedAt,
      duration: endedAt - session.startedAt,
      status: 'completed',
    });
  }
  if (activeSessionId === sessionId) {
    activeSessionId = null;
  }
}

export async function recordGuestEvent(sessionId: number, event: MidiEvent): Promise<void> {
  resetInactivityTimer();
  await db.midiEvents.add({
    sessionId,
    type: event.type,
    note: event.note,
    noteName: event.noteName,
    velocity: event.velocity,
    channel: event.channel,
    timestamp: event.timestamp,
    source: event.source,
  });
}

export function getActiveSessionId(): number | null {
  return activeSessionId;
}

export function resetGuestSession(): void {
  clearInactivityTimer();
  activeSessionId = null;
}
