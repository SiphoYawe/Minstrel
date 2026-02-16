import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioModeBanner } from './audio-mode-banner';
import { useMidiStore } from '@/stores/midi-store';

describe('AudioModeBanner', () => {
  beforeEach(() => {
    useMidiStore.getState().reset();
  });

  it('renders nothing when inputSource is none', () => {
    const { container } = render(<AudioModeBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when inputSource is midi', () => {
    useMidiStore.getState().setInputSource('midi');
    const { container } = render(<AudioModeBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner when inputSource is audio', () => {
    useMidiStore.getState().setInputSource('audio');
    render(<AudioModeBanner />);
    expect(screen.getByText('Audio Mode')).toBeInTheDocument();
  });

  it('displays the correct guidance message', () => {
    useMidiStore.getState().setInputSource('audio');
    render(<AudioModeBanner />);
    expect(screen.getByText(/connect a MIDI device for full precision/)).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    useMidiStore.getState().setInputSource('audio');
    render(<AudioModeBanner />);
    const banner = screen.getByRole('status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
  });

  it('does not render Switch to MIDI button when no callback provided', () => {
    useMidiStore.getState().setInputSource('audio');
    render(<AudioModeBanner />);
    expect(screen.queryByText('Switch to MIDI')).not.toBeInTheDocument();
  });

  describe('Switch to MIDI button (Story 28.4)', () => {
    it('renders Switch to MIDI button when onSwitchToMidi is provided', () => {
      useMidiStore.getState().setInputSource('audio');
      render(<AudioModeBanner onSwitchToMidi={vi.fn()} />);
      expect(screen.getByText('Switch to MIDI')).toBeInTheDocument();
    });

    it('calls onSwitchToMidi when Switch to MIDI button is clicked', () => {
      useMidiStore.getState().setInputSource('audio');
      const onSwitchToMidi = vi.fn();
      render(<AudioModeBanner onSwitchToMidi={onSwitchToMidi} />);
      fireEvent.click(screen.getByText('Switch to MIDI'));
      expect(onSwitchToMidi).toHaveBeenCalledOnce();
    });

    it('Switch to MIDI button is a proper button element', () => {
      useMidiStore.getState().setInputSource('audio');
      render(<AudioModeBanner onSwitchToMidi={vi.fn()} />);
      const btn = screen.getByText('Switch to MIDI');
      expect(btn.tagName).toBe('BUTTON');
      expect(btn).toHaveAttribute('type', 'button');
    });
  });
});
