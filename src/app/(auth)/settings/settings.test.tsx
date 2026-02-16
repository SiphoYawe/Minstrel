import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { useAppStore } from '@/stores/app-store';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock heavy child components to isolate settings page tests
vi.mock('@/features/auth/api-key-prompt', () => ({
  ApiKeyPrompt: () => <div data-testid="api-key-prompt">ApiKeyPrompt</div>,
}));

vi.mock('@/features/coaching/token-usage-display', () => ({
  TokenUsageDisplay: () => <div data-testid="token-usage-display">TokenUsageDisplay</div>,
}));

vi.mock('@/features/auth/api-key-manager', () => ({
  getApiKeyMetadata: vi.fn().mockResolvedValue({ data: null, error: null }),
  submitApiKey: vi.fn(),
  deleteApiKey: vi.fn(),
}));

vi.mock('@/features/coaching/token-usage', () => ({
  getTotalTokenUsage: vi.fn().mockResolvedValue(null),
  getRecentSessionUsage: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
    },
  }),
}));

// Mock LogoutConfirmationDialog
vi.mock('@/components/logout-confirmation-dialog', () => ({
  LogoutConfirmationDialog: () => (
    <div data-testid="logout-confirmation-dialog">LogoutConfirmationDialog</div>
  ),
}));

// Mock data export
vi.mock('@/features/auth/data-export', () => ({
  exportUserData: vi.fn(),
  downloadExportAsJson: vi.fn(),
}));

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

beforeEach(() => {
  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
});

import SettingsPage from './page';

describe('SettingsPage — Navigation (Story 27-4)', () => {
  beforeEach(() => {
    useAppStore.setState({
      user: { id: 'test-user-id', email: 'test@example.com', displayName: 'Test User' },
      isAuthenticated: true,
      isLoading: false,
      hasApiKey: true,
    });
  });

  it('renders section navigation with correct labels', () => {
    render(<SettingsPage />);

    // Check all navigation items are present
    expect(screen.getByRole('button', { name: /api keys/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /your data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /account/i })).toBeInTheDocument();
  });

  it('API Keys section appears first', () => {
    render(<SettingsPage />);

    const sections = Array.from(document.querySelectorAll('section[id]'));
    const sectionIds = sections.map((s) => s.id);

    // API Keys should be the first section
    expect(sectionIds[0]).toBe('api-keys');

    // Verify API Keys heading is present
    expect(screen.getByRole('heading', { name: /api keys/i, level: 2 })).toBeInTheDocument();
  });

  it('Preferences section is not rendered', () => {
    render(<SettingsPage />);

    // Preferences heading should not exist
    expect(screen.queryByRole('heading', { name: /preferences/i })).not.toBeInTheDocument();

    // "coming soon" text should not exist
    expect(screen.queryByText(/personalization options/i)).not.toBeInTheDocument();
  });

  it('all sections have correct IDs for scroll targeting', () => {
    render(<SettingsPage />);

    // Check each section has the correct ID
    expect(document.getElementById('api-keys')).toBeInTheDocument();
    expect(document.getElementById('profile')).toBeInTheDocument();
    expect(document.getElementById('your-data')).toBeInTheDocument();
    expect(document.getElementById('account')).toBeInTheDocument();
  });

  it('navigation items are present for all sections', () => {
    render(<SettingsPage />);

    const nav = screen.getByRole('navigation', { name: /settings sections/i });
    expect(nav).toBeInTheDocument();

    // All navigation buttons should be within the nav
    const navButtons = screen.getAllByRole('button').filter((button) => nav.contains(button));

    expect(navButtons).toHaveLength(4);
    expect(navButtons[0]).toHaveTextContent(/api keys/i);
    expect(navButtons[1]).toHaveTextContent(/profile/i);
    expect(navButtons[2]).toHaveTextContent(/your data/i);
    expect(navButtons[3]).toHaveTextContent(/account/i);
  });

  it('sections have scroll-mt-16 for proper sticky nav offset', () => {
    render(<SettingsPage />);

    const apiKeysSection = document.getElementById('api-keys');
    const profileSection = document.getElementById('profile');
    const yourDataSection = document.getElementById('your-data');
    const accountSection = document.getElementById('account');

    expect(apiKeysSection?.className).toContain('scroll-mt-16');
    expect(profileSection?.className).toContain('scroll-mt-16');
    expect(yourDataSection?.className).toContain('scroll-mt-16');
    expect(accountSection?.className).toContain('scroll-mt-16');
  });

  it('navigation has sticky positioning and backdrop blur', () => {
    render(<SettingsPage />);

    const nav = screen.getByRole('navigation', { name: /settings sections/i });

    expect(nav.className).toContain('sticky');
    expect(nav.className).toContain('top-0');
    expect(nav.className).toContain('backdrop-blur');
    expect(nav.className).toContain('bg-background/80');
    expect(nav.className).toContain('border-b');
  });

  it('navigation items use correct typography (font-mono, uppercase, tracking)', () => {
    render(<SettingsPage />);

    const apiKeysButton = screen.getByRole('button', { name: /api keys/i });

    expect(apiKeysButton.className).toContain('font-mono');
    expect(apiKeysButton.className).toContain('uppercase');
    expect(apiKeysButton.className).toContain('tracking-wider');
  });

  it('renders sections in correct order: API Keys, Profile, Your Data, Account', () => {
    render(<SettingsPage />);

    const sections = Array.from(document.querySelectorAll('section[id]'));
    const sectionIds = sections.map((s) => s.id);

    expect(sectionIds).toEqual(['api-keys', 'profile', 'your-data', 'account']);
  });
});

describe('SettingsPage — Danger Zone (Story 8.5)', () => {
  beforeEach(() => {
    // Set up authenticated user in the app store
    useAppStore.setState({
      user: { id: 'test-user-id', email: 'test@example.com', displayName: null },
      isAuthenticated: true,
      isLoading: false,
      hasApiKey: false,
    });
  });

  it('does not render a "Delete Account" button', () => {
    render(<SettingsPage />);
    expect(screen.queryByRole('button', { name: /delete account/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Delete Account/)).not.toBeInTheDocument();
  });

  it('renders mailto link to support@minstrel.app', () => {
    render(<SettingsPage />);
    const link = screen.getByRole('link', { name: /support@minstrel\.app/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'mailto:support@minstrel.app');
  });

  it('does not render any button with variant="destructive"', () => {
    const { container } = render(<SettingsPage />);
    // shadcn destructive buttons include "destructive" in their class name
    const destructiveButtons = container.querySelectorAll(
      'button.destructive, button[class*="destructive"]'
    );
    expect(destructiveButtons).toHaveLength(0);
  });

  it('renders honest copy about account deletion', () => {
    render(<SettingsPage />);
    expect(screen.getByText(/Account deletion — coming in a future update/i)).toBeInTheDocument();
    expect(screen.getByText(/for removal requests/i)).toBeInTheDocument();
  });
});
