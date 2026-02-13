import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@/test-utils/render';
import { FirstRunPrompt } from './first-run-prompt';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';

describe('FirstRunPrompt', () => {
  beforeEach(() => {
    localStorage.removeItem('minstrel:first-run-dismissed');
    useMidiStore.setState({
      connectionStatus: 'disconnected',
      latestEvent: null,
    });
    useSessionStore.setState({
      activeSessionId: null,
      totalNotesPlayed: 0,
    });
  });

  afterEach(() => {
    useMidiStore.setState({
      connectionStatus: 'disconnected',
      latestEvent: null,
    });
    useSessionStore.setState({
      activeSessionId: null,
      totalNotesPlayed: 0,
    });
  });

  it('renders welcome message when disconnected', () => {
    render(<FirstRunPrompt />);
    expect(screen.getByText('Welcome to Minstrel.')).toBeInTheDocument();
    expect(screen.getByText('Connect your MIDI instrument and play something')).toBeInTheDocument();
  });

  it('shows "Waiting for a MIDI connection" when disconnected', () => {
    render(<FirstRunPrompt />);
    expect(screen.getByText('Waiting for a MIDI connection')).toBeInTheDocument();
  });

  it('shows "Detecting MIDI devices..." when connecting', () => {
    useMidiStore.setState({ connectionStatus: 'connecting' });
    render(<FirstRunPrompt />);
    expect(screen.getByText('Detecting MIDI devices...')).toBeInTheDocument();
  });

  it('shows unsupported browser message when unsupported', () => {
    useMidiStore.setState({ connectionStatus: 'unsupported' });
    render(<FirstRunPrompt />);
    expect(screen.getByText(/Web MIDI not supported/)).toBeInTheDocument();
  });

  it('renders connected state with "start playing" message', () => {
    useMidiStore.setState({ connectionStatus: 'connected' });
    render(<FirstRunPrompt />);
    expect(screen.getByText(/Connected — start playing whenever you're ready/)).toBeInTheDocument();
  });

  it('renders nothing when activeSessionId is set', () => {
    useSessionStore.setState({ activeSessionId: 1 });
    const { container } = render(<FirstRunPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when notes have been played', () => {
    useSessionStore.setState({ totalNotesPlayed: 5 });
    const { container } = render(<FirstRunPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('has role="status" for accessibility', () => {
    render(<FirstRunPrompt />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite" for screen reader announcements', () => {
    render(<FirstRunPrompt />);
    const statusEl = screen.getByRole('status');
    expect(statusEl.getAttribute('aria-live')).toBe('polite');
  });

  it('auto-dismisses on MIDI note-on event via vanilla subscribe', () => {
    render(<FirstRunPrompt />);
    expect(screen.getByText('Welcome to Minstrel.')).toBeInTheDocument();

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

    expect(screen.queryByText('Welcome to Minstrel.')).not.toBeInTheDocument();
  });

  it('does not dismiss on control-change events', () => {
    render(<FirstRunPrompt />);
    expect(screen.getByText('Welcome to Minstrel.')).toBeInTheDocument();

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

    expect(screen.getByText('Welcome to Minstrel.')).toBeInTheDocument();
  });

  it('shows downward arrow when not unsupported', () => {
    render(<FirstRunPrompt />);
    const prompt = screen.getByTestId('first-run-prompt');
    // Music icon SVG + ChevronDown SVG + X dismiss button SVG
    const svgs = prompt.querySelectorAll('svg');
    expect(svgs.length).toBe(3);
  });

  it('does not show arrow when unsupported', () => {
    useMidiStore.setState({ connectionStatus: 'unsupported' });
    render(<FirstRunPrompt />);
    const prompt = screen.getByTestId('first-run-prompt');
    // Music icon SVG + X dismiss button SVG (no ChevronDown)
    const svgs = prompt.querySelectorAll('svg');
    expect(svgs.length).toBe(2);
  });

  it('does not contain hardcoded hex color classes', () => {
    const { container } = render(<FirstRunPrompt />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/class="[^"]*#[0-9A-Fa-f]{3,8}[^"]*"/);
  });
});
