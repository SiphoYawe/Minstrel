import Dexie, { type Table } from 'dexie';
import type { InputSource, MidiEventType } from '@/features/midi/midi-types';

export interface GuestSession {
  id?: number;
  startedAt: number;
  endedAt: number | null;
  duration: number | null;
  inputSource: InputSource;
}

export interface StoredMidiEvent {
  id?: number;
  sessionId: number;
  type: MidiEventType;
  note: number;
  noteName: string;
  velocity: number;
  channel: number;
  timestamp: number;
  source: InputSource;
}

export interface AnalysisSnapshot {
  id?: number;
  sessionId: number;
  createdAt: number;
  data: Record<string, unknown>;
}

class MinstrelDatabase extends Dexie {
  sessions!: Table<GuestSession>;
  midiEvents!: Table<StoredMidiEvent>;
  analysisSnapshots!: Table<AnalysisSnapshot>;

  constructor() {
    super('minstrel-local');
    this.version(1).stores({
      sessions: '++id, startedAt',
      midiEvents: '++id, sessionId, [sessionId+timestamp]',
      analysisSnapshots: '++id, sessionId, createdAt',
    });
  }
}

// Guarded against SSR — indexedDB is only available in browser/test environments
export const db: MinstrelDatabase =
  typeof indexedDB !== 'undefined' ? new MinstrelDatabase() : (null as unknown as MinstrelDatabase);
