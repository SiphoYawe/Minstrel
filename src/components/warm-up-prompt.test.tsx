import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';
import { WarmUpPrompt } from './warm-up-prompt';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';
import { useMidiStore } from '@/stores/midi-store';

describe('WarmUpPrompt', () => {
  const onStartWarmUp = vi.fn();
  const onSkip = vi.fn();

  beforeEach(() => {
    onStartWarmUp.mockClear();
    onSkip.mockClear();
    localStorage.removeItem('minstrel:warmup-dismissed');

    // Set MIDI as connected so warm-up prompt can display
    useMidiStore.setState({ connectionStatus: 'connected' });

    // Set up a returning authenticated user with skill profile and recent sessions
    useAppStore.setState({ isAuthenticated: true });
    useSessionStore.setState({
      totalNotesPlayed: 0,
      isWarmingUp: false,
      skillProfile: {
        dimensions: { Speed: { value: 0.5, confidence: 0.8 } },
        overallLevel: 0.5,
        lastUpdated: new Date().toISOString(),
      },
      recentSessions: [
        {
          id: 1,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          durationMs: 60000,
          detectedKey: 'C major',
          averageTempo: 100,
          timingAccuracy: 0.8,
          chordsUsed: ['C', 'G'],
          drillsCompleted: 0,
          keyInsight: null,
          weaknessAreas: [],
          snapshotCount: 0,
        },
      ],
    });
  });

  it('renders the prompt for a returning authenticated user', () => {
    render(<WarmUpPrompt onStartWarmUp={onStartWarmUp} onSkip={onSkip} />);
    expect(screen.getByText('Warm up first?')).toBeInTheDocument();
    expect(screen.getByText('Start warm-up')).toBeInTheDocument();
    expect(screen.getByText('Skip')).toBeInTheDocument();
  });

  it('does not render for guests', () => {
    useAppStore.setState({ isAuthenticated: false });
    render(<WarmUpPrompt onStartWarmUp={onStartWarmUp} onSkip={onSkip} />);
    expect(screen.queryByText('Warm up first?')).not.toBeInTheDocument();
  });

  it('renders new-user warm-up when user has no recent sessions', () => {
    useSessionStore.setState({ recentSessions: [] });
    render(<WarmUpPrompt onStartWarmUp={onStartWarmUp} onSkip={onSkip} />);
    // Component still renders but shows the new-user copy instead of returning-user copy
    expect(screen.queryByText('Warm up first?')).not.toBeInTheDocument();
    expect(screen.getByText('Start with a warm-up')).toBeInTheDocument();
  });

  it('does not render when already playing', () => {
    useSessionStore.setState({ totalNotesPlayed: 10 });
    render(<WarmUpPrompt onStartWarmUp={onStartWarmUp} onSkip={onSkip} />);
    expect(screen.queryByText('Warm up first?')).not.toBeInTheDocument();
  });

  it('does not render during warm-up', () => {
    useSessionStore.setState({ isWarmingUp: true });
    render(<WarmUpPrompt onStartWarmUp={onStartWarmUp} onSkip={onSkip} />);
    expect(screen.queryByText('Warm up first?')).not.toBeInTheDocument();
  });

  it('calls onStartWarmUp and dismisses when "Start warm-up" is clicked', () => {
    render(<WarmUpPrompt onStartWarmUp={onStartWarmUp} onSkip={onSkip} />);
    fireEvent.click(screen.getByText('Start warm-up'));
    expect(onStartWarmUp).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Warm up first?')).not.toBeInTheDocument();
  });

  it('calls onSkip and dismisses when "Skip" is clicked', () => {
    render(<WarmUpPrompt onStartWarmUp={onStartWarmUp} onSkip={onSkip} />);
    fireEvent.click(screen.getByText('Skip'));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Warm up first?')).not.toBeInTheDocument();
  });

  it('shows long-absence message when away >= 3 days', () => {
    useSessionStore.setState({
      recentSessions: [
        {
          id: 1,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          durationMs: 60000,
          detectedKey: 'C major',
          averageTempo: 100,
          timingAccuracy: 0.8,
          chordsUsed: [],
          drillsCompleted: 0,
          keyInsight: null,
          weaknessAreas: [],
          snapshotCount: 0,
        },
      ],
    });
    render(<WarmUpPrompt onStartWarmUp={onStartWarmUp} onSkip={onSkip} />);
    expect(screen.getByText(/It's been a while/)).toBeInTheDocument();
  });

  it('does not show long-absence message when away < 3 days', () => {
    // recentSessions[0].date is 2 days ago (from beforeEach)
    render(<WarmUpPrompt onStartWarmUp={onStartWarmUp} onSkip={onSkip} />);
    expect(screen.queryByText(/It's been a while/)).not.toBeInTheDocument();
  });

  it('does not render when MIDI is not connected', () => {
    useMidiStore.setState({ connectionStatus: 'disconnected', inputSource: 'none' });
    render(<WarmUpPrompt onStartWarmUp={onStartWarmUp} onSkip={onSkip} />);
    expect(screen.queryByText('Warm up first?')).not.toBeInTheDocument();
  });

  it('renders when MIDI is connected (event-driven)', () => {
    useMidiStore.setState({ connectionStatus: 'connected' });
    render(<WarmUpPrompt onStartWarmUp={onStartWarmUp} onSkip={onSkip} />);
    expect(screen.getByText('Warm up first?')).toBeInTheDocument();
  });

  it('renders when in audio mode (event-driven)', () => {
    useMidiStore.setState({ connectionStatus: 'disconnected', inputSource: 'audio' });
    render(<WarmUpPrompt onStartWarmUp={onStartWarmUp} onSkip={onSkip} />);
    expect(screen.getByText('Warm up first?')).toBeInTheDocument();
  });
});
