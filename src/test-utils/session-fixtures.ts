import type { GuestSession, StoredMidiEvent } from '@/lib/dexie/db';

export function createMockSession(overrides?: Partial<GuestSession>): GuestSession {
  return {
    id: 1,
    startedAt: Date.now() - 300_000, // 5 min ago
    endedAt: Date.now(),
    duration: 300,
    inputSource: 'midi',
    sessionType: 'freeform',
    status: 'completed',
    key: 'C major',
    tempo: 100,
    userId: null,
    syncStatus: 'pending',
    supabaseId: null,
    ...overrides,
  };
}

export function createMockMidiEvents(sessionId: number, count: number = 20): StoredMidiEvent[] {
  const events: StoredMidiEvent[] = [];
  const baseTimestamp = Date.now() - 300_000;

  for (let i = 0; i < count; i++) {
    const isNoteOn = i % 2 === 0;
    const noteNumber = 60 + (Math.floor(i / 2) % 12);
    events.push({
      id: i + 1,
      sessionId,
      type: isNoteOn ? 'note-on' : 'note-off',
      note: noteNumber,
      noteName: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][noteNumber % 12],
      velocity: isNoteOn ? 80 : 0,
      channel: 1,
      timestamp: baseTimestamp + i * 500, // 500ms between events
      source: 'midi',
      userId: null,
      syncStatus: 'pending',
    });
  }

  return events;
}

export function createMockSessionList(count: number = 5): GuestSession[] {
  return Array.from({ length: count }, (_, i) =>
    createMockSession({
      id: i + 1,
      startedAt: Date.now() - (count - i) * 86_400_000, // 1 day apart
      endedAt: Date.now() - (count - i) * 86_400_000 + 300_000,
      duration: 300 + i * 60,
      key: ['C major', 'G major', 'A minor', 'D major', 'F major'][i % 5],
      tempo: 80 + i * 10,
    })
  );
}
