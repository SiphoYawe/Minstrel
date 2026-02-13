import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@/test-utils/render';
import { useAppStore } from '@/stores/app-store';
import { ApiKeyRequired } from './api-key-required';

beforeEach(() => {
  useAppStore.setState({ hasApiKey: false });
});

describe('ApiKeyRequired', () => {
  describe('when hasApiKey is true', () => {
    beforeEach(() => {
      useAppStore.setState({ hasApiKey: true });
    });

    it('renders children directly', () => {
      render(
        <ApiKeyRequired feature="coaching">
          <div data-testid="child">AI Feature</div>
        </ApiKeyRequired>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('AI Feature')).toBeInTheDocument();
    });

    it('does not render degradation prompt', () => {
      render(
        <ApiKeyRequired feature="coaching">
          <div>AI Feature</div>
        </ApiKeyRequired>
      );
      expect(screen.queryByText(/Connect your API key/)).not.toBeInTheDocument();
    });
  });

  describe('when hasApiKey is false', () => {
    it('renders degradation prompt instead of children', () => {
      render(
        <ApiKeyRequired feature="coaching">
          <div data-testid="child">AI Feature</div>
        </ApiKeyRequired>
      );
      expect(screen.queryByTestId('child')).not.toBeInTheDocument();
      expect(screen.getByText(/Connect your API key/)).toBeInTheDocument();
    });

    it('shows correct message for coaching feature', () => {
      render(
        <ApiKeyRequired feature="coaching">
          <div>child</div>
        </ApiKeyRequired>
      );
      expect(
        screen.getByText('Connect your API key in Settings to unlock AI coaching')
      ).toBeInTheDocument();
    });

    it('shows correct message for drills feature', () => {
      render(
        <ApiKeyRequired feature="drills">
          <div>child</div>
        </ApiKeyRequired>
      );
      expect(
        screen.getByText('Connect your API key to get personalized drills')
      ).toBeInTheDocument();
    });

    it('shows correct message for analysis feature', () => {
      render(
        <ApiKeyRequired feature="analysis">
          <div>child</div>
        </ApiKeyRequired>
      );
      expect(screen.getByText('Connect your API key for AI-powered analysis')).toBeInTheDocument();
    });

    it('includes a link to /settings#api-keys', () => {
      render(
        <ApiKeyRequired feature="coaching">
          <div>child</div>
        </ApiKeyRequired>
      );
      const link = screen.getByRole('link', { name: /Go to Settings/i });
      expect(link).toHaveAttribute('href', '/settings#api-keys');
    });

    it('shows BYOK explanation', () => {
      render(
        <ApiKeyRequired feature="coaching">
          <div>child</div>
        </ApiKeyRequired>
      );
      expect(screen.getByText(/Bring-Your-Own-Key/)).toBeInTheDocument();
    });

    it('has role="status" for accessibility', () => {
      render(
        <ApiKeyRequired feature="coaching">
          <div>child</div>
        </ApiKeyRequired>
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('reactive updates', () => {
    it('switches from degradation prompt to children when hasApiKey changes to true', () => {
      render(
        <ApiKeyRequired feature="coaching">
          <div data-testid="child">AI Feature</div>
        </ApiKeyRequired>
      );

      // Initially no key — should show degradation prompt
      expect(screen.queryByTestId('child')).not.toBeInTheDocument();
      expect(screen.getByText(/Connect your API key/)).toBeInTheDocument();

      // Simulate key being added
      act(() => {
        useAppStore.setState({ hasApiKey: true });
      });

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.queryByText(/Connect your API key/)).not.toBeInTheDocument();
    });

    it('switches from children to degradation prompt when hasApiKey changes to false', () => {
      useAppStore.setState({ hasApiKey: true });

      render(
        <ApiKeyRequired feature="drills">
          <div data-testid="child">Drill UI</div>
        </ApiKeyRequired>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();

      // Simulate key being removed
      act(() => {
        useAppStore.setState({ hasApiKey: false });
      });

      expect(screen.queryByTestId('child')).not.toBeInTheDocument();
      expect(screen.getByText(/Connect your API key/)).toBeInTheDocument();
    });
  });
});
