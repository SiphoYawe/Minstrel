import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';
import { AchievementGallery } from './achievement-gallery';
import { useAppStore } from '@/stores/app-store';
import { ACHIEVEMENT_COUNT } from '@/features/engagement/achievement-definitions';

// Mock achievement service — factory must not reference top-level imports
vi.mock('@/features/engagement/achievement-service', () => ({
  fetchAchievementDisplay: vi.fn().mockResolvedValue([
    {
      definition: {
        achievementId: 'genre-first-jazz',
        name: 'First Jazz Voicing',
        description: 'Played your first dominant 7th chord.',
        category: 'Genre',
        icon: 'jazz',
        triggerCondition: () => false,
      },
      unlocked: true,
      unlockedAt: '2026-02-10T10:00:00Z',
    },
    {
      definition: {
        achievementId: 'technique-perfect-10',
        name: 'Perfect Timing 10x',
        description: '10 consecutive notes within beat grid tolerance.',
        category: 'Technique',
        icon: 'precision',
        triggerCondition: () => false,
      },
      unlocked: false,
      unlockedAt: null,
    },
    {
      definition: {
        achievementId: 'consistency-first-week',
        name: 'First Week',
        description: '7-day practice streak.',
        category: 'Consistency',
        icon: 'calendar',
        triggerCondition: () => false,
      },
      unlocked: false,
      unlockedAt: null,
    },
  ]),
}));

describe('AchievementGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      user: { id: 'user-1', email: 'test@example.com', displayName: null },
      isAuthenticated: true,
    });
  });

  it('renders achievement cards after loading', async () => {
    render(<AchievementGallery />);

    // Should show loading initially
    expect(screen.getByText('Loading achievements...')).toBeInTheDocument();

    // Wait for items to load
    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('displays unlocked achievements with earned date', async () => {
    render(<AchievementGallery />);

    await screen.findAllByRole('listitem');

    expect(screen.getByText('First Jazz Voicing')).toBeInTheDocument();
    expect(screen.getByText(/Earned/)).toBeInTheDocument();
  });

  it('displays locked achievements as "Not yet earned"', async () => {
    render(<AchievementGallery />);

    await screen.findAllByRole('listitem');

    const notYetLabels = screen.getAllByText('Not yet earned');
    expect(notYetLabels).toHaveLength(2);
  });

  it('shows progress counter', async () => {
    render(<AchievementGallery />);

    await screen.findAllByRole('listitem');

    // 1 unlocked out of ACHIEVEMENT_COUNT total
    expect(screen.getByText(`1 / ${ACHIEVEMENT_COUNT}`)).toBeInTheDocument();
  });

  it('shows filter buttons', async () => {
    render(<AchievementGallery />);

    await screen.findAllByRole('listitem');

    expect(screen.getByText('All')).toBeInTheDocument();
    // "Genre" text will appear both in filter button and category badge
    const genreElements = screen.getAllByText('Genre');
    expect(genreElements.length).toBeGreaterThanOrEqual(1);
    const techniqueElements = screen.getAllByText('Technique');
    expect(techniqueElements.length).toBeGreaterThanOrEqual(1);
    const consistencyElements = screen.getAllByText('Consistency');
    expect(consistencyElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Records')).toBeInTheDocument();
  });

  it('filters by category when filter button clicked', async () => {
    render(<AchievementGallery />);

    await screen.findAllByRole('listitem');

    // Click "Records" filter — should show 0 items since none match PersonalRecord
    fireEvent.click(screen.getByText('Records'));

    expect(screen.getByText('No achievements in this category.')).toBeInTheDocument();
  });

  it('has accessible labels on achievement cards', async () => {
    render(<AchievementGallery />);

    await screen.findAllByRole('listitem');

    expect(
      screen.getByLabelText('First Jazz Voicing - Earned')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Perfect Timing 10x - Not yet earned')
    ).toBeInTheDocument();
  });

  it('shows achievement descriptions', async () => {
    render(<AchievementGallery />);

    await screen.findAllByRole('listitem');

    expect(screen.getByText('Played your first dominant 7th chord.')).toBeInTheDocument();
    expect(screen.getByText('10 consecutive notes within beat grid tolerance.')).toBeInTheDocument();
  });
});

describe('AchievementGallery unauthenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      user: null,
      isAuthenticated: false,
    });
  });

  it('shows all achievements as locked for unauthenticated users', async () => {
    render(<AchievementGallery />);

    await screen.findAllByRole('listitem');

    const notYetLabels = screen.getAllByText('Not yet earned');
    // All achievements should be locked when unauthenticated
    expect(notYetLabels.length).toBe(ACHIEVEMENT_COUNT);
  });
});
