import Dexie, { type Table } from 'dexie';
import type { InputSource, MidiEventType } from '@/features/midi/midi-types';
import type { SessionType, RecordingStatus } from '@/features/session/session-types';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface GuestSession {
  id?: number;
  startedAt: number;
  endedAt: number | null;
  duration: number | null;
  inputSource: InputSource;
  sessionType: SessionType | null;
  status: RecordingStatus;
  key: string | null;
  tempo: number | null;
  userId: string | null;
  syncStatus: SyncStatus;
  supabaseId: string | null;
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
  userId: string | null;
  syncStatus: SyncStatus;
}

export interface StoredSkillProfile {
  id?: number;
  userId: string;
  profileVersion: number;
  lastAssessedAt: string;
  dimensions: Record<
    string,
    { value: number; confidence: number; dataPoints: number; lastUpdated: string }
  >;
  syncStatus: SyncStatus;
}

export interface AnalysisSnapshot {
  id?: number;
  sessionId: number;
  createdAt: number;
  data: Record<string, unknown>;
  userId: string | null;
  syncStatus: SyncStatus;
}

class MinstrelDatabase extends Dexie {
  sessions!: Table<GuestSession>;
  midiEvents!: Table<StoredMidiEvent>;
  analysisSnapshots!: Table<AnalysisSnapshot>;
  skillProfiles!: Table<StoredSkillProfile>;

  constructor() {
    super('minstrel-local');
    this.version(1).stores({
      sessions: '++id, startedAt',
      midiEvents: '++id, sessionId, [sessionId+timestamp]',
      analysisSnapshots: '++id, sessionId, createdAt',
    });

    this.version(2)
      .stores({
        sessions: '++id, startedAt, sessionType, status',
        midiEvents: '++id, sessionId, [sessionId+timestamp]',
        analysisSnapshots: '++id, sessionId, createdAt, [sessionId+createdAt]',
      })
      .upgrade((tx) => {
        return tx
          .table('sessions')
          .toCollection()
          .modify((session) => {
            session.sessionType = null;
            session.status = 'completed';
            session.key = null;
            session.tempo = null;
          });
      });

    this.version(3)
      .stores({
        sessions: '++id, startedAt, sessionType, status, userId, syncStatus',
        midiEvents: '++id, sessionId, [sessionId+timestamp], userId, syncStatus',
        analysisSnapshots: '++id, sessionId, createdAt, [sessionId+createdAt], userId, syncStatus',
      })
      .upgrade((tx) => {
        const tables = ['sessions', 'midiEvents', 'analysisSnapshots'] as const;
        return Promise.all(
          tables.map((table) =>
            tx
              .table(table)
              .toCollection()
              .modify((record) => {
                record.userId = null;
                record.syncStatus = 'pending';
                if (table === 'sessions') {
                  record.supabaseId = null;
                }
              })
          )
        );
      });

    this.version(4).stores({
      sessions: '++id, startedAt, sessionType, status, userId, syncStatus',
      midiEvents: '++id, sessionId, [sessionId+timestamp], userId, syncStatus',
      analysisSnapshots: '++id, sessionId, createdAt, [sessionId+createdAt], userId, syncStatus',
      skillProfiles: '++id, userId, lastAssessedAt, syncStatus',
    });
  }
}

// Guarded against SSR — indexedDB is only available in browser/test environments
export const db: MinstrelDatabase =
  typeof indexedDB !== 'undefined' ? new MinstrelDatabase() : (null as unknown as MinstrelDatabase);
