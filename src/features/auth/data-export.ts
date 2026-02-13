import { db } from '@/lib/dexie/db';

export interface ServerExportData {
  exportedAt: string;
  userId: string;
  email: string | undefined;
  profile: Record<string, unknown> | null;
  sessions: Record<string, unknown>[];
  progressMetrics: Record<string, unknown>[];
  aiConversations: Record<string, unknown>[];
  apiKeys: Record<string, unknown>[];
  achievements: Record<string, unknown>[];
}

export interface LocalExportData {
  sessions: Record<string, unknown>[];
  midiEvents: Record<string, unknown>[];
  analysisSnapshots: Record<string, unknown>[];
  drillRecords: Record<string, unknown>[];
  skillProfiles: Record<string, unknown>[];
}

export interface FullExportData {
  server: ServerExportData;
  local: LocalExportData;
}

/**
 * Fetch all user data from the server API and local IndexedDB.
 * Combines both data sources into a single export payload.
 */
export async function exportUserData(): Promise<FullExportData> {
  // Fetch server data
  const response = await fetch('/api/user/export');
  if (!response.ok) {
    throw new Error(`Export failed: ${response.status} ${response.statusText}`);
  }
  const serverData: ServerExportData = await response.json();

  // Query local IndexedDB via Dexie
  let localData: LocalExportData = {
    sessions: [],
    midiEvents: [],
    analysisSnapshots: [],
    drillRecords: [],
    skillProfiles: [],
  };

  if (db) {
    try {
      const [sessions, midiEvents, analysisSnapshots, drillRecords, skillProfiles] =
        await Promise.all([
          db.sessions.toArray(),
          db.midiEvents.toArray(),
          db.analysisSnapshots.toArray(),
          db.drillRecords.toArray(),
          db.skillProfiles.toArray(),
        ]);

      localData = {
        sessions: sessions as unknown as Record<string, unknown>[],
        midiEvents: midiEvents as unknown as Record<string, unknown>[],
        analysisSnapshots: analysisSnapshots as unknown as Record<string, unknown>[],
        drillRecords: drillRecords as unknown as Record<string, unknown>[],
        skillProfiles: skillProfiles as unknown as Record<string, unknown>[],
      };
    } catch {
      // IndexedDB query failure is non-critical — include empty local data
      console.warn('Could not read local IndexedDB data for export');
    }
  }

  return { server: serverData, local: localData };
}

/**
 * Trigger a browser download of the export data as a JSON file.
 */
export function downloadExportAsJson(data: FullExportData): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `minstrel-data-export-${dateStr}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
}
