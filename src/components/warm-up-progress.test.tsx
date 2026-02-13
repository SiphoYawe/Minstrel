import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { WarmUpProgress } from './warm-up-progress';
import { useSessionStore } from '@/stores/session-store';

describe('WarmUpProgress', () => {
  beforeEach(() => {
    useSessionStore.setState({
      isWarmingUp: false,
      currentWarmupExercise: 0,
      warmupRoutine: null,
    });
  });

  it('renders nothing when not warming up', () => {
    const { container } = render(<WarmUpProgress />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when warming up but no routine yet', () => {
    useSessionStore.setState({ isWarmingUp: true, warmupRoutine: null });
    const { container } = render(<WarmUpProgress />);
    expect(container.firstChild).toBeNull();
  });

  it('renders exercise count during warm-up', () => {
    useSessionStore.setState({
      isWarmingUp: true,
      currentWarmupExercise: 1,
      warmupRoutine: {
        exercises: [
          {
            id: '1',
            title: 'C major scale',
            sequence: { notes: [], timeSignature: [4, 4], measures: 4 },
            targetTempo: 80,
            durationSeconds: 30,
            difficulty: 'easy',
          },
          {
            id: '2',
            title: 'Chord transitions',
            sequence: { notes: [], timeSignature: [4, 4], measures: 4 },
            targetTempo: 80,
            durationSeconds: 30,
            difficulty: 'moderate',
          },
          {
            id: '3',
            title: 'Rhythm pattern',
            sequence: { notes: [], timeSignature: [4, 4], measures: 4 },
            targetTempo: 100,
            durationSeconds: 30,
            difficulty: 'target',
          },
        ],
        totalDurationSeconds: 90,
        basedOn: {
          recentKeys: ['C major'],
          recentWeaknesses: [],
        },
      },
    });

    render(<WarmUpProgress />);

    expect(screen.getByLabelText('Warm-up exercise 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Chord transitions')).toBeInTheDocument();
  });

  it('has correct role="status"', () => {
    useSessionStore.setState({
      isWarmingUp: true,
      currentWarmupExercise: 0,
      warmupRoutine: {
        exercises: [
          {
            id: '1',
            title: 'Scale',
            sequence: { notes: [], timeSignature: [4, 4], measures: 4 },
            targetTempo: 80,
            durationSeconds: 30,
            difficulty: 'easy',
          },
        ],
        totalDurationSeconds: 30,
        basedOn: { recentKeys: [], recentWeaknesses: [] },
      },
    });

    render(<WarmUpProgress />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
