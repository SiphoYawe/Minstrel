import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@/test-utils/render';
import { ReturnSessionBanner } from './return-session-banner';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';
import type { ContinuitySessionSummary } from '@/features/session/session-types';

function makeSession(
  overrides: Partial<ContinuitySessionSummary> = {}
): ContinuitySessionSummary {
  return {
    id: 1,
    date: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    durationMs: 600_000, // 10 minutes
    detectedKey: 'C major',
    averageTempo: 120,
    timingAccuracy: 0.85,
    chordsUsed: ['Cmaj', 'G7'],
    drillsCompleted: 2,
    keyInsight: 'Good rhythmic consistency.',
    weaknessAreas: ['timing'],
    snapshotCount: 3,
    ...overrides,
  };
}

describe('ReturnSessionBanner', () => {
  beforeEach(() => {
    useAppStore.setState({ isAuthenticated: true });
    useSessionStore.setState({
      recentSessions: [makeSession()],
      totalNotesPlayed: 0,
    });
    useMidiStore.setState({ latestEvent: null });
  });

  it('renders welcome back message for authenticated user with recent sessions', () => {
    render(<ReturnSessionBanner />);
    expect(screen.getByTestId('welcome-back-message')).toBeInTheDocument();
    expect(screen.getByText('Welcome back.')).toBeInTheDocument();
  });

  it('renders nothing for guest users', () => {
    useAppStore.setState({ isAuthenticated: false });
    const { container } = render(<ReturnSessionBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no recent sessions', () => {
    useSessionStore.setState({ recentSessions: [] });
    const { container } = render(<ReturnSessionBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when user is already playing', () => {
    useSessionStore.setState({ totalNotesPlayed: 10 });
    const { container } = render(<ReturnSessionBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows warmer message when absent for >3 days', () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    useSessionStore.setState({
      recentSessions: [makeSession({ date: fourDaysAgo })],
    });
    render(<ReturnSessionBanner />);
    expect(screen.getByTestId('long-absence-message')).toBeInTheDocument();
    expect(
      screen.getByText(/It's been a while — glad you're back!/)
    ).toBeInTheDocument();
  });

  it('shows normal message when absent for <3 days', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    useSessionStore.setState({
      recentSessions: [makeSession({ date: oneHourAgo })],
    });
    render(<ReturnSessionBanner />);
    expect(screen.getByTestId('welcome-back-message')).toBeInTheDocument();
  });

  it('displays last session date and key', () => {
    render(<ReturnSessionBanner />);
    expect(screen.getByText(/C major/)).toBeInTheDocument();
  });

  it('displays last session duration', () => {
    render(<ReturnSessionBanner />);
    expect(screen.getByText(/10 minutes/)).toBeInTheDocument();
  });

  it('displays last session key insight', () => {
    render(<ReturnSessionBanner />);
    expect(screen.getByText('Good rhythmic consistency.')).toBeInTheDocument();
  });

  it('shows "Pick up where you left off?" prompt', () => {
    render(<ReturnSessionBanner />);
    expect(screen.getByText('Pick up where you left off?')).toBeInTheDocument();
  });

  it('renders "Continue Where I Left Off" button', () => {
    render(<ReturnSessionBanner />);
    expect(
      screen.getByText('Continue Where I Left Off')
    ).toBeInTheDocument();
  });

  it('renders "Start Fresh" button', () => {
    render(<ReturnSessionBanner />);
    expect(screen.getByText('Start Fresh')).toBeInTheDocument();
  });

  it('calls onContinue and dismisses when Continue button clicked', () => {
    const onContinue = vi.fn();
    render(<ReturnSessionBanner onContinue={onContinue} />);
    fireEvent.click(screen.getByText('Continue Where I Left Off'));
    expect(onContinue).toHaveBeenCalledOnce();
    // Banner should now be dismissed
    expect(screen.queryByText('Continue Where I Left Off')).not.toBeInTheDocument();
  });

  it('calls onStartFresh and dismisses when Start Fresh button clicked', () => {
    const onStartFresh = vi.fn();
    render(<ReturnSessionBanner onStartFresh={onStartFresh} />);
    fireEvent.click(screen.getByText('Start Fresh'));
    expect(onStartFresh).toHaveBeenCalledOnce();
    expect(screen.queryByText('Start Fresh')).not.toBeInTheDocument();
  });

  it('auto-dismisses on MIDI note-on event via vanilla subscribe', () => {
    render(<ReturnSessionBanner />);
    expect(screen.getByText('Welcome back.')).toBeInTheDocument();

    act(() => {
      useMidiStore.setState({
        latestEvent: {
          type: 'note-on',
          note: 60,
          noteName: 'C4',
          velocity: 100,
          channel: 1,
          timestamp: Date.now(),
          source: 'midi',
        },
      });
    });

    expect(screen.queryByText('Welcome back.')).not.toBeInTheDocument();
  });

  it('does not auto-dismiss on control-change events', () => {
    render(<ReturnSessionBanner />);
    expect(screen.getByText('Welcome back.')).toBeInTheDocument();

    act(() => {
      useMidiStore.setState({
        latestEvent: {
          type: 'control-change',
          note: 64,
          noteName: '',
          velocity: 127,
          channel: 1,
          timestamp: Date.now(),
          source: 'midi',
        },
      });
    });

    expect(screen.getByText('Welcome back.')).toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(<ReturnSessionBanner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite" for screen reader announcements', () => {
    render(<ReturnSessionBanner />);
    const statusEl = screen.getByRole('status');
    expect(statusEl.getAttribute('aria-live')).toBe('polite');
  });

  it('does not contain hardcoded hex color classes', () => {
    const { container } = render(<ReturnSessionBanner />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/class="[^"]*#[0-9A-Fa-f]{3,8}[^"]*"/);
  });

  it('handles session with no detected key gracefully', () => {
    useSessionStore.setState({
      recentSessions: [makeSession({ detectedKey: null })],
    });
    render(<ReturnSessionBanner />);
    expect(screen.getByText('Welcome back.')).toBeInTheDocument();
    // Should not show key text
    expect(screen.queryByText(/C major/)).not.toBeInTheDocument();
  });

  it('handles session with no key insight gracefully', () => {
    useSessionStore.setState({
      recentSessions: [makeSession({ keyInsight: null })],
    });
    render(<ReturnSessionBanner />);
    expect(screen.getByText('Welcome back.')).toBeInTheDocument();
    expect(screen.queryByText('Good rhythmic consistency.')).not.toBeInTheDocument();
  });
});
