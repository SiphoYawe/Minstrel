import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { SessionHistoryList } from './session-history-list';

// Use vi.hoisted to define mock data before vi.mock hoisting
const { mockSessionsData, mockMidiEventsData } = vi.hoisted(() => ({
  mockSessionsData: [
    {
      id: 1,
      startedAt: Date.now() - 86400000,
      endedAt: Date.now() - 86400000 + 1800000,
      duration: 1800000,
      inputSource: 'midi' as const,
      sessionType: null,
      status: 'completed' as const,
      key: 'C major',
      tempo: 120,
      userId: null,
      syncStatus: 'pending' as const,
      supabaseId: null,
    },
    {
      id: 2,
      startedAt: Date.now() - 172800000,
      endedAt: Date.now() - 172800000 + 600000,
      duration: 600000,
      inputSource: 'audio' as const,
      sessionType: null,
      status: 'completed' as const,
      key: null,
      tempo: null,
      userId: null,
      syncStatus: 'pending' as const,
      supabaseId: null,
    },
  ],
  mockMidiEventsData: [
    { id: 1, sessionId: 1, type: 'note-on', note: 60, noteName: 'C4', velocity: 100, channel: 0, timestamp: 1, source: 'midi', userId: null, syncStatus: 'pending' },
    { id: 2, sessionId: 1, type: 'note-on', note: 64, noteName: 'E4', velocity: 80, channel: 0, timestamp: 2, source: 'midi', userId: null, syncStatus: 'pending' },
    { id: 3, sessionId: 2, type: 'note-on', note: 67, noteName: 'G4', velocity: 90, channel: 0, timestamp: 1, source: 'audio', userId: null, syncStatus: 'pending' },
  ],
}));

const mockOrderBy = vi.fn();
const mockReverse = vi.fn();
const mockToArray = vi.fn();
const mockWhere = vi.fn();
const mockEquals = vi.fn();

vi.mock('@/lib/dexie/db', () => ({
  db: {
    sessions: {
      orderBy: (...args: unknown[]) => mockOrderBy(...args),
    },
    midiEvents: {
      where: (...args: unknown[]) => mockWhere(...args),
    },
  },
}));

describe('SessionHistoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockOrderBy.mockReturnValue({ reverse: mockReverse });
    mockReverse.mockReturnValue({ toArray: mockToArray });
    mockToArray.mockResolvedValue(mockSessionsData);

    mockWhere.mockReturnValue({ equals: mockEquals });
    mockEquals.mockImplementation((sessionId: number) => ({
      toArray: vi.fn().mockResolvedValue(
        mockMidiEventsData.filter((e) => e.sessionId === sessionId)
      ),
    }));
  });

  it('renders session cards after loading', async () => {
    render(<SessionHistoryList />);

    // Should show loading initially
    expect(screen.getByText('Loading sessions...')).toBeInTheDocument();

    // Wait for sessions to load
    const listItems = await screen.findAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });

  it('displays session metrics', async () => {
    render(<SessionHistoryList />);

    await screen.findAllByRole('listitem');

    // Check that key is displayed
    expect(screen.getByText('C major')).toBeInTheDocument();

    // Check duration label exists
    const durationLabels = screen.getAllByText('Duration');
    expect(durationLabels.length).toBeGreaterThan(0);
  });

  it('displays note count from MIDI events', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    // Session 1 has 2 noteOn events, session 2 has 1
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows sort controls', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    expect(screen.getByText('Most Recent')).toBeInTheDocument();
    expect(screen.getByText('Longest')).toBeInTheDocument();
    expect(screen.getByText('Most Notes')).toBeInTheDocument();
  });

  it('shows total session count', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    expect(screen.getByText('2 sessions total')).toBeInTheDocument();
  });

  it('displays input source badges', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    expect(screen.getByText('MIDI')).toBeInTheDocument();
    expect(screen.getByText('Audio')).toBeInTheDocument();
  });

  it('displays completed status badge', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    const completeBadges = screen.getAllByText('Complete');
    expect(completeBadges).toHaveLength(2);
  });

  it('shows "--" for null key', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    // Session 2 has null key
    const dashes = screen.getAllByText('--');
    expect(dashes.length).toBeGreaterThan(0);
  });
});

describe('SessionHistoryList empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrderBy.mockReturnValue({ reverse: mockReverse });
    mockReverse.mockReturnValue({ toArray: mockToArray });
    mockToArray.mockResolvedValue([]);
  });

  it('renders empty state when no sessions', async () => {
    render(<SessionHistoryList />);

    const emptyMessage = await screen.findByText('No sessions yet');
    expect(emptyMessage).toBeInTheDocument();
    expect(screen.getByText('Start Practicing')).toBeInTheDocument();
  });

  it('links to session page from empty state', async () => {
    render(<SessionHistoryList />);

    await screen.findByText('No sessions yet');

    const link = screen.getByText('Start Practicing').closest('a');
    expect(link).toHaveAttribute('href', '/session');
  });
});
