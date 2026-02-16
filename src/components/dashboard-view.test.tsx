import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardView } from './dashboard-view';

// Mock dependencies
vi.mock('@/stores/session-store', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      skillProfile: null,
      difficultyState: null,
      playingTendencies: null,
      detectedGenres: [],
    };
    return selector(state);
  }),
}));

vi.mock('@/stores/app-store', () => ({
  useAppStore: vi.fn((selector) => {
    const state = { user: null, isAuthenticated: false };
    return selector(state);
  }),
}));

vi.mock('@/hooks/use-dashboard-stats', () => ({
  useDashboardStats: vi.fn(() => ({
    stats: null,
    isLoading: false,
    formatDuration: (ms: number) => `${Math.floor(ms / 60000)}m`,
  })),
}));

vi.mock('@/features/engagement/use-streak', () => ({
  useStreak: vi.fn(() => ({
    streak: { currentStreak: 0, longestStreak: 0, streakStatus: 'Broken' },
    loading: false,
  })),
}));

vi.mock('@/features/engagement/use-xp', () => ({
  useXp: vi.fn(() => ({ lifetimeXp: 0, isLoading: false })),
}));

vi.mock('@/features/engagement/achievement-service', () => ({
  fetchAchievementDisplay: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/features/engagement/achievement-definitions', () => ({
  achievementRegistry: new Map(),
}));

vi.mock('@/components/progress-trends', () => ({
  ProgressTrends: () => <div data-testid="progress-trends">Trends</div>,
}));

vi.mock('@/components/skill-radar-chart', () => ({
  SkillRadarChart: () => <div data-testid="skill-radar">Radar</div>,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hero metrics section with 4 cards', () => {
    render(<DashboardView />);
    // Should show streak, XP, session/start, achievements
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Lvl 1')).toBeInTheDocument();
  });

  it('hides session stats section when no session data', () => {
    render(<DashboardView />);
    // Session Stats collapsible should not render when no data
    expect(screen.queryByText('Session Stats')).not.toBeInTheDocument();
  });

  it('shows "Start your first session" for new users', () => {
    render(<DashboardView />);
    expect(screen.getByText('Start your first session')).toBeInTheDocument();
  });

  it('shows warm-up CTA always', () => {
    render(<DashboardView />);
    expect(screen.getByText('Quick Warm-Up')).toBeInTheDocument();
  });

  it('hides skill & difficulty section when no data', () => {
    render(<DashboardView />);
    expect(screen.queryByText('Skill & Difficulty')).not.toBeInTheDocument();
  });

  it('shows collapsible section with data and toggles', async () => {
    const { useDashboardStats } = await import('@/hooks/use-dashboard-stats');
    (useDashboardStats as ReturnType<typeof vi.fn>).mockReturnValue({
      stats: {
        totalPracticeMs: 600000,
        totalSessions: 5,
        totalNotesPlayed: 200,
        averageSessionMs: 120000,
      },
      isLoading: false,
      formatDuration: (ms: number) => `${Math.floor(ms / 60000)}m`,
    });

    render(<DashboardView />);
    const toggleButton = screen.getByText('Session Stats').closest('button');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    // Collapse it
    fireEvent.click(toggleButton!);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('uses invitation tone for zero streak', () => {
    render(<DashboardView />);
    expect(screen.getByText(/Ready for today/)).toBeInTheDocument();
  });
});
