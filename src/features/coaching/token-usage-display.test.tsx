import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { TokenUsageDisplay } from './token-usage-display';
import type { TokenUsageSummary } from './token-usage';

const mockSummary: TokenUsageSummary = {
  totalTokens: 2400,
  promptTokens: 1200,
  completionTokens: 1200,
  estimatedCost: 0.03,
  interactionCount: 5,
  provider: 'openai',
  model: 'gpt-4o',
};

describe('TokenUsageDisplay', () => {
  describe('empty state', () => {
    it('shows "No AI usage yet" when summary is null', () => {
      render(<TokenUsageDisplay summary={null} variant="session" />);
      expect(screen.getByText('No AI usage yet')).toBeInTheDocument();
    });

    it('shows "No AI usage yet" when totalTokens is 0', () => {
      const emptySummary: TokenUsageSummary = {
        ...mockSummary,
        totalTokens: 0,
        estimatedCost: 0,
      };
      render(<TokenUsageDisplay summary={emptySummary} variant="session" />);
      expect(screen.getByText('No AI usage yet')).toBeInTheDocument();
    });
  });

  describe('session variant', () => {
    it('renders token count and cost', () => {
      render(<TokenUsageDisplay summary={mockSummary} variant="session" />);
      expect(screen.getByText(/~2,400 tokens/)).toBeInTheDocument();
      expect(screen.getByText(/~\$0\.03/)).toBeInTheDocument();
      expect(screen.getByText('this session')).toBeInTheDocument();
    });
  });

  describe('total variant', () => {
    it('renders total usage label', () => {
      render(<TokenUsageDisplay summary={mockSummary} variant="total" />);
      expect(screen.getByText('Total usage')).toBeInTheDocument();
    });

    it('renders token count and cost', () => {
      render(<TokenUsageDisplay summary={mockSummary} variant="total" />);
      expect(screen.getByText(/~2,400 tokens/)).toBeInTheDocument();
    });

    it('renders interaction count', () => {
      render(<TokenUsageDisplay summary={mockSummary} variant="total" />);
      expect(screen.getByText('5 interactions')).toBeInTheDocument();
    });

    it('renders singular interaction count', () => {
      const singleSummary = { ...mockSummary, interactionCount: 1 };
      render(<TokenUsageDisplay summary={singleSummary} variant="total" />);
      expect(screen.getByText('1 interaction')).toBeInTheDocument();
    });

    it('renders the cost disclaimer', () => {
      render(<TokenUsageDisplay summary={mockSummary} variant="total" />);
      expect(screen.getByText(/Cost estimates are approximate/)).toBeInTheDocument();
      expect(screen.getByText(/Check your provider dashboard/)).toBeInTheDocument();
    });
  });

  describe('compact variant', () => {
    it('renders only the cost', () => {
      render(<TokenUsageDisplay summary={mockSummary} variant="compact" />);
      expect(screen.getByText('~$0.03')).toBeInTheDocument();
    });

    it('does not render token count or disclaimer', () => {
      render(<TokenUsageDisplay summary={mockSummary} variant="compact" />);
      expect(screen.queryByText(/tokens/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Cost estimates/)).not.toBeInTheDocument();
    });
  });
});
