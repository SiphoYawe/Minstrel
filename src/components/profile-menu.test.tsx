import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileMenu } from './profile-menu';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
}));

// Mock Supabase client
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}));

// Mock app store — use the real Zustand store so getState().clearUser works
vi.mock('@/stores/app-store', async () => {
  const { create } = await import('zustand');
  const store = create(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    hasApiKey: false,
    apiKeyStatus: 'none' as const,
    apiKeyProvider: null,
    migrationStatus: 'idle' as const,
    migrationProgress: { synced: 0, total: 0 },
    clearUser: vi.fn(),
    setUser: vi.fn(),
    setLoading: vi.fn(),
    setHasApiKey: vi.fn(),
    setApiKeyStatus: vi.fn(),
    setApiKeyProvider: vi.fn(),
    setMigrationStatus: vi.fn(),
    setMigrationProgress: vi.fn(),
  }));
  return { useAppStore: store };
});

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  capture: vi.fn(),
  reset: vi.fn(),
}));

describe('ProfileMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the user initial and label', () => {
    render(<ProfileMenu email="jane@example.com" displayName="Jane" />);
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('falls back to email prefix when displayName is null', () => {
    render(<ProfileMenu email="jane@example.com" displayName={null} />);
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.getByText('jane')).toBeInTheDocument();
  });

  it('redirects to / on sign out', async () => {
    const user = userEvent.setup();
    render(<ProfileMenu email="jane@example.com" displayName="Jane" />);

    // Open the dropdown menu using userEvent (handles pointerdown for Radix)
    await user.click(screen.getByLabelText('Profile menu'));

    // Click the sign out option
    const signOutButton = await screen.findByText('Sign Out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('does NOT redirect to /login on sign out', async () => {
    const user = userEvent.setup();
    render(<ProfileMenu email="jane@example.com" displayName="Jane" />);

    await user.click(screen.getByLabelText('Profile menu'));
    const signOutButton = await screen.findByText('Sign Out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    expect(mockPush).not.toHaveBeenCalledWith('/login');
  });

  it('contains a link to the practice session', () => {
    render(<ProfileMenu email="jane@example.com" displayName="Jane" />);
    const practiceLink = screen.getByRole('link', { name: /practice/i });
    expect(practiceLink).toHaveAttribute('href', '/session');
  });
});
