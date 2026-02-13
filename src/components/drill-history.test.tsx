import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { DrillHistory } from './drill-history';

const sampleDrills = [
  {
    drillId: 'drill-1',
    targetSkill: 'Chord Transitions',
    createdAt: new Date().toISOString(),
    status: 'completed',
    results: { repsCompleted: 4, accuracyAchieved: 0.85, passed: true },
  },
  {
    drillId: 'drill-2',
    targetSkill: 'Timing Accuracy',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    status: 'completed',
    results: { repsCompleted: 2, accuracyAchieved: 0.45, passed: false },
  },
  {
    drillId: 'drill-3',
    targetSkill: 'Scale Patterns',
    createdAt: new Date().toISOString(),
    status: 'generated',
    results: null,
  },
];

describe('DrillHistory', () => {
  it('renders empty state when no drills', () => {
    render(<DrillHistory drills={[]} onRestart={vi.fn()} />);
    expect(screen.getByText(/no drills yet/i)).toBeInTheDocument();
    expect(screen.getByText(/generate your first drill/i)).toBeInTheDocument();
  });

  it('renders drill cards with target skills', () => {
    render(<DrillHistory drills={sampleDrills} onRestart={vi.fn()} />);
    expect(screen.getByText('Chord Transitions')).toBeInTheDocument();
    expect(screen.getByText('Timing Accuracy')).toBeInTheDocument();
    expect(screen.getByText('Scale Patterns')).toBeInTheDocument();
  });

  it('shows accuracy percentage for completed drills', () => {
    render(<DrillHistory drills={sampleDrills} onRestart={vi.fn()} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('shows "New" badge for generated (not attempted) drills', () => {
    render(<DrillHistory drills={sampleDrills} onRestart={vi.fn()} />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('shows reps count for completed drills', () => {
    render(<DrillHistory drills={sampleDrills} onRestart={vi.fn()} />);
    expect(screen.getByText('4 reps')).toBeInTheDocument();
    expect(screen.getByText('2 reps')).toBeInTheDocument();
  });

  it('renders restart buttons for each drill', () => {
    render(<DrillHistory drills={sampleDrills} onRestart={vi.fn()} />);
    const restartBtns = screen.getAllByRole('button', { name: /restart/i });
    expect(restartBtns).toHaveLength(3);
  });

  it('calls onRestart with drillId when Restart clicked', () => {
    const onRestart = vi.fn();
    render(<DrillHistory drills={sampleDrills} onRestart={onRestart} />);
    const restartBtns = screen.getAllByRole('button', { name: /restart/i });
    restartBtns[0].click();
    expect(onRestart).toHaveBeenCalledWith('drill-1');
  });

  it('has a list role with aria-label', () => {
    render(<DrillHistory drills={sampleDrills} onRestart={vi.fn()} />);
    expect(screen.getByRole('list', { name: /drill history/i })).toBeInTheDocument();
  });
});
