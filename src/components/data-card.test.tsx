import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { DataCard } from './data-card';
import { useSessionStore } from '@/stores/session-store';

describe('DataCard', () => {
  beforeEach(() => {
    useSessionStore.setState({
      currentKey: null,
      currentTempo: null,
      timingAccuracy: 100,
      detectedChords: [],
    });
  });

  it('renders all four metric cards', () => {
    render(<DataCard />);
    expect(screen.getByText('Key')).toBeInTheDocument();
    expect(screen.getByText('Tempo')).toBeInTheDocument();
    expect(screen.getByText('Timing')).toBeInTheDocument();
    expect(screen.getByText('Chords')).toBeInTheDocument();
  });

  it('shows placeholder values when no data', () => {
    render(<DataCard />);
    const keyDisplay = screen.getByLabelText(/Current key/);
    expect(keyDisplay.textContent).toBe('--');
  });

  it('displays detected key', () => {
    useSessionStore.setState({
      currentKey: { root: 'C', mode: 'major', confidence: 0.9 },
    });
    render(<DataCard />);
    expect(screen.getByLabelText(/Current key: C major/)).toBeInTheDocument();
  });

  it('displays current tempo', () => {
    useSessionStore.setState({ currentTempo: 95.4 });
    render(<DataCard />);
    expect(screen.getByLabelText(/Current tempo: 95 BPM/)).toBeInTheDocument();
  });

  it('displays timing accuracy with blue color when high', () => {
    useSessionStore.setState({ timingAccuracy: 85 });
    render(<DataCard />);
    const el = screen.getByLabelText(/Timing accuracy: 85%/);
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('text-[#7CB9E8]');
  });

  it('displays timing accuracy with amber color when low', () => {
    useSessionStore.setState({ timingAccuracy: 65 });
    render(<DataCard />);
    const el = screen.getByLabelText(/Timing accuracy: 65%/);
    expect(el.className).toContain('text-[#D4A43C]');
  });

  it('displays recent chords', () => {
    useSessionStore.setState({
      detectedChords: [
        { root: 'C', quality: 'Major', notes: [], timestamp: 1 },
        { root: 'A', quality: 'Minor', notes: [], timestamp: 2 },
      ],
    });
    render(<DataCard />);
    expect(screen.getByLabelText(/Recent chords: C, Am/)).toBeInTheDocument();
  });

  it('has ARIA region label', () => {
    render(<DataCard />);
    expect(screen.getByRole('region', { name: 'Session metrics' })).toBeInTheDocument();
  });
});
