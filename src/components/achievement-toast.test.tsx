import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AchievementToast, type AchievementToastItem } from './achievement-toast';

const DISMISS_MS = 4000;
const STAGGER_MS = 300;

function makeAchievement(overrides: Partial<AchievementToastItem> = {}): AchievementToastItem {
  return {
    achievementId: 'test-achievement-1',
    name: 'Test Achievement',
    description: 'A test achievement description',
    icon: 'star',
    category: 'Technique',
    ...overrides,
  };
}

describe('AchievementToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when achievements array is empty', () => {
    const { container } = render(<AchievementToast achievements={[]} onDismiss={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders achievement name and description', () => {
    const achievement = makeAchievement({
      name: 'First Jazz Voicing',
      description: 'Played your first dominant 7th chord.',
    });

    render(<AchievementToast achievements={[achievement]} onDismiss={vi.fn()} />);

    // Advance past stagger delay to make visible
    act(() => {
      vi.advanceTimersByTime(STAGGER_MS);
    });

    expect(screen.getByText('First Jazz Voicing')).toBeDefined();
    expect(screen.getByText('Played your first dominant 7th chord.')).toBeDefined();
  });

  it('renders multiple achievements', () => {
    const achievements = [
      makeAchievement({ achievementId: 'a1', name: 'Achievement One' }),
      makeAchievement({ achievementId: 'a2', name: 'Achievement Two' }),
      makeAchievement({ achievementId: 'a3', name: 'Achievement Three' }),
    ];

    render(<AchievementToast achievements={achievements} onDismiss={vi.fn()} />);

    // Advance enough for all to appear
    act(() => {
      vi.advanceTimersByTime(STAGGER_MS * 3);
    });

    expect(screen.getByText('Achievement One')).toBeDefined();
    expect(screen.getByText('Achievement Two')).toBeDefined();
    expect(screen.getByText('Achievement Three')).toBeDefined();
  });

  it('calls onDismiss after all toasts expire', () => {
    const onDismiss = vi.fn();
    const achievements = [
      makeAchievement({ achievementId: 'a1' }),
      makeAchievement({ achievementId: 'a2' }),
    ];

    render(<AchievementToast achievements={achievements} onDismiss={onDismiss} />);

    // First toast dismisses at STAGGER_MS*0 + DISMISS_MS
    act(() => {
      vi.advanceTimersByTime(DISMISS_MS);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    // Second toast dismisses at STAGGER_MS*1 + DISMISS_MS
    act(() => {
      vi.advanceTimersByTime(STAGGER_MS);
    });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('calls onDismiss for a single toast after DISMISS_MS', () => {
    const onDismiss = vi.fn();

    render(<AchievementToast achievements={[makeAchievement()]} onDismiss={onDismiss} />);

    act(() => {
      vi.advanceTimersByTime(DISMISS_MS - 1);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('has aria-live="polite" container', () => {
    render(<AchievementToast achievements={[makeAchievement()]} onDismiss={vi.fn()} />);

    const container = screen.getByRole('status');
    expect(container.getAttribute('aria-live')).toBe('polite');
  });

  it('renders screen reader summary for single achievement', () => {
    render(
      <AchievementToast
        achievements={[makeAchievement({ name: 'Solo Medal' })]}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('Achievement unlocked: Solo Medal')).toBeDefined();
  });

  it('renders screen reader summary for multiple achievements', () => {
    const achievements = [
      makeAchievement({ achievementId: 'a1', name: 'Medal A' }),
      makeAchievement({ achievementId: 'a2', name: 'Medal B' }),
    ];

    render(<AchievementToast achievements={achievements} onDismiss={vi.fn()} />);

    expect(screen.getByText('2 achievements unlocked: Medal A, Medal B')).toBeDefined();
  });

  it('renders category-specific icon for Genre', () => {
    render(
      <AchievementToast
        achievements={[makeAchievement({ category: 'Genre' })]}
        onDismiss={vi.fn()}
      />
    );

    // Genre icon is ♪
    expect(screen.getByText('♪')).toBeDefined();
  });

  it('renders category-specific icon for Technique', () => {
    render(
      <AchievementToast
        achievements={[makeAchievement({ category: 'Technique' })]}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('◎')).toBeDefined();
  });

  it('renders category-specific icon for Consistency', () => {
    render(
      <AchievementToast
        achievements={[makeAchievement({ category: 'Consistency' })]}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('▰')).toBeDefined();
  });

  it('renders category-specific icon for PersonalRecord', () => {
    render(
      <AchievementToast
        achievements={[makeAchievement({ category: 'PersonalRecord' })]}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('↑')).toBeDefined();
  });

  it('falls back to first char of icon for unknown category', () => {
    render(
      <AchievementToast
        achievements={[makeAchievement({ category: 'Unknown', icon: 'mystery' })]}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('M')).toBeDefined();
  });

  it('cleans up timers on unmount', () => {
    const onDismiss = vi.fn();
    const { unmount } = render(
      <AchievementToast achievements={[makeAchievement()]} onDismiss={onDismiss} />
    );

    unmount();

    // Advancing past dismiss time should not trigger callback
    act(() => {
      vi.advanceTimersByTime(DISMISS_MS + 1000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
