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
