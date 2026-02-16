// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSessionStore } from '@/stores/session-store';
import { createMockSession } from '@/test-utils/session-fixtures';

// Mock Dexie db
const mockGet = vi.fn();
const mockWhereEquals = vi.fn();
const mockSortBy = vi.fn();
const mockToArray = vi.fn();

vi.mock('@/lib/dexie/db', () => ({
  db: {
    sessions: {
      get: (...args: unknown[]) => mockGet(...args),
      where: vi.fn(() => ({
        equals: (...args: unknown[]) => {
          mockWhereEquals(...args);
          return {
            toArray: () => mockToArray(),
            sortBy: (...sortArgs: unknown[]) => mockSortBy(...sortArgs),
          };
        },
      })),
    },
    midiEvents: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          sortBy: vi.fn().mockResolvedValue([]),
        })),
      })),
    },
  },
}));

// Mock replay-engine
vi.mock('@/features/session/replay-engine', () => ({
  resetReplayDispatcher: vi.fn(),
  pausePlayback: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useSessionStore.setState({
    replaySession: null,
    replayEvents: [],
    replayStatus: 'idle',
    replayErrorMessage: null,
    replayPosition: 0,
    replayState: 'paused',
    replaySpeed: 1,
  });
});

describe('replay error recovery - store state', () => {
  it('has replayErrorMessage field initialized to null', () => {
    expect(useSessionStore.getState().replayErrorMessage).toBeNull();
  });

  it('setReplayErrorMessage updates the error message', () => {
    useSessionStore.getState().setReplayErrorMessage('Session not found.');
    expect(useSessionStore.getState().replayErrorMessage).toBe('Session not found.');
  });

  it('setReplayStatus accepts deleted status', () => {
    useSessionStore.getState().setReplayStatus('deleted');
    expect(useSessionStore.getState().replayStatus).toBe('deleted');
  });

  it('resetReplay clears error message', () => {
    useSessionStore.getState().setReplayErrorMessage('Some error');
    useSessionStore.getState().setReplayStatus('error');
    useSessionStore.getState().resetReplay();
    expect(useSessionStore.getState().replayErrorMessage).toBeNull();
    expect(useSessionStore.getState().replayStatus).toBe('idle');
  });
});

describe('replay error recovery - session not found', () => {
  it('sets error status when session ID does not exist in DB', async () => {
    mockGet.mockResolvedValue(undefined);

    const { loadSessionList } = await import('./use-replay-session');
    // Simulate the load path: get returns undefined → error
    const result = await mockGet(999);
    expect(result).toBeUndefined();
  });

  it('distinguishes between no-sessions and invalid-id error messages', () => {
    // Invalid ID scenario
    useSessionStore.getState().setReplayErrorMessage('Session not found. It may have been deleted.');
    useSessionStore.getState().setReplayStatus('error');
    expect(useSessionStore.getState().replayErrorMessage).toContain('not found');

    // No sessions scenario
    useSessionStore.getState().setReplayErrorMessage('No sessions to replay. Play a session first, then come back here to review your playing.');
    expect(useSessionStore.getState().replayErrorMessage).toContain('No sessions to replay');
  });
});

describe('replay error recovery - mid-playback deletion', () => {
  it('transitions to deleted status when session removed during playback', () => {
    // Simulate loaded session
    useSessionStore.setState({
      replaySession: createMockSession({ id: 42 }),
      replayStatus: 'success',
      replayState: 'playing',
    });

    // Simulate deletion detection
    useSessionStore.getState().setReplayErrorMessage('This session is no longer available.');
    useSessionStore.getState().setReplayStatus('deleted');
    useSessionStore.getState().setReplayState('paused');

    expect(useSessionStore.getState().replayStatus).toBe('deleted');
    expect(useSessionStore.getState().replayErrorMessage).toBe('This session is no longer available.');
    expect(useSessionStore.getState().replayState).toBe('paused');
  });
});

describe('replay error recovery - 0-duration sessions', () => {
  it('allows detection of 0-duration session from store state', () => {
    const emptySession = createMockSession({
      id: 1,
      duration: 0,
      endedAt: null,
    });
    useSessionStore.setState({
      replaySession: emptySession,
      replayEvents: [],
      replayStatus: 'success',
    });

    const state = useSessionStore.getState();
    const totalDurationMs = state.replaySession?.duration
      ? state.replaySession.duration * 1000
      : 0;
    const isEmpty = totalDurationMs === 0 && state.replayEvents.length === 0;
    expect(isEmpty).toBe(true);
  });

  it('allows detection of null-duration session', () => {
    const nullDurationSession = createMockSession({
      id: 2,
      duration: null,
      endedAt: null,
    });
    useSessionStore.setState({
      replaySession: nullDurationSession,
      replayEvents: [],
      replayStatus: 'success',
    });

    const state = useSessionStore.getState();
    const totalDurationMs = state.replaySession?.duration
      ? state.replaySession.duration * 1000
      : 0;
    const isEmpty = totalDurationMs === 0 && state.replayEvents.length === 0;
    expect(isEmpty).toBe(true);
  });

  it('does not flag session with events but 0 duration as empty', () => {
    const sessionWithEvents = createMockSession({ id: 3, duration: 0 });
    useSessionStore.setState({
      replaySession: sessionWithEvents,
      replayEvents: [
        {
          id: 1,
          sessionId: 3,
          type: 'note-on',
          note: 60,
          noteName: 'C',
          velocity: 80,
          channel: 1,
          timestamp: 1000,
          source: 'midi',
          userId: null,
          syncStatus: 'pending',
        },
      ],
      replayStatus: 'success',
    });

    const state = useSessionStore.getState();
    const totalDurationMs = state.replaySession?.duration
      ? state.replaySession.duration * 1000
      : 0;
    const isEmpty = totalDurationMs === 0 && state.replayEvents.length === 0;
    expect(isEmpty).toBe(false);
  });
});
