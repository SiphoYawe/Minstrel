import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { StreakBadge } from './streak-badge';
import { StreakStatus, type StreakData } from '@/features/engagement/engagement-types';

function makeStreak(overrides: Partial<StreakData> = {}): StreakData {
  return {
    currentStreak: 5,
    bestStreak: 10,
    lastQualifiedAt: '2026-02-13T10:00:00Z',
    streakStatus: StreakStatus.Active,
    ...overrides,
  };
}

describe('StreakBadge', () => {
  it('renders active streak', () => {
    render(<StreakBadge streak={makeStreak()} />);
    expect(screen.getByText('Day 5')).toBeInTheDocument();
    expect(screen.getByLabelText('Practice streak: 5 days')).toBeInTheDocument();
  });

  it('renders "No streak" for broken state', () => {
    render(
      <StreakBadge streak={makeStreak({ currentStreak: 0, streakStatus: StreakStatus.Broken })} />
    );
    expect(screen.getByText('No streak')).toBeInTheDocument();
  });

  it('shows at-risk tooltip', () => {
    const { container } = render(
      <StreakBadge streak={makeStreak({ streakStatus: StreakStatus.AtRisk })} />
    );
    const badge = container.querySelector('[title]');
    expect(badge?.getAttribute('title')).toBe('Practice today to keep your streak');
  });

  it('shows broken tooltip', () => {
    const { container } = render(
      <StreakBadge streak={makeStreak({ currentStreak: 0, streakStatus: StreakStatus.Broken })} />
    );
    const badge = container.querySelector('[title]');
    expect(badge?.getAttribute('title')).toBe('Start fresh');
  });

  it('shows milestone glow and aria announcement', () => {
    render(
      <StreakBadge
        streak={makeStreak({ currentStreak: 30, streakStatus: StreakStatus.Milestone })}
      />
    );
    expect(screen.getByText('Day 30')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Milestone reached: Day 30');
  });

  it('never contains aggressive language', () => {
    const states = [
      StreakStatus.Active,
      StreakStatus.AtRisk,
      StreakStatus.Broken,
      StreakStatus.Milestone,
    ];
    const aggressive = ['!', 'lost', 'Lost', 'LOST', 'failed', 'Failed'];

    for (const status of states) {
      const { container } = render(<StreakBadge streak={makeStreak({ streakStatus: status })} />);
      const text = container.textContent ?? '';
      const title = container.querySelector('[title]')?.getAttribute('title') ?? '';
      for (const word of aggressive) {
        expect(text).not.toContain(word);
        expect(title).not.toContain(word);
      }
    }
  });

  it('has correct aria-label', () => {
    render(<StreakBadge streak={makeStreak({ currentStreak: 14 })} />);
    expect(screen.getByLabelText('Practice streak: 14 days')).toBeInTheDocument();
  });
});
