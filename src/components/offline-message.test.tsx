import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';
import { OfflineMessage } from './offline-message';

describe('OfflineMessage', () => {
  it('renders the default message', () => {
    render(<OfflineMessage />);
    expect(screen.getByText('AI features require an internet connection')).toBeInTheDocument();
  });

  it('renders a custom message', () => {
    render(<OfflineMessage message="Custom offline text" />);
    expect(screen.getByText('Custom offline text')).toBeInTheDocument();
  });

  it('has role="status" and aria-live="polite"', () => {
    render(<OfflineMessage />);
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('is dismissable by default', () => {
    render(<OfflineMessage />);
    const dismissBtn = screen.getByLabelText('Dismiss offline message');
    expect(dismissBtn).toBeInTheDocument();

    fireEvent.click(dismissBtn);

    expect(
      screen.queryByText('AI features require an internet connection')
    ).not.toBeInTheDocument();
  });

  it('hides dismiss button when dismissable is false', () => {
    render(<OfflineMessage dismissable={false} />);
    expect(screen.queryByLabelText('Dismiss offline message')).not.toBeInTheDocument();
  });

  it('does not use red or destructive language', () => {
    const { container } = render(<OfflineMessage />);
    const text = container.textContent ?? '';
    expect(text).not.toContain('Error');
    expect(text).not.toContain('error');
    expect(text).not.toContain('Failed');
    // Check no red/destructive CSS classes
    const html = container.innerHTML;
    expect(html).not.toContain('text-destructive');
    expect(html).not.toContain('text-red');
  });

  it('uses amber styling (accent-warm)', () => {
    const { container } = render(<OfflineMessage />);
    const html = container.innerHTML;
    expect(html).toContain('accent-warm');
  });
});
