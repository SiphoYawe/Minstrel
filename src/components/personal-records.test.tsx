import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonalRecords, NewRecordHighlight } from './personal-records';

vi.mock('@/features/engagement/use-personal-records', () => ({
  usePersonalRecords: vi.fn(),
}));

import { usePersonalRecords } from '@/features/engagement/use-personal-records';
import {
  PersonalRecordType,
  type PersonalRecordWithHistory,
  type PersonalRecord,
} from '@/features/engagement/engagement-types';

const mockedHook = vi.mocked(usePersonalRecords);

function makeRecord(
  type: PersonalRecordType,
  value: number,
  history: Array<{ value: number; date: string; sessionId: string | null }> = []
): PersonalRecordWithHistory {
  const labels: Record<PersonalRecordType, { label: string; unit: string }> = {
    [PersonalRecordType.CleanTempo]: { label: 'Clean Tempo', unit: 'BPM' },
    [PersonalRecordType.TimingAccuracy]: { label: 'Timing Accuracy', unit: '%' },
    [PersonalRecordType.HarmonicComplexity]: { label: 'Harmonic Complexity', unit: 'chords' },
    [PersonalRecordType.PracticeStreak]: { label: 'Practice Streak', unit: 'days' },
  };
  return { recordType: type, currentValue: value, history, ...labels[type] };
}

const defaultRecords: PersonalRecordWithHistory[] = [
  makeRecord(PersonalRecordType.CleanTempo, 142),
  makeRecord(PersonalRecordType.TimingAccuracy, 92),
  makeRecord(PersonalRecordType.HarmonicComplexity, 8),
  makeRecord(PersonalRecordType.PracticeStreak, 14),
];

describe('PersonalRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockedHook.mockReturnValue({
      records: [],
      recentNewRecords: [],
      isLoading: true,
      checkSessionRecords: vi.fn(),
      dismissRecentRecords: vi.fn(),
    });

    render(<PersonalRecords />);
    expect(screen.getByText('Loading records...')).toBeDefined();
  });

  it('renders all four record cards', () => {
    mockedHook.mockReturnValue({
      records: defaultRecords,
      recentNewRecords: [],
      isLoading: false,
      checkSessionRecords: vi.fn(),
      dismissRecentRecords: vi.fn(),
    });

    render(<PersonalRecords />);
    expect(screen.getByText('Clean Tempo')).toBeDefined();
    expect(screen.getByText('Timing Accuracy')).toBeDefined();
    expect(screen.getByText('Harmonic Complexity')).toBeDefined();
    expect(screen.getByText('Practice Streak')).toBeDefined();
  });

  it('renders record values', () => {
    mockedHook.mockReturnValue({
      records: defaultRecords,
      recentNewRecords: [],
      isLoading: false,
      checkSessionRecords: vi.fn(),
      dismissRecentRecords: vi.fn(),
    });

    render(<PersonalRecords />);
    expect(screen.getByText('142')).toBeDefined();
    expect(screen.getByText('92')).toBeDefined();
  });

  it('renders dash for zero-value records', () => {
    mockedHook.mockReturnValue({
      records: [makeRecord(PersonalRecordType.CleanTempo, 0)],
      recentNewRecords: [],
      isLoading: false,
      checkSessionRecords: vi.fn(),
      dismissRecentRecords: vi.fn(),
    });

    render(<PersonalRecords />);
    expect(screen.getByText('—')).toBeDefined();
  });

  it('shows NEW label for recently broken records', () => {
    const recentNewRecords: PersonalRecord[] = [
      {
        recordType: PersonalRecordType.CleanTempo,
        currentValue: 150,
        previousValue: 142,
        achievedAt: '2026-02-13',
        sessionId: 'session-1',
      },
    ];

    mockedHook.mockReturnValue({
      records: [makeRecord(PersonalRecordType.CleanTempo, 150)],
      recentNewRecords,
      isLoading: false,
      checkSessionRecords: vi.fn(),
      dismissRecentRecords: vi.fn(),
    });

    render(<PersonalRecords />);
    expect(screen.getByText('NEW')).toBeDefined();
  });

  it('shows history toggle when history exists', () => {
    mockedHook.mockReturnValue({
      records: [
        makeRecord(PersonalRecordType.CleanTempo, 142, [
          { value: 128, date: '2026-02-08', sessionId: 'session-0' },
        ]),
      ],
      recentNewRecords: [],
      isLoading: false,
      checkSessionRecords: vi.fn(),
      dismissRecentRecords: vi.fn(),
    });

    render(<PersonalRecords />);
    expect(screen.getByText('History (1)')).toBeDefined();
  });

  it('expands history on click', () => {
    mockedHook.mockReturnValue({
      records: [
        makeRecord(PersonalRecordType.CleanTempo, 142, [
          { value: 128, date: '2026-02-08', sessionId: 'session-0' },
        ]),
      ],
      recentNewRecords: [],
      isLoading: false,
      checkSessionRecords: vi.fn(),
      dismissRecentRecords: vi.fn(),
    });

    render(<PersonalRecords />);
    fireEvent.click(screen.getByText('History (1)'));
    expect(screen.getByText(/128/)).toBeDefined();
  });

  it('has accessible aria-labels on record cards', () => {
    mockedHook.mockReturnValue({
      records: [makeRecord(PersonalRecordType.CleanTempo, 142)],
      recentNewRecords: [],
      isLoading: false,
      checkSessionRecords: vi.fn(),
      dismissRecentRecords: vi.fn(),
    });

    const { container } = render(<PersonalRecords />);
    const card = container.querySelector('[aria-label="Clean Tempo personal record: 142 BPM"]');
    expect(card).not.toBeNull();
  });

  it('has accessible aria-label for empty record', () => {
    mockedHook.mockReturnValue({
      records: [makeRecord(PersonalRecordType.CleanTempo, 0)],
      recentNewRecords: [],
      isLoading: false,
      checkSessionRecords: vi.fn(),
      dismissRecentRecords: vi.fn(),
    });

    const { container } = render(<PersonalRecords />);
    const card = container.querySelector('[aria-label="Clean Tempo: no record set"]');
    expect(card).not.toBeNull();
  });
});

describe('NewRecordHighlight', () => {
  it('renders nothing for empty records', () => {
    const { container } = render(<NewRecordHighlight records={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders new record text', () => {
    const records: PersonalRecord[] = [
      {
        recordType: PersonalRecordType.CleanTempo,
        currentValue: 142,
        previousValue: 128,
        achievedAt: '2026-02-13',
        sessionId: 'session-1',
      },
    ];

    render(<NewRecordHighlight records={records} />);
    expect(screen.getByText('New record: 142 BPM clean tempo (previous: 128 BPM)')).toBeDefined();
  });

  it('renders multiple new records', () => {
    const records: PersonalRecord[] = [
      {
        recordType: PersonalRecordType.CleanTempo,
        currentValue: 142,
        previousValue: 128,
        achievedAt: '2026-02-13',
        sessionId: 'session-1',
      },
      {
        recordType: PersonalRecordType.TimingAccuracy,
        currentValue: 95,
        previousValue: null,
        achievedAt: '2026-02-13',
        sessionId: 'session-1',
      },
    ];

    render(<NewRecordHighlight records={records} />);
    expect(screen.getByText(/142 BPM/)).toBeDefined();
    expect(screen.getByText(/First record: 95/)).toBeDefined();
  });
});
