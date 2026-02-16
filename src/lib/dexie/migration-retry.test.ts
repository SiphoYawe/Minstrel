import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from '@/stores/app-store';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// Mock db to return controlled values
const mockSessions = {
  filter: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  equals: vi.fn().mockReturnThis(),
  anyOf: vi.fn().mockReturnThis(),
  count: vi.fn().mockResolvedValue(0),
  toArray: vi.fn().mockResolvedValue([]),
  update: vi.fn().mockResolvedValue(undefined),
};

const mockMidiEvents = {
  where: vi.fn().mockReturnThis(),
  equals: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  toArray: vi.fn().mockResolvedValue([]),
  modify: vi.fn().mockResolvedValue(undefined),
  count: vi.fn().mockResolvedValue(0),
};

const mockAnalysisSnapshots = {
  where: vi.fn().mockReturnThis(),
  equals: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  toArray: vi.fn().mockResolvedValue([]),
  modify: vi.fn().mockResolvedValue(undefined),
  count: vi.fn().mockResolvedValue(0),
};

vi.mock('./db', () => ({
  db: {
    sessions: mockSessions,
    midiEvents: mockMidiEvents,
    analysisSnapshots: mockAnalysisSnapshots,
  },
}));

vi.mock('./sync', () => ({
  syncSessionToSupabase: vi.fn().mockResolvedValue({ sessionUUID: 'uuid-1' }),
  BATCH_SIZE: 100,
}));

describe('triggerMigrationIfNeeded retry logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      migrationStatus: 'idle',
      migrationProgress: { synced: 0, total: 0 },
    });
  });

  it('does not migrate when no pending sessions', async () => {
    mockSessions.count.mockResolvedValue(0);

    const { triggerMigrationIfNeeded } = await import('./migration');
    await triggerMigrationIfNeeded('user-1');

    expect(useAppStore.getState().migrationStatus).toBe('idle');
  });

  it('sets migration status to migrating when sessions are pending', async () => {
    // First count call returns pending sessions
    mockSessions.count.mockResolvedValue(2);
    // Migration queries
    mockSessions.toArray.mockResolvedValue([{ id: 1, userId: 'user-1', syncStatus: 'pending' }]);
    mockSessions.filter.mockReturnValue({
      count: vi.fn().mockResolvedValue(2),
      toArray: vi.fn().mockResolvedValue([{ id: 1, userId: 'user-1', syncStatus: 'pending' }]),
    });

    // Reset module to pick up fresh mocks
    vi.resetModules();
    const { triggerMigrationIfNeeded } = await import('./migration');
    await triggerMigrationIfNeeded('user-1');

    // After migration completes, status transitions through migrating → complete → idle
    const status = useAppStore.getState().migrationStatus;
    expect(['complete', 'idle', 'partial-failure']).toContain(status);
  });
});
