import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressTrends } from './progress-trends';

// Mock the hook
vi.mock('@/features/engagement/use-progress-trends', () => ({
  useProgressTrends: vi.fn(),
}));

import { useProgressTrends } from '@/features/engagement/use-progress-trends';
import {
  TrendDimension,
  TrendDirection,
  TrendPeriod,
  type ProgressSummary,
  type TrendLine,
} from '@/features/engagement/engagement-types';

const mockedHook = vi.mocked(useProgressTrends);

function makeTrend(overrides: Partial<TrendLine> = {}): TrendLine {
  return {
    dimension: TrendDimension.TimingAccuracy,
    dataPoints: [
      { date: '2026-02-08', value: 70 },
      { date: '2026-02-10', value: 75 },
      { date: '2026-02-12', value: 82 },
    ],
    deltaFromStart: 12,
    currentValue: 82,
    bestInPeriod: 82,
    trendDirection: TrendDirection.Up,
    insightText: 'Timing accuracy at personal best: 82%.',
    ...overrides,
  };
}

function makeSummary(): ProgressSummary {
  return {
    trends: [
      makeTrend({ dimension: TrendDimension.TimingAccuracy }),
      makeTrend({
        dimension: TrendDimension.HarmonicComplexity,
        currentValue: 8,
        insightText: 'Harmonic complexity at personal best: 8 chords.',
      }),
      makeTrend({
        dimension: TrendDimension.Speed,
        currentValue: 120,
        insightText: 'Speed at personal best: 120 BPM.',
      }),
      makeTrend({
        dimension: TrendDimension.Consistency,
        currentValue: 15,
        insightText: 'Practice time at personal best: 15 min.',
      }),
    ],
    period: TrendPeriod.ThirtyDays,
    generatedAt: '2026-02-13T12:00:00Z',
  };
}

describe('ProgressTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockedHook.mockReturnValue({
      progressSummary: null,
      selectedPeriod: TrendPeriod.ThirtyDays,
      setSelectedPeriod: vi.fn(),
      isLoading: true,
      hasMinimumData: false,
    });

    render(<ProgressTrends />);
    expect(screen.getByText('Loading trends...')).toBeDefined();
  });

  it('renders empty state when insufficient data', () => {
    mockedHook.mockReturnValue({
      progressSummary: null,
      selectedPeriod: TrendPeriod.ThirtyDays,
      setSelectedPeriod: vi.fn(),
      isLoading: false,
      hasMinimumData: false,
    });

    render(<ProgressTrends />);
    expect(screen.getByText('Keep practicing. Trends appear after 3 sessions.')).toBeDefined();
  });

  it('renders period selector with three buttons', () => {
    mockedHook.mockReturnValue({
      progressSummary: makeSummary(),
      selectedPeriod: TrendPeriod.ThirtyDays,
      setSelectedPeriod: vi.fn(),
      isLoading: false,
      hasMinimumData: true,
    });

    render(<ProgressTrends />);
    expect(screen.getByText('7d')).toBeDefined();
    expect(screen.getByText('30d')).toBeDefined();
    expect(screen.getByText('90d')).toBeDefined();
  });

  it('marks the active period as aria-pressed', () => {
    mockedHook.mockReturnValue({
      progressSummary: makeSummary(),
      selectedPeriod: TrendPeriod.ThirtyDays,
      setSelectedPeriod: vi.fn(),
      isLoading: false,
      hasMinimumData: true,
    });

    render(<ProgressTrends />);
    const btn30 = screen.getByText('30d');
    expect(btn30.getAttribute('aria-pressed')).toBe('true');

    const btn7 = screen.getByText('7d');
    expect(btn7.getAttribute('aria-pressed')).toBe('false');
  });

  it('calls setSelectedPeriod when period button is clicked', () => {
    const setSelectedPeriod = vi.fn();
    mockedHook.mockReturnValue({
      progressSummary: makeSummary(),
      selectedPeriod: TrendPeriod.ThirtyDays,
      setSelectedPeriod,
      isLoading: false,
      hasMinimumData: true,
    });

    render(<ProgressTrends />);
    fireEvent.click(screen.getByText('7d'));
    expect(setSelectedPeriod).toHaveBeenCalledWith(TrendPeriod.SevenDays);
  });

  it('renders all four dimension labels', () => {
    mockedHook.mockReturnValue({
      progressSummary: makeSummary(),
      selectedPeriod: TrendPeriod.ThirtyDays,
      setSelectedPeriod: vi.fn(),
      isLoading: false,
      hasMinimumData: true,
    });

    render(<ProgressTrends />);
    expect(screen.getByText('Timing Accuracy')).toBeDefined();
    expect(screen.getByText('Harmonic Complexity')).toBeDefined();
    expect(screen.getByText('Speed')).toBeDefined();
    expect(screen.getByText('Practice Time')).toBeDefined();
  });

  it('renders insight text for each trend', () => {
    mockedHook.mockReturnValue({
      progressSummary: makeSummary(),
      selectedPeriod: TrendPeriod.ThirtyDays,
      setSelectedPeriod: vi.fn(),
      isLoading: false,
      hasMinimumData: true,
    });

    render(<ProgressTrends />);
    expect(screen.getByText('Timing accuracy at personal best: 82%.')).toBeDefined();
  });

  it('renders SVG charts with aria-labels', () => {
    mockedHook.mockReturnValue({
      progressSummary: makeSummary(),
      selectedPeriod: TrendPeriod.ThirtyDays,
      setSelectedPeriod: vi.fn(),
      isLoading: false,
      hasMinimumData: true,
    });

    const { container } = render(<ProgressTrends />);
    const svgs = container.querySelectorAll('svg[role="img"]');
    expect(svgs.length).toBe(4);

    // Check first chart has an aria-label
    const firstLabel = svgs[0].getAttribute('aria-label');
    expect(firstLabel).toContain('Timing Accuracy');
    expect(firstLabel).toContain('82');
  });

  it('renders current values in summary cards', () => {
    mockedHook.mockReturnValue({
      progressSummary: makeSummary(),
      selectedPeriod: TrendPeriod.ThirtyDays,
      setSelectedPeriod: vi.fn(),
      isLoading: false,
      hasMinimumData: true,
    });

    render(<ProgressTrends />);
    // Current values should appear
    expect(screen.getAllByText('82').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('120').length).toBeGreaterThanOrEqual(1);
  });
});
