import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@/test-utils/render';
import { useAppStore } from '@/stores/app-store';
import { DrillPlaceholder } from './drill-placeholder';

beforeEach(() => {
  useAppStore.setState({ hasApiKey: false });
});

describe('DrillPlaceholder', () => {
  it('shows degradation prompt when no API key', () => {
    render(<DrillPlaceholder />);
    expect(screen.getByText('Connect your API key to get personalized drills')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Settings/i })).toHaveAttribute(
      'href',
      '/settings#api-keys'
    );
  });

  it('shows ready state when API key is configured', () => {
    useAppStore.setState({ hasApiKey: true });
    render(<DrillPlaceholder />);
    expect(screen.getByText(/Personalized drills ready/)).toBeInTheDocument();
    expect(screen.queryByText(/Connect your API key/)).not.toBeInTheDocument();
  });

  it('reactively switches from degradation to ready state', () => {
    render(<DrillPlaceholder />);
    expect(screen.getByText(/Connect your API key/)).toBeInTheDocument();

    act(() => {
      useAppStore.setState({ hasApiKey: true });
    });

    expect(screen.getByText(/Personalized drills ready/)).toBeInTheDocument();
    expect(screen.queryByText(/Connect your API key/)).not.toBeInTheDocument();
  });
});
