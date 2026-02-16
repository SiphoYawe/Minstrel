import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/image
vi.mock('next/image', () => ({
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mock useAuth
vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

import LoginPage from '../login/page';
import SignupPage from '../signup/page';

const SRC_ROOT = resolve(__dirname, '../../..');

describe('Story 27-7: Auth UX Improvements', () => {
  describe('AC1: Duplicate auth directory audit', () => {
    it('stale redirect pages have been removed', () => {
      const stalePaths = [
        'app/auth/login/page.tsx',
        'app/auth/sign-up/page.tsx',
        'app/auth/forgot-password/page.tsx',
        'app/auth/update-password/page.tsx',
      ];

      for (const p of stalePaths) {
        expect(existsSync(resolve(SRC_ROOT, p))).toBe(false);
      }
    });

    it('critical auth routes are preserved (confirm + error)', () => {
      expect(existsSync(resolve(SRC_ROOT, 'app/auth/confirm/route.ts'))).toBe(true);
      expect(existsSync(resolve(SRC_ROOT, 'app/auth/error/page.tsx'))).toBe(true);
    });

    it('dead form components have been removed', () => {
      const deadComponents = [
        'components/sign-up-form.tsx',
        'components/login-form.tsx',
        'components/forgot-password-form.tsx',
      ];

      for (const p of deadComponents) {
        expect(existsSync(resolve(SRC_ROOT, p))).toBe(false);
      }
    });

    it('canonical auth pages exist in (marketing) directory', () => {
      const canonicalPages = [
        'app/(marketing)/login/page.tsx',
        'app/(marketing)/signup/page.tsx',
        'app/(marketing)/forgot-password/page.tsx',
        'app/(marketing)/update-password/page.tsx',
      ];

      for (const p of canonicalPages) {
        expect(existsSync(resolve(SRC_ROOT, p))).toBe(true);
      }
    });
  });

  describe('AC2: Email validation', () => {
    it('login page validates email format on blur', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
      fireEvent.blur(emailInput);

      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });

    it('login page accepts valid email format', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.blur(emailInput);

      expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument();
    });

    it('login page rejects email without valid domain', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'user@' } });
      fireEvent.blur(emailInput);

      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });

    it('signup page validates email format on blur', () => {
      render(<SignupPage />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid@' } });
      fireEvent.blur(emailInput);

      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  describe('AC3: Forgot Password visible without scrolling', () => {
    it('login page shows Forgot Password link near password field', () => {
      render(<LoginPage />);

      const link = screen.getByRole('link', { name: /forgot password/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/forgot-password');
    });

    it('Forgot Password link is adjacent to password label (above fold)', () => {
      render(<LoginPage />);

      const passwordLabel = screen.getByText(/^password$/i);
      const forgotLink = screen.getByRole('link', { name: /forgot password/i });

      // Both should share a parent flex container
      expect(passwordLabel.closest('.flex')).toContainElement(forgotLink);
    });
  });

  describe('AC4: Guest-to-auth transition', () => {
    it('GuestConversionOverlay renders migration message', async () => {
      const { useAppStore } = await import('@/stores/app-store');
      const { GuestConversionOverlay } = await import('@/components/guest-conversion-overlay');

      useAppStore.setState({ migrationStatus: 'migrating' });
      render(<GuestConversionOverlay />);

      expect(
        screen.getByText(/creating your account and migrating your practice data/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveAttribute('aria-busy', 'true');
    });

    it('GuestConversionOverlay does not render when not migrating', async () => {
      const { useAppStore } = await import('@/stores/app-store');
      const { GuestConversionOverlay } = await import('@/components/guest-conversion-overlay');

      useAppStore.setState({ migrationStatus: 'idle' });
      const { container } = render(<GuestConversionOverlay />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Guest prompt link update', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it('GuestPrompt links to /signup (not /auth/sign-up)', async () => {
      const { GuestPrompt } = await import('@/components/guest-prompt');
      render(<GuestPrompt />);

      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toHaveAttribute('href', '/signup');
    });
  });
});
