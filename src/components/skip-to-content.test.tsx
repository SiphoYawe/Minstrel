import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { SkipToContent } from './skip-to-content';

describe('SkipToContent', () => {
  it('renders a link pointing to #main-content', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('has sr-only class for visual hiding', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link.className).toContain('sr-only');
  });

  it('becomes visible on focus (focus:not-sr-only class)', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link.className).toContain('focus:not-sr-only');
  });

  it('uses design token classes (no hardcoded hex)', () => {
    const { container } = render(<SkipToContent />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/class="[^"]*#[0-9A-Fa-f]{3,8}[^"]*"/);
  });
});
