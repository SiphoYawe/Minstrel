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

import SettingsPage from './page';

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
