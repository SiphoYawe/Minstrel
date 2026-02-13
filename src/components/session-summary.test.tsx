import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';
import { SessionSummary } from './session-summary';
import { useSessionStore } from '@/stores/session-store';

// Mock the XP calculator to return deterministic values
vi.mock('@/features/engagement/xp-calculator', () => ({
  calculateSessionXp: vi.fn(() => ({
    practiceXp: 10,
    timingBonusXp: 5,
    drillCompletionXp: 0,
    newRecordXp: 0,
    totalXp: 15,
  })),
  formatXpBreakdown: vi.fn(() => 'Practice: 10 XP, Timing Improvement: 5 XP = 15 XP'),
}));

describe('SessionSummary', () => {
  const defaultOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({
      sessionStartTimestamp: Date.now() - 300_000, // 5 minutes ago
      totalNotesPlayed: 42,
      currentKey: { root: 'C', mode: 'major', confidence: 0.9 },
      timingAccuracy: 85,
      snapshots: [],
      drillRepHistory: [],
      activeSessionId: 1,
    });
  });

  it('renders "Session Complete" heading', () => {
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    expect(screen.getByText('Session Complete')).toBeInTheDocument();
  });

  it('displays session duration', () => {
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    // 5 minutes = "5m 0s"
    expect(screen.getByText('5m 0s')).toBeInTheDocument();
  });

  it('displays total notes played', () => {
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('displays detected key', () => {
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    expect(screen.getByText('C major')).toBeInTheDocument();
  });

  it('displays "--" when no key detected', () => {
    useSessionStore.setState({ currentKey: null });
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('displays timing accuracy percentage', () => {
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('shows XP earned when totalXp > 0', () => {
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    expect(screen.getByTestId('xp-earned')).toBeInTheDocument();
    expect(screen.getByText('+15 XP')).toBeInTheDocument();
  });

  it('shows XP breakdown text', () => {
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    expect(
      screen.getByText('Practice: 10 XP, Timing Improvement: 5 XP = 15 XP')
    ).toBeInTheDocument();
  });

  it('displays latest coaching insight when snapshots exist', () => {
    useSessionStore.setState({
      snapshots: [
        {
          id: 'snap-1',
          key: null,
          chordsUsed: [],
          timingAccuracy: 85,
          averageTempo: 120,
          keyInsight: 'Strong rhythmic foundation detected.',
          insightCategory: 'timing',
          genrePatterns: [],
          timestamp: Date.now(),
        },
      ],
    });
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    expect(screen.getByText('Strong rhythmic foundation detected.')).toBeInTheDocument();
  });

  it('calls onDismiss when Done button is clicked', () => {
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    fireEvent.click(screen.getByText('Done'));
    expect(defaultOnDismiss).toHaveBeenCalledOnce();
  });

  it('calls onDismiss when close button is clicked', () => {
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    fireEvent.click(screen.getByLabelText('Close session summary'));
    expect(defaultOnDismiss).toHaveBeenCalledOnce();
  });

  it('renders Continue Practicing button when callback provided', () => {
    const onContinue = vi.fn();
    render(
      <SessionSummary onDismiss={defaultOnDismiss} onContinuePracticing={onContinue} />
    );
    const btn = screen.getByText('Continue Practicing');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('renders View Replay button when callback and activeSessionId provided', () => {
    const onReplay = vi.fn();
    render(<SessionSummary onDismiss={defaultOnDismiss} onViewReplay={onReplay} />);
    const btn = screen.getByText('View Replay');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onReplay).toHaveBeenCalledOnce();
  });

  it('does not render View Replay when no activeSessionId', () => {
    useSessionStore.setState({ activeSessionId: null });
    const onReplay = vi.fn();
    render(<SessionSummary onDismiss={defaultOnDismiss} onViewReplay={onReplay} />);
    expect(screen.queryByText('View Replay')).not.toBeInTheDocument();
  });

  it('renders Save & Review button when callback and activeSessionId provided', () => {
    const onSave = vi.fn();
    render(<SessionSummary onDismiss={defaultOnDismiss} onSaveAndReview={onSave} />);
    expect(screen.getByText('Save & Review')).toBeInTheDocument();
  });

  it('does not render Save & Review when no activeSessionId', () => {
    useSessionStore.setState({ activeSessionId: null });
    const onSave = vi.fn();
    render(<SessionSummary onDismiss={defaultOnDismiss} onSaveAndReview={onSave} />);
    expect(screen.queryByText('Save & Review')).not.toBeInTheDocument();
  });

  it('has role="dialog" and aria-modal for accessibility', () => {
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('has aria-label on the dialog', () => {
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('Session summary');
  });

  it('formats short durations correctly (under 1 minute)', () => {
    useSessionStore.setState({ sessionStartTimestamp: Date.now() - 30_000 });
    render(<SessionSummary onDismiss={defaultOnDismiss} />);
    expect(screen.getByText('30s')).toBeInTheDocument();
  });

  it('does not contain hardcoded hex color classes', () => {
    const { container } = render(<SessionSummary onDismiss={defaultOnDismiss} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/class="[^"]*#[0-9A-Fa-f]{3,8}[^"]*"/);
  });
});
