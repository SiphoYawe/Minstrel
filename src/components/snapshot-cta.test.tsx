import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { SnapshotCTA } from './snapshot-cta';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';
import type { InstantSnapshot } from '@/features/analysis/analysis-types';

const fakeSnapshot: InstantSnapshot = {
  id: 'snap-1',
  key: null,
  chordsUsed: [],
  timingAccuracy: 85,
  averageTempo: 120,
  keyInsight: 'Great rhythmic consistency',
  insightCategory: 'timing',
  genrePatterns: [],
  timestamp: Date.now(),
};

describe('SnapshotCTA', () => {
  beforeEach(() => {
    // Reset stores to initial state
    useSessionStore.setState({
      currentSnapshot: null,
      currentMode: 'silent-coach',
    });
    useAppStore.setState({
      hasApiKey: false,
      apiKeyProvider: null,
    });
  });

  it('renders nothing when no snapshot is present', () => {
    const { container } = render(<SnapshotCTA />);
    expect(container.firstChild).toBeNull();
  });

  it('renders both buttons when a snapshot exists', () => {
    useSessionStore.setState({ currentSnapshot: fakeSnapshot });
    render(<SnapshotCTA />);
    expect(screen.getByRole('button', { name: /view dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate drill/i })).toBeInTheDocument();
  });

  it('switches mode to dashboard-chat when View Dashboard is clicked', () => {
    useSessionStore.setState({ currentSnapshot: fakeSnapshot });
    render(<SnapshotCTA />);
    screen.getByRole('button', { name: /view dashboard/i }).click();
    expect(useSessionStore.getState().currentMode).toBe('dashboard-chat');
  });

  it('calls onGenerateDrill and switches mode when Generate Drill is clicked', () => {
    useSessionStore.setState({ currentSnapshot: fakeSnapshot });
    useAppStore.setState({ hasApiKey: true });
    const onGenerate = vi.fn();
    render(<SnapshotCTA onGenerateDrill={onGenerate} />);
    screen.getByRole('button', { name: /generate drill/i }).click();
    expect(onGenerate).toHaveBeenCalledOnce();
    expect(useSessionStore.getState().currentMode).toBe('dashboard-chat');
  });

  it('disables Generate Drill when no API key is present', () => {
    useSessionStore.setState({ currentSnapshot: fakeSnapshot });
    useAppStore.setState({ hasApiKey: false });
    render(<SnapshotCTA />);
    const drillBtn = screen.getByRole('button', { name: /generate drill/i });
    expect(drillBtn).toBeDisabled();
  });

  it('enables Generate Drill when API key is present', () => {
    useSessionStore.setState({ currentSnapshot: fakeSnapshot });
    useAppStore.setState({ hasApiKey: true });
    render(<SnapshotCTA />);
    const drillBtn = screen.getByRole('button', { name: /generate drill/i });
    expect(drillBtn).toBeEnabled();
  });

  it('shows tooltip title on disabled Generate Drill button', () => {
    useSessionStore.setState({ currentSnapshot: fakeSnapshot });
    useAppStore.setState({ hasApiKey: false });
    render(<SnapshotCTA />);
    const drillBtn = screen.getByRole('button', { name: /generate drill/i });
    expect(drillBtn).toHaveAttribute('title', 'Add an API key in Settings to generate drills');
  });

  it('does not show tooltip title when API key is present', () => {
    useSessionStore.setState({ currentSnapshot: fakeSnapshot });
    useAppStore.setState({ hasApiKey: true });
    render(<SnapshotCTA />);
    const drillBtn = screen.getByRole('button', { name: /generate drill/i });
    expect(drillBtn).not.toHaveAttribute('title');
  });

  it('has aria-live="polite" region for accessibility', () => {
    useSessionStore.setState({ currentSnapshot: fakeSnapshot });
    render(<SnapshotCTA />);
    const liveRegion = screen
      .getByRole('button', { name: /view dashboard/i })
      .closest('[aria-live]');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('announces the snapshot insight in sr-only text', () => {
    useSessionStore.setState({ currentSnapshot: fakeSnapshot });
    render(<SnapshotCTA />);
    expect(screen.getByText(/Snapshot ready: Great rhythmic consistency/)).toBeInTheDocument();
  });

  it('does not contain hardcoded hex color classes', () => {
    useSessionStore.setState({ currentSnapshot: fakeSnapshot });
    useAppStore.setState({ hasApiKey: true });
    const { container } = render(<SnapshotCTA />);
    const html = container.innerHTML;
    // Ensure no hardcoded hex colors remain in class attributes
    expect(html).not.toMatch(/class="[^"]*#[0-9A-Fa-f]{3,8}[^"]*"/);
  });
});
