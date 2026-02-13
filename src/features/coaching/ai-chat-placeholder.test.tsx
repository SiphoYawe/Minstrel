import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@/test-utils/render';
import { useAppStore } from '@/stores/app-store';
import { AiChatPlaceholder } from './ai-chat-placeholder';

beforeEach(() => {
  useAppStore.setState({ hasApiKey: false });
});

describe('AiChatPlaceholder', () => {
  it('shows degradation prompt when no API key', () => {
    render(<AiChatPlaceholder />);
    expect(
      screen.getByText('Connect your API key in Settings to unlock AI coaching')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Settings/i })).toHaveAttribute(
      'href',
      '/settings#api-keys'
    );
  });

  it('shows ready state when API key is configured', () => {
    useAppStore.setState({ hasApiKey: true });
    render(<AiChatPlaceholder />);
    expect(screen.getByText(/AI coaching ready/)).toBeInTheDocument();
    expect(screen.queryByText(/Connect your API key/)).not.toBeInTheDocument();
  });

  it('reactively switches from degradation to ready state', () => {
    render(<AiChatPlaceholder />);
    expect(screen.getByText(/Connect your API key/)).toBeInTheDocument();

    act(() => {
      useAppStore.setState({ hasApiKey: true });
    });

    expect(screen.getByText(/AI coaching ready/)).toBeInTheDocument();
    expect(screen.queryByText(/Connect your API key/)).not.toBeInTheDocument();
  });
});
