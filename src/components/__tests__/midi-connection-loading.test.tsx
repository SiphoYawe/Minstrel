import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MidiConnectionLoading } from '../midi-connection-loading';
import { useMidiStore } from '@/stores/midi-store';

beforeEach(() => {
  vi.useFakeTimers();
  act(() => {
    useMidiStore.getState().reset();
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('MidiConnectionLoading', () => {
  it('renders nothing when disconnected', () => {
    const { container } = render(<MidiConnectionLoading />);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('renders nothing when connected', () => {
    act(() => {
      useMidiStore.getState().setConnectionStatus('connected');
    });
    const { container } = render(<MidiConnectionLoading />);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('shows loading indicator when connecting', () => {
    act(() => {
      useMidiStore.getState().setConnectionStatus('connecting');
    });
    render(<MidiConnectionLoading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Connecting to your instrument...')).toBeInTheDocument();
  });

  it('shows timeout message after 15 seconds', () => {
    act(() => {
      useMidiStore.getState().setConnectionStatus('connecting');
    });
    render(<MidiConnectionLoading />);

    // Before timeout
    expect(screen.getByText('Connecting to your instrument...')).toBeInTheDocument();

    // Advance past 15s
    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    expect(screen.getByText('Taking longer than expected to find your device')).toBeInTheDocument();
    expect(
      screen.getByText('Check that your MIDI device is powered on and connected via USB')
    ).toBeInTheDocument();
  });

  it('hides when connection succeeds', () => {
    act(() => {
      useMidiStore.getState().setConnectionStatus('connecting');
    });
    const { container } = render(<MidiConnectionLoading />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      useMidiStore.getState().setConnectionStatus('connected');
    });
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('hides when connection errors', () => {
    act(() => {
      useMidiStore.getState().setConnectionStatus('connecting');
    });
    const { container } = render(<MidiConnectionLoading />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      useMidiStore.getState().setConnectionStatus('error');
    });
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('resets timeout when connection status changes', () => {
    act(() => {
      useMidiStore.getState().setConnectionStatus('connecting');
    });
    render(<MidiConnectionLoading />);

    // Advance 10s
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('Connecting to your instrument...')).toBeInTheDocument();

    // Disconnect and reconnect — should reset timer
    act(() => {
      useMidiStore.getState().setConnectionStatus('disconnected');
    });
    act(() => {
      useMidiStore.getState().setConnectionStatus('connecting');
    });

    // 10s later (20s total) — should still show normal state since timer reset
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('Connecting to your instrument...')).toBeInTheDocument();

    // 5 more seconds — now should be timed out
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByText('Taking longer than expected to find your device')).toBeInTheDocument();
  });
});
