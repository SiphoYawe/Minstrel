import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ChordHud } from './chord-hud';
import { useSessionStore } from '@/stores/session-store';

// Minimal mock for session store
vi.mock('@/stores/session-store', () => {
  const store = {
    detectedChords: [] as Array<{
      root: string;
      quality: string;
      notes: never[];
      timestamp: number;
    }>,
    currentKey: null as { root: string; mode: string; confidence: number } | null,
    currentHarmonicFunction: null as {
      romanNumeral: string;
      quality: string;
      isSecondary: boolean;
    } | null,
  };
  const useSessionStore = (selector: (s: typeof store) => unknown) => selector(store);
  useSessionStore._store = store;
  return { useSessionStore };
});

function setStore(overrides: Partial<typeof useSessionStore._store>) {
  Object.assign(
    (useSessionStore as unknown as { _store: Record<string, unknown> })._store,
    overrides
  );
}

describe('ChordHud', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setStore({
      detectedChords: [],
      currentKey: null,
      currentHarmonicFunction: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders "Play a chord..." placeholder when no chords detected', () => {
    render(<ChordHud />);
    expect(screen.getByText('Play a chord...')).toBeDefined();
  });

  it('has waiting aria-label when no chords detected', () => {
    render(<ChordHud />);
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe(
      'Waiting for chord detection'
    );
  });

  it('renders chord label when a chord is detected', () => {
    setStore({
      detectedChords: [{ root: 'C', quality: 'Major', notes: [], timestamp: 1000 }],
    });
    render(<ChordHud />);
    expect(screen.getByText('C')).toBeDefined();
  });

  it('renders minor chord with quality abbreviation', () => {
    setStore({
      detectedChords: [{ root: 'A', quality: 'Minor', notes: [], timestamp: 1000 }],
    });
    render(<ChordHud />);
    expect(screen.getByText('Am')).toBeDefined();
  });

  it('renders roman numeral when harmonic function is set', () => {
    setStore({
      detectedChords: [{ root: 'C', quality: 'Major', notes: [], timestamp: 1000 }],
      currentHarmonicFunction: { romanNumeral: 'I', quality: 'Major', isSecondary: false },
    });
    render(<ChordHud />);
    expect(screen.getByText('I')).toBeDefined();
  });

  it('shows idle label after 30 seconds of silence', () => {
    setStore({
      detectedChords: [{ root: 'C', quality: 'Major', notes: [], timestamp: 1000 }],
    });
    const { rerender } = render(<ChordHud />);

    // Advance past 30s idle threshold + 5s check interval
    act(() => {
      vi.advanceTimersByTime(35_000);
    });
    rerender(<ChordHud />);

    expect(screen.getByText('(last detected)')).toBeDefined();
  });
});
