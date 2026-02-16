import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AudioModeLimitations } from '../audio-mode-limitations';
import { useMidiStore } from '@/stores/midi-store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
  act(() => {
    useMidiStore.getState().reset();
  });
});

describe('AudioModeLimitations', () => {
  it('renders nothing when not in audio mode', () => {
    const { container } = render(<AudioModeLimitations />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('shows overlay when switching to audio mode after mount', () => {
    render(<AudioModeLimitations />);

    // Switch to audio mode AFTER mount so subscribe fires
    act(() => {
      useMidiStore.getState().setInputSource('audio');
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Audio Mode')).toBeInTheDocument();
    expect(screen.getByText('Some features are limited')).toBeInTheDocument();
  });

  it('lists disabled features', () => {
    render(<AudioModeLimitations />);

    act(() => {
      useMidiStore.getState().setInputSource('audio');
    });

    expect(screen.getByText('Exact velocity tracking')).toBeInTheDocument();
    expect(screen.getByText('Multi-note chord detection')).toBeInTheDocument();
    expect(screen.getByText('MIDI output demonstrations')).toBeInTheDocument();
  });

  it('dismisses on Got it click and remembers via localStorage', () => {
    render(<AudioModeLimitations />);

    act(() => {
      useMidiStore.getState().setInputSource('audio');
    });

    fireEvent.click(screen.getByText('Got it'));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('minstrel:audio-mode-explained', 'true');
  });

  it('does not show overlay if already explained', () => {
    localStorageMock.setItem('minstrel:audio-mode-explained', 'true');

    render(<AudioModeLimitations />);

    act(() => {
      useMidiStore.getState().setInputSource('audio');
    });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('dismisses on X button click', () => {
    render(<AudioModeLimitations />);

    act(() => {
      useMidiStore.getState().setInputSource('audio');
    });

    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
