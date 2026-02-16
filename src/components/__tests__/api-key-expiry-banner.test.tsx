import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '@/stores/app-store';
import { ApiKeyExpiryBanner } from '../api-key-expiry-banner';

describe('ApiKeyExpiryBanner', () => {
  beforeEach(() => {
    useAppStore.setState({ apiKeyStatus: 'active', hasApiKey: true });
  });

  it('does not render when apiKeyStatus is "active"', () => {
    useAppStore.setState({ apiKeyStatus: 'active', hasApiKey: true });
    const { container } = render(<ApiKeyExpiryBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when apiKeyStatus is "none"', () => {
    useAppStore.setState({ apiKeyStatus: 'none', hasApiKey: false });
    const { container } = render(<ApiKeyExpiryBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when apiKeyStatus is "validating"', () => {
    useAppStore.setState({ apiKeyStatus: 'validating', hasApiKey: true });
    const { container } = render(<ApiKeyExpiryBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders when apiKeyStatus is "invalid"', () => {
    useAppStore.setState({ apiKeyStatus: 'invalid', hasApiKey: false });
    render(<ApiKeyExpiryBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows correct message text', () => {
    useAppStore.setState({ apiKeyStatus: 'invalid', hasApiKey: false });
    render(<ApiKeyExpiryBanner />);
    expect(
      screen.getByText('Your API key may have expired. Update it in Settings to continue coaching.')
    ).toBeInTheDocument();
  });

  it('has Settings link with correct href', () => {
    useAppStore.setState({ apiKeyStatus: 'invalid', hasApiKey: false });
    render(<ApiKeyExpiryBanner />);
    const link = screen.getByRole('link', { name: /go to settings/i });
    expect(link).toHaveAttribute('href', '/settings#api-keys');
  });

  it('has dismiss button', () => {
    useAppStore.setState({ apiKeyStatus: 'invalid', hasApiKey: false });
    render(<ApiKeyExpiryBanner />);
    const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });
    expect(dismissButton).toBeInTheDocument();
  });

  it('hides banner when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ apiKeyStatus: 'invalid', hasApiKey: false });
    const { container } = render(<ApiKeyExpiryBanner />);

    const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });
    await user.click(dismissButton);

    expect(container).toBeEmptyDOMElement();
  });

  it('uses amber color scheme (accent-warm)', () => {
    useAppStore.setState({ apiKeyStatus: 'invalid', hasApiKey: false });
    render(<ApiKeyExpiryBanner />);
    const banner = screen.getByRole('alert');
    expect(banner.className).toContain('accent-warm');
    expect(banner.className).toContain('border-accent-warm/20');
  });

  it('has proper ARIA attributes', () => {
    useAppStore.setState({ apiKeyStatus: 'invalid', hasApiKey: false });
    render(<ApiKeyExpiryBanner />);
    const banner = screen.getByRole('alert');
    expect(banner).toHaveAttribute('aria-live', 'polite');
  });

  it('does not reappear after dismissal even if status remains invalid', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ apiKeyStatus: 'invalid', hasApiKey: false });
    const { rerender, container } = render(<ApiKeyExpiryBanner />);

    // Dismiss the banner
    const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });
    await user.click(dismissButton);
    expect(container).toBeEmptyDOMElement();

    // Rerender with status still invalid
    rerender(<ApiKeyExpiryBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
