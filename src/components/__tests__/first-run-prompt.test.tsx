import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FirstRunPrompt } from '../first-run-prompt';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';

beforeEach(() => {
  vi.useFakeTimers();
  act(() => {
    useMidiStore.getState().reset();
  });
  useSessionStore.setState({
    activeSessionId: null,
    totalNotesPlayed: 0,
  });
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('FirstRunPrompt', () => {
  it('renders disconnected state when MIDI not connected', () => {
    render(<FirstRunPrompt />);

    expect(screen.getByTestId('first-run-prompt')).toBeInTheDocument();
    expect(screen.getByText('Connect your instrument to get started')).toBeInTheDocument();
  });

  it('renders connected state when MIDI is connected', () => {
    act(() => {
      useMidiStore.getState().setConnectionStatus('connected');
    });

    render(<FirstRunPrompt />);

    expect(screen.getByTestId('first-run-connected')).toBeInTheDocument();
    expect(screen.getByText('Play your first note')).toBeInTheDocument();
  });

  it('renders session-started confirmation when notes already played (race)', () => {
    useSessionStore.setState({ totalNotesPlayed: 5 });

    render(<FirstRunPrompt />);

    expect(screen.getByTestId('session-started-confirmation')).toBeInTheDocument();
    expect(screen.getByText('Session started')).toBeInTheDocument();
  });

  it('renders session-started confirmation when activeSessionId set (race)', () => {
    useSessionStore.setState({ activeSessionId: 42 });

    render(<FirstRunPrompt />);

    expect(screen.getByTestId('session-started-confirmation')).toBeInTheDocument();
    expect(screen.getByText('Session started')).toBeInTheDocument();
  });

  it('returns null when dismissed via localStorage', () => {
    localStorage.setItem('minstrel:first-run-dismissed', 'true');

    const { container } = render(<FirstRunPrompt />);

    expect(container.innerHTML).toBe('');
    expect(screen.queryByTestId('first-run-prompt')).toBeNull();
    expect(screen.queryByTestId('first-run-connected')).toBeNull();
    expect(screen.queryByTestId('session-started-confirmation')).toBeNull();
  });

  it('dismiss button persists to localStorage and hides prompt', () => {
    render(<FirstRunPrompt />);

    expect(screen.getByTestId('first-run-prompt')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Dismiss'));

    expect(screen.queryByTestId('first-run-prompt')).toBeNull();
    expect(localStorage.getItem('minstrel:first-run-dismissed')).toBe('true');
  });

  it('auto-dismisses on MIDI note-on event', () => {
    render(<FirstRunPrompt />);

    expect(screen.getByTestId('first-run-prompt')).toBeInTheDocument();

    // Simulate a note-on event arriving via the store
    act(() => {
      useMidiStore.setState({
        latestEvent: {
          type: 'note-on',
          note: 60,
          velocity: 100,
          channel: 0,
          timestamp: Date.now(),
        },
      });
    });

    expect(screen.queryByTestId('first-run-prompt')).toBeNull();
    expect(localStorage.getItem('minstrel:first-run-dismissed')).toBe('true');
  });

  it('"Skip for now" button dismisses the prompt', () => {
    render(<FirstRunPrompt />);

    expect(screen.getByTestId('first-run-prompt')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Skip for now'));

    expect(screen.queryByTestId('first-run-prompt')).toBeNull();
    expect(localStorage.getItem('minstrel:first-run-dismissed')).toBe('true');
  });

  it('session started confirmation shows correct text and auto-dismisses', () => {
    useSessionStore.setState({ totalNotesPlayed: 3 });

    render(<FirstRunPrompt />);

    expect(screen.getByTestId('session-started-confirmation')).toBeInTheDocument();
    expect(screen.getByText('Session started')).toBeInTheDocument();
    expect(screen.getByText('Listening to your playing.')).toBeInTheDocument();

    // Auto-dismisses after 2500ms
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.queryByTestId('session-started-confirmation')).toBeNull();
    expect(localStorage.getItem('minstrel:first-run-dismissed')).toBe('true');
  });
});
