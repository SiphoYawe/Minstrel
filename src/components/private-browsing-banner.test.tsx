import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrivateBrowsingBanner } from './private-browsing-banner';
import { useAppStore } from '@/stores/app-store';

describe('PrivateBrowsingBanner', () => {
  beforeEach(() => {
    useAppStore.setState({ isPrivateBrowsing: false });
  });

  it('renders nothing when not in private browsing', () => {
    const { container } = render(<PrivateBrowsingBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders amber banner when in private browsing mode', () => {
    useAppStore.setState({ isPrivateBrowsing: true });
    render(<PrivateBrowsingBanner />);

    const banner = screen.getByRole('status');
    expect(banner).toBeDefined();
    expect(screen.getByText('Private browsing mode')).toBeDefined();
    expect(screen.getByText(/settings won.t persist between sessions/)).toBeDefined();
  });

  it('uses polite aria-live', () => {
    useAppStore.setState({ isPrivateBrowsing: true });
    render(<PrivateBrowsingBanner />);

    const banner = screen.getByRole('status');
    expect(banner.getAttribute('aria-live')).toBe('polite');
  });
});
