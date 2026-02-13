import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeeklySummary } from './weekly-summary';

vi.mock('@/features/engagement/use-weekly-summary', () => ({
  useWeeklySummary: vi.fn(),
}));

import { useWeeklySummary } from '@/features/engagement/use-weekly-summary';
import {
  TrendDirection,
  type WeeklySummary as WeeklySummaryType,
} from '@/features/engagement/engagement-types';

const mockedHook = vi.mocked(useWeeklySummary);

function makeSummary(overrides: Partial<WeeklySummaryType> = {}): WeeklySummaryType {
  return {
    weekStartDate: '2026-02-09',
    weekEndDate: '2026-02-15',
    totalPracticeMs: 1_500_000,
    sessionCount: 3,
    drillsCompleted: 5,
    personalRecordsSet: 1,
    metricDeltas: [
      {
        metricName: 'Timing accuracy',
        currentValue: 82,
        previousValue: 74,
        deltaPercent: 8,
        direction: TrendDirection.Up,
      },
      {
        metricName: 'Practice time',
        currentValue: 25,
        previousValue: 18,
        deltaPercent: 39,
        direction: TrendDirection.Up,
      },
    ],
    highestImpactInsight: 'Biggest improvement: practice time up 39% this week.',
    previousWeekComparison: {
      totalTimeDeltaMs: 420_000,
      sessionCountDelta: 1,
      metricDeltas: [],
    },
    ...overrides,
  };
}

describe('WeeklySummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockedHook.mockReturnValue({
      weeklySummary: null,
      isLoading: true,
      hasData: false,
    });

    render(<WeeklySummary />);
    expect(screen.getByText('Loading summary...')).toBeDefined();
  });

  it('renders empty state when no data', () => {
    mockedHook.mockReturnValue({
      weeklySummary: null,
      isLoading: false,
      hasData: false,
    });

    render(<WeeklySummary />);
    expect(
      screen.getByText('No sessions this week yet. Your instrument is waiting.')
    ).toBeDefined();
  });

  it('renders "This Week" header', () => {
    mockedHook.mockReturnValue({
      weeklySummary: makeSummary(),
      isLoading: false,
      hasData: true,
    });

    render(<WeeklySummary />);
    expect(screen.getByText('This Week')).toBeDefined();
  });

  it('renders date range', () => {
    mockedHook.mockReturnValue({
      weeklySummary: makeSummary(),
      isLoading: false,
      hasData: true,
    });

    render(<WeeklySummary />);
    // Should contain "Feb 9" and "Feb 15"
    const dateRange = screen.getByText(/Feb 9/);
    expect(dateRange).toBeDefined();
  });

  it('renders top-line stats', () => {
    mockedHook.mockReturnValue({
      weeklySummary: makeSummary(),
      isLoading: false,
      hasData: true,
    });

    render(<WeeklySummary />);
    expect(screen.getByText('25m')).toBeDefined(); // 1,500,000ms = 25m
    expect(screen.getByText('3')).toBeDefined(); // sessions
    expect(screen.getByText('5')).toBeDefined(); // drills
    expect(screen.getByText('1')).toBeDefined(); // records
  });

  it('renders metric delta rows', () => {
    mockedHook.mockReturnValue({
      weeklySummary: makeSummary(),
      isLoading: false,
      hasData: true,
    });

    render(<WeeklySummary />);
    expect(screen.getByText('Timing accuracy')).toBeDefined();
    expect(screen.getByText('Practice time')).toBeDefined();
  });

  it('renders highest impact insight', () => {
    mockedHook.mockReturnValue({
      weeklySummary: makeSummary(),
      isLoading: false,
      hasData: true,
    });

    render(<WeeklySummary />);
    expect(screen.getByText('Biggest improvement: practice time up 39% this week.')).toBeDefined();
  });

  it('renders vs. last week comparison', () => {
    mockedHook.mockReturnValue({
      weeklySummary: makeSummary(),
      isLoading: false,
      hasData: true,
    });

    render(<WeeklySummary />);
    expect(screen.getByText('vs. last week')).toBeDefined();
  });

  it('shows "First week" indicator when no previous week', () => {
    mockedHook.mockReturnValue({
      weeklySummary: makeSummary({
        previousWeekComparison: null,
        metricDeltas: [
          {
            metricName: 'Timing accuracy',
            currentValue: 82,
            previousValue: null,
            deltaPercent: null,
            direction: TrendDirection.Flat,
          },
        ],
      }),
      isLoading: false,
      hasData: true,
    });

    render(<WeeklySummary />);
    expect(screen.getByText('First week')).toBeDefined();
  });

  it('includes screen reader text for deltas', () => {
    mockedHook.mockReturnValue({
      weeklySummary: makeSummary(),
      isLoading: false,
      hasData: true,
    });

    const { container } = render(<WeeklySummary />);
    const srTexts = container.querySelectorAll('.sr-only');
    const srContent = Array.from(srTexts)
      .map((el) => el.textContent)
      .join(' ');
    expect(srContent).toContain('improved 8 percent');
  });
});
