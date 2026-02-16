import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportUserData, downloadExportAsJson } from './data-export';
import type { FullExportData } from './data-export';

// Mock Dexie db
vi.mock('@/lib/dexie/db', () => ({
  db: {
    sessions: { toArray: vi.fn().mockResolvedValue([]) },
    midiEvents: { toArray: vi.fn().mockResolvedValue([]) },
    analysisSnapshots: { toArray: vi.fn().mockResolvedValue([]) },
    drillRecords: { toArray: vi.fn().mockResolvedValue([]) },
    skillProfiles: { toArray: vi.fn().mockResolvedValue([]) },
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('exportUserData', () => {
  const mockServerData = {
    exportedAt: '2026-02-13T00:00:00.000Z',
    userId: 'user-123',
    email: 'test@example.com',
    profile: { email: 'test@example.com', display_name: 'Test', created_at: '2026-01-01' },
    sessions: [{ id: 'session-1' }],
    progressMetrics: [],
    aiConversations: [],
    apiKeys: [{ provider: 'openai', created_at: '2026-01-01', last_four: 'abcd' }],
    achievements: [],
  };

  it('fetches server data and combines with local IndexedDB data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockServerData),
    });

    const result = await exportUserData();

    expect(mockFetch).toHaveBeenCalledWith('/api/user/export');
    expect(result.server).toEqual(mockServerData);
    expect(result.local).toEqual({
      sessions: [],
      midiEvents: [],
      analysisSnapshots: [],
      drillRecords: [],
      skillProfiles: [],
    });
  });

  it('includes exportStatus with all sections marked complete on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockServerData),
    });

    const result = await exportUserData();

    expect(result.exportStatus).toEqual({
      sessions: 'complete',
      midiEvents: 'complete',
      analysisSnapshots: 'complete',
      drillRecords: 'complete',
      skillProfiles: 'complete',
    });
  });

  it('throws when server fetch fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    await expect(exportUserData()).rejects.toThrow('Export failed: 401 Unauthorized');
  });

  it('includes local data from IndexedDB when available', async () => {
    const { db } = await import('@/lib/dexie/db');
    vi.mocked(db.sessions.toArray).mockResolvedValue([
      { id: 1, startedAt: 100, endedAt: 200 } as never,
    ]);

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockServerData),
    });

    const result = await exportUserData();

    expect(result.local.sessions).toHaveLength(1);
    expect(result.exportStatus.sessions).toBe('complete');
  });

  it('marks individual sections as failed when their IndexedDB query throws', async () => {
    const { db } = await import('@/lib/dexie/db');

    // Make midiEvents and drillRecords fail, others succeed
    vi.mocked(db.sessions.toArray).mockResolvedValue([]);
    vi.mocked(db.midiEvents.toArray).mockRejectedValue(new Error('IndexedDB read error'));
    vi.mocked(db.analysisSnapshots.toArray).mockResolvedValue([]);
    vi.mocked(db.drillRecords.toArray).mockRejectedValue(new Error('Quota exceeded'));
    vi.mocked(db.skillProfiles.toArray).mockResolvedValue([]);

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockServerData),
    });

    const result = await exportUserData();

    // Failed sections
    expect(result.exportStatus.midiEvents).toBe('failed');
    expect(result.exportStatus.drillRecords).toBe('failed');
    expect(result.local.midiEvents).toEqual([]);
    expect(result.local.drillRecords).toEqual([]);

    // Successful sections still have data
    expect(result.exportStatus.sessions).toBe('complete');
    expect(result.exportStatus.analysisSnapshots).toBe('complete');
    expect(result.exportStatus.skillProfiles).toBe('complete');
  });

  it('resets to complete status after previous failures', async () => {
    const { db } = await import('@/lib/dexie/db');

    // Explicitly reset all mocks to resolve with empty arrays
    vi.mocked(db.sessions.toArray).mockResolvedValue([]);
    vi.mocked(db.midiEvents.toArray).mockResolvedValue([]);
    vi.mocked(db.analysisSnapshots.toArray).mockResolvedValue([]);
    vi.mocked(db.drillRecords.toArray).mockResolvedValue([]);
    vi.mocked(db.skillProfiles.toArray).mockResolvedValue([]);

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockServerData),
    });

    const result = await exportUserData();

    // All sections should be marked complete when queries succeed
    expect(result.exportStatus.sessions).toBe('complete');
    expect(result.exportStatus.midiEvents).toBe('complete');
    expect(result.exportStatus.analysisSnapshots).toBe('complete');
    expect(result.exportStatus.drillRecords).toBe('complete');
    expect(result.exportStatus.skillProfiles).toBe('complete');
  });
});

describe('downloadExportAsJson', () => {
  it('creates a download link with correct filename format', () => {
    const mockClick = vi.fn();
    const mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue({
      click: mockClick,
      href: '',
      download: '',
    } as unknown as HTMLAnchorElement);

    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const data: FullExportData = {
      server: {
        exportedAt: '2026-02-13T00:00:00.000Z',
        userId: 'user-123',
        email: 'test@example.com',
        profile: null,
        sessions: [],
        progressMetrics: [],
        aiConversations: [],
        apiKeys: [],
        achievements: [],
      },
      local: {
        sessions: [],
        midiEvents: [],
        analysisSnapshots: [],
        drillRecords: [],
        skillProfiles: [],
      },
      exportStatus: {
        sessions: 'complete',
        midiEvents: 'complete',
        analysisSnapshots: 'complete',
        drillRecords: 'complete',
        skillProfiles: 'complete',
      },
    };

    downloadExportAsJson(data);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test');
    mockCreateElement.mockRestore();
  });
});
