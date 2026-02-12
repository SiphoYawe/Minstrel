import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBar } from './status-bar';
import { useMidiStore } from '@/stores/midi-store';

describe('StatusBar', () => {
  beforeEach(() => {
    useMidiStore.getState().reset();
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

  it('shows session timer placeholder', () => {
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
});
