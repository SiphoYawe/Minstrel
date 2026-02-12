import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { ApiKeyPrompt } from './api-key-prompt';

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

describe('ApiKeyPrompt', () => {
  it('renders default message', () => {
    render(<ApiKeyPrompt />);
    expect(screen.getByText('Connect your API key to unlock AI coaching')).toBeInTheDocument();
  });

  it('renders default settings link', () => {
    render(<ApiKeyPrompt />);
    const link = screen.getByRole('link', { name: /go to settings/i });
    expect(link).toHaveAttribute('href', '/settings');
  });

  it('accepts custom message', () => {
    render(<ApiKeyPrompt message="Connect your API key to unlock personalized drills" />);
    expect(
      screen.getByText('Connect your API key to unlock personalized drills')
    ).toBeInTheDocument();
  });

  it('accepts custom link props', () => {
    render(<ApiKeyPrompt linkHref="/api-keys" linkLabel="Manage Keys" />);
    const link = screen.getByRole('link', { name: /manage keys/i });
    expect(link).toHaveAttribute('href', '/api-keys');
  });

  it('has role="region" with aria-label', () => {
    render(<ApiKeyPrompt />);
    expect(screen.getByRole('region', { name: /ai feature information/i })).toBeInTheDocument();
  });

  it('uses growth mindset language — no error or missing words', () => {
    render(<ApiKeyPrompt />);
    const region = screen.getByRole('region');
    const text = region.textContent ?? '';
    expect(text.toLowerCase()).not.toContain('error');
    expect(text.toLowerCase()).not.toContain('missing');
    expect(text.toLowerCase()).not.toContain('required');
    expect(text.toLowerCase()).toContain('unlock');
  });
});
