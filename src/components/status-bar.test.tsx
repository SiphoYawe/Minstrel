import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StatusBar } from './status-bar';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';

describe('StatusBar', () => {
  beforeEach(() => {
    useMidiStore.getState().reset();
    useSessionStore.getState().setCurrentMode('silent-coach');
    useSessionStore.getState().setSessionStartTimestamp(null);
    useSessionStore.getState().resetAnalysis();
  });

  it('renders with disconnected state by default', () => {
    render(<StatusBar />);
    expect(screen.getByText('Disconnected')).toBeDefined();
  });

  it('shows "Connected" with device name when MIDI device is connected', () => {
    useMidiStore.getState().setConnectionStatus('connected');
    useMidiStore.getState().setActiveDevice({
      id: 'i1',
      name: 'Yamaha P-125',
      manufacturer: 'Yamaha',
      state: 'connected',
      type: 'input',
    });

    render(<StatusBar />);
    expect(screen.getByText('Connected')).toBeDefined();
    expect(screen.getByText('Yamaha P-125')).toBeDefined();
  });

  it('shows "Disconnected" when device is unplugged', () => {
    useMidiStore.getState().setConnectionStatus('disconnected');

    render(<StatusBar />);
    expect(screen.getByText('Disconnected')).toBeDefined();
  });

  it('shows "Unsupported" with error message for unsupported browsers', () => {
    useMidiStore.getState().setConnectionStatus('unsupported');
    useMidiStore
      .getState()
      .setErrorMessage('Minstrel works best in Chrome or Edge for full MIDI support.');

    render(<StatusBar />);
    expect(screen.getByText('Unsupported')).toBeDefined();
    expect(
      screen.getByText('Minstrel works best in Chrome or Edge for full MIDI support.')
    ).toBeDefined();
  });

  it('shows session timer at 00:00 when no session started', () => {
    render(<StatusBar />);
    expect(screen.getByText('00:00')).toBeDefined();
  });

  it('has aria-live for accessibility', () => {
    render(<StatusBar />);
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('shows "Connecting" during connection attempt', () => {
    useMidiStore.getState().setConnectionStatus('connecting');
    render(<StatusBar />);
    expect(screen.getByText('Connecting')).toBeDefined();
  });

  it('shows error message when status is error', () => {
    useMidiStore.getState().setConnectionStatus('error');
    useMidiStore.getState().setErrorMessage('MIDI access was not granted.');

    render(<StatusBar />);
    expect(screen.getByText('Error')).toBeDefined();
    expect(screen.getByText('MIDI access was not granted.')).toBeDefined();
  });

  it('shows Help button when disconnected', () => {
    useMidiStore.getState().setConnectionStatus('disconnected');
    render(<StatusBar />);
    expect(screen.getByText('Help')).toBeDefined();
  });

  it('shows Help button when error', () => {
    useMidiStore.getState().setConnectionStatus('error');
    render(<StatusBar />);
    expect(screen.getByText('Help')).toBeDefined();
  });

  it('does not show Help button when connected', () => {
    useMidiStore.getState().setConnectionStatus('connected');
    render(<StatusBar />);
    expect(screen.queryByText('Help')).toBeNull();
  });

  it('clicking Help sets showTroubleshooting to true in store', () => {
    useMidiStore.getState().setConnectionStatus('disconnected');
    render(<StatusBar />);
    fireEvent.click(screen.getByText('Help'));
    expect(useMidiStore.getState().showTroubleshooting).toBe(true);
  });

  it('renders as a header element positioned at top', () => {
    render(<StatusBar />);
    const header = document.querySelector('header[role="status"]');
    expect(header).not.toBeNull();
  });

  it('displays detected key when available', () => {
    useSessionStore.getState().setKeyCenter({ root: 'C', mode: 'major', confidence: 0.9 });
    render(<StatusBar />);
    expect(screen.getByText('C major')).toBeDefined();
  });

  it('displays tempo when available', () => {
    useSessionStore.getState().setTimingData({
      tempo: 120,
      accuracy: 100,
      deviations: [],
      tempoHistory: [],
    });
    render(<StatusBar />);
    expect(screen.getByText('120 BPM')).toBeDefined();
  });

  it('timer ticks when sessionStartTimestamp is set', () => {
    vi.useFakeTimers();
    const startTime = Date.now();
    useSessionStore.getState().setSessionStartTimestamp(startTime);

    render(<StatusBar />);
    expect(screen.getByText('00:00')).toBeDefined();

    // Advance 65 seconds
    act(() => {
      vi.advanceTimersByTime(65_000);
    });

    expect(screen.getByText('01:05')).toBeDefined();
    vi.useRealTimers();
  });

  it('timer resets to 00:00 when sessionStartTimestamp becomes null', () => {
    vi.useFakeTimers();
    useSessionStore.getState().setSessionStartTimestamp(Date.now());

    const { rerender } = render(<StatusBar />);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByText('00:05')).toBeDefined();

    // Clear timestamp
    act(() => {
      useSessionStore.getState().setSessionStartTimestamp(null);
    });
    rerender(<StatusBar />);

    expect(screen.getByText('00:00')).toBeDefined();
    vi.useRealTimers();
  });
});
