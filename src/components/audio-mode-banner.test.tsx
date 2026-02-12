import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('is not dismissible (no close button)', () => {
    useMidiStore.getState().setInputSource('audio');
    render(<AudioModeBanner />);
    expect(screen.queryByLabelText(/close|dismiss/i)).toBeNull();
  });
});
