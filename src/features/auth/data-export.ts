import { db } from '@/lib/dexie/db';

export type ExportSectionStatus = 'complete' | 'failed';

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
  tokenUsage?: TokenUsageBreakdown[];
}

export interface TokenUsageBreakdown {
  provider: string;
  model: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  interactionCount: number;
}

export interface LocalExportData {
  sessions: Record<string, unknown>[];
  midiEvents: Record<string, unknown>[];
  analysisSnapshots: Record<string, unknown>[];
  drillRecords: Record<string, unknown>[];
  skillProfiles: Record<string, unknown>[];
}

export interface ExportStatus {
  sessions: ExportSectionStatus;
  midiEvents: ExportSectionStatus;
  analysisSnapshots: ExportSectionStatus;
  drillRecords: ExportSectionStatus;
  skillProfiles: ExportSectionStatus;
}

export interface FullExportData {
  server: ServerExportData;
  local: LocalExportData;
  exportStatus: ExportStatus;
}

/**
 * Query a single IndexedDB table, returning data and status.
 * Failures are non-critical — returns empty array and 'failed' status.
 */
async function safeQuery<T>(
  queryFn: () => Promise<T[]>
): Promise<{ data: Record<string, unknown>[]; status: ExportSectionStatus }> {
  try {
    const result = await queryFn();
    return {
      data: result as unknown as Record<string, unknown>[],
      status: 'complete',
    };
  } catch {
    console.warn('IndexedDB query failed for export section');
    return { data: [], status: 'failed' };
  }
}

/**
 * Fetch all user data from the server API and local IndexedDB.
 * Combines both data sources into a single export payload.
 * Each local section is queried independently so partial failures
 * are captured in exportStatus rather than losing all local data.
 */
export async function exportUserData(): Promise<FullExportData> {
  // Fetch server data
  const response = await fetch('/api/user/export');
  if (!response.ok) {
    throw new Error(`Export failed: ${response.status} ${response.statusText}`);
  }
  const serverData: ServerExportData = await response.json();

  // Default empty state
  const localData: LocalExportData = {
    sessions: [],
    midiEvents: [],
    analysisSnapshots: [],
    drillRecords: [],
    skillProfiles: [],
  };

  const exportStatus: ExportStatus = {
    sessions: 'complete',
    midiEvents: 'complete',
    analysisSnapshots: 'complete',
    drillRecords: 'complete',
    skillProfiles: 'complete',
  };

  if (db) {
    const [sessions, midiEvents, analysisSnapshots, drillRecords, skillProfiles] =
      await Promise.all([
        safeQuery(() => db.sessions.toArray()),
        safeQuery(() => db.midiEvents.toArray()),
        safeQuery(() => db.analysisSnapshots.toArray()),
        safeQuery(() => db.drillRecords.toArray()),
        safeQuery(() => db.skillProfiles.toArray()),
      ]);

    localData.sessions = sessions.data;
    localData.midiEvents = midiEvents.data;
    localData.analysisSnapshots = analysisSnapshots.data;
    localData.drillRecords = drillRecords.data;
    localData.skillProfiles = skillProfiles.data;

    exportStatus.sessions = sessions.status;
    exportStatus.midiEvents = midiEvents.status;
    exportStatus.analysisSnapshots = analysisSnapshots.status;
    exportStatus.drillRecords = drillRecords.status;
    exportStatus.skillProfiles = skillProfiles.status;
  }

  return { server: serverData, local: localData, exportStatus };
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
