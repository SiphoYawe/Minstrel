import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test-utils/render';
import { SessionHistoryList } from './session-history-list';

// Use vi.hoisted to define mock data before vi.mock hoisting
const { mockSessionsData, mockMidiEventsData, makeSessions } = vi.hoisted(() => {
  function makeSessions(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      startedAt: Date.now() - (i + 1) * 86400000,
      endedAt: Date.now() - (i + 1) * 86400000 + 1800000,
      duration: 1800000 - i * 10000,
      inputSource: 'midi' as const,
      sessionType: null,
      status: 'completed' as const,
      key: i % 2 === 0 ? 'C major' : 'G major',
      tempo: 100 + i * 5,
      userId: null,
      syncStatus: 'pending' as const,
      supabaseId: null,
    }));
  }

  return {
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
        status: 'recording' as const,
        key: null,
        tempo: null,
        userId: null,
        syncStatus: 'pending' as const,
        supabaseId: null,
      },
      {
        id: 3,
        startedAt: Date.now() - 259200000,
        endedAt: null,
        duration: null,
        inputSource: 'midi' as const,
        sessionType: null,
        status: 'idle' as const,
        key: 'D minor',
        tempo: 95,
        userId: null,
        syncStatus: 'pending' as const,
        supabaseId: null,
      },
    ],
    mockMidiEventsData: [
      {
        id: 1,
        sessionId: 1,
        type: 'note-on',
        note: 60,
        noteName: 'C4',
        velocity: 100,
        channel: 0,
        timestamp: 1,
        source: 'midi',
        userId: null,
        syncStatus: 'pending',
      },
      {
        id: 2,
        sessionId: 1,
        type: 'note-on',
        note: 64,
        noteName: 'E4',
        velocity: 80,
        channel: 0,
        timestamp: 2,
        source: 'midi',
        userId: null,
        syncStatus: 'pending',
      },
      {
        id: 3,
        sessionId: 2,
        type: 'note-on',
        note: 67,
        noteName: 'G4',
        velocity: 90,
        channel: 0,
        timestamp: 1,
        source: 'audio',
        userId: null,
        syncStatus: 'pending',
      },
    ],
    makeSessions,
  };
});

const mockOrderBy = vi.fn();
const mockReverse = vi.fn();
const mockToArray = vi.fn();
const mockWhere = vi.fn();
const mockEquals = vi.fn();
const mockDelete = vi.fn();
const mockWhereDelete = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/dexie/db', () => ({
  db: {
    sessions: {
      orderBy: (...args: unknown[]) => mockOrderBy(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    midiEvents: {
      where: (...args: unknown[]) => mockWhere(...args),
    },
    analysisSnapshots: {
      where: (...args: unknown[]) => mockWhere(...args),
    },
    transaction: (...args: unknown[]) => mockTransaction(...args),
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
      toArray: vi
        .fn()
        .mockResolvedValue(mockMidiEventsData.filter((e) => e.sessionId === sessionId)),
      delete: mockWhereDelete.mockResolvedValue(undefined),
    }));
    mockDelete.mockResolvedValue(undefined);
    mockTransaction.mockImplementation((_mode: string, ..._tables: unknown[]) => {
      const cb = _tables[_tables.length - 1];
      return typeof cb === 'function' ? (cb as () => Promise<void>)() : Promise.resolve();
    });
  });

  it('renders session cards after loading', async () => {
    render(<SessionHistoryList />);

    expect(screen.getByText('Loading sessions...')).toBeInTheDocument();

    const listItems = await screen.findAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  it('displays session metrics', async () => {
    render(<SessionHistoryList />);

    await screen.findAllByRole('listitem');

    expect(screen.getByText('C major')).toBeInTheDocument();

    const durationLabels = screen.getAllByText('Duration');
    expect(durationLabels.length).toBeGreaterThan(0);
  });

  it('displays note count from MIDI events', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

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

  it('shows session count with total', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    expect(screen.getByText('3 of 3 sessions')).toBeInTheDocument();
  });

  it('displays input source badges', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    const midiBadges = screen.getAllByText('MIDI');
    expect(midiBadges.length).toBe(2);
    expect(screen.getByText('Audio')).toBeInTheDocument();
  });

  it('displays all session status badges', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Abandoned')).toBeInTheDocument();
  });

  it('shows "--" for null key', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    const dashes = screen.getAllByText('--');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('displays tempo column with BPM suffix', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    const tempoLabels = screen.getAllByText('Tempo');
    expect(tempoLabels.length).toBe(3);

    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();

    const bpmSuffixes = screen.getAllByText('BPM');
    expect(bpmSuffixes.length).toBe(2);
  });

  it('shows status-specific visual indicators', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    const completeBadge = screen.getByText('Complete');
    expect(completeBadge.className).toContain('text-accent-success');

    const activeBadge = screen.getByText('Active');
    expect(activeBadge.className).toContain('text-accent-warm');

    const abandonedBadge = screen.getByText('Abandoned');
    expect(abandonedBadge.className).toContain('text-muted-foreground');
  });
});

describe('SessionHistoryList pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockOrderBy.mockReturnValue({ reverse: mockReverse });
    mockReverse.mockReturnValue({ toArray: mockToArray });
    // Return 25 sessions to test pagination (PAGE_SIZE = 20)
    mockToArray.mockResolvedValue(makeSessions(25));

    mockWhere.mockReturnValue({ equals: mockEquals });
    mockEquals.mockImplementation(() => ({
      toArray: vi.fn().mockResolvedValue([]),
    }));
  });

  it('shows first 20 sessions with Load More button', async () => {
    render(<SessionHistoryList />);

    const listItems = await screen.findAllByRole('listitem');
    expect(listItems).toHaveLength(20);

    expect(screen.getByText('Load More')).toBeInTheDocument();
    expect(screen.getByText('20 of 25 sessions')).toBeInTheDocument();
  });

  it('appends next page when Load More is clicked', async () => {
    render(<SessionHistoryList />);

    await screen.findAllByRole('listitem');
    expect(screen.getByText('Load More')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Load More'));

    await waitFor(() => {
      const allItems = screen.getAllByRole('listitem');
      expect(allItems).toHaveLength(25);
    });

    expect(screen.getByText('25 of 25 sessions')).toBeInTheDocument();
  });

  it('hides Load More when all sessions are loaded', async () => {
    render(<SessionHistoryList />);

    await screen.findAllByRole('listitem');
    fireEvent.click(screen.getByText('Load More'));

    await waitFor(() => {
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });
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

    const emptyMessage = await screen.findByText(
      'Play your first note to see your music come alive'
    );
    expect(emptyMessage).toBeInTheDocument();
    expect(screen.getByText('Start Playing')).toBeInTheDocument();
  });

  it('links to session page from empty state', async () => {
    render(<SessionHistoryList />);

    await screen.findByText('Play your first note to see your music come alive');

    const link = screen.getByText('Start Playing').closest('a');
    expect(link).toHaveAttribute('href', '/session');
  });
});

describe('SessionHistoryList deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockOrderBy.mockReturnValue({ reverse: mockReverse });
    mockReverse.mockReturnValue({ toArray: mockToArray });
    mockToArray.mockResolvedValue(mockSessionsData);

    mockWhere.mockReturnValue({ equals: mockEquals });
    mockEquals.mockImplementation((sessionId: number) => ({
      toArray: vi
        .fn()
        .mockResolvedValue(mockMidiEventsData.filter((e) => e.sessionId === sessionId)),
      delete: mockWhereDelete.mockResolvedValue(undefined),
    }));
    mockDelete.mockResolvedValue(undefined);
    mockTransaction.mockImplementation((_mode: string, ..._tables: unknown[]) => {
      const cb = _tables[_tables.length - 1];
      return typeof cb === 'function' ? (cb as () => Promise<void>)() : Promise.resolve();
    });
  });

  it('shows delete buttons on each session card', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    const deleteButtons = screen.getAllByLabelText(/Delete session from/);
    expect(deleteButtons).toHaveLength(3);
  });

  it('opens confirmation dialog when delete button is clicked', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    const deleteButtons = screen.getAllByLabelText(/Delete session from/);
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Delete this session?')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes confirmation dialog when Cancel is clicked', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    const deleteButtons = screen.getAllByLabelText(/Delete session from/);
    fireEvent.click(deleteButtons[0]);

    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('removes session from list after confirming deletion', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    expect(screen.getAllByRole('listitem')).toHaveLength(3);

    const deleteButtons = screen.getAllByLabelText(/Delete session from/);
    fireEvent.click(deleteButtons[0]);

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('2 of 2 sessions')).toBeInTheDocument();
  });

  it('calls Dexie transaction to delete session and related data', async () => {
    render(<SessionHistoryList />);
    await screen.findAllByRole('listitem');

    const deleteButtons = screen.getAllByLabelText(/Delete session from/);
    fireEvent.click(deleteButtons[0]);

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockTransaction).toHaveBeenCalled();
    });
  });
});
