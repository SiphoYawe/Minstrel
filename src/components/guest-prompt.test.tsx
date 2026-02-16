import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';
import { GuestPrompt } from './guest-prompt';

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

describe('GuestPrompt', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders banner when not dismissed', () => {
    render(<GuestPrompt />);
    expect(screen.getByText(/Create an account to save your progress/)).toBeInTheDocument();
  });

  it('renders Sign Up link to /signup', () => {
    render(<GuestPrompt />);
    const link = screen.getByRole('link', { name: /sign up/i });
    expect(link).toHaveAttribute('href', '/signup');
  });

  it('has role="status" for accessibility', () => {
    render(<GuestPrompt />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('dismisses when close button is clicked', () => {
    render(<GuestPrompt />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('persists dismissed state to sessionStorage', () => {
    render(<GuestPrompt />);
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(sessionStorage.getItem('minstrel-guest-prompt-dismissed')).toBe('1');
  });

  it('does not render when previously dismissed', () => {
    sessionStorage.setItem('minstrel-guest-prompt-dismissed', '1');
    render(<GuestPrompt />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
