import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';

// Mock all child component imports to isolate testing
vi.mock('@/components/viz/visualization-canvas', () => ({
  VisualizationCanvas: () => <div data-testid="viz-canvas" />,
}));
vi.mock('@/components/snapshot-cta', () => ({
  SnapshotCTA: () => <div data-testid="snapshot-cta" />,
}));
vi.mock('@/components/data-card', () => ({
  DataCard: () => <div data-testid="data-card" />,
}));
vi.mock('@/components/ai-chat-panel', () => ({
  AIChatPanel: () => <div data-testid="ai-chat-panel" />,
}));
vi.mock('@/components/drill-panel', () => ({
  DrillPanel: () => <div data-testid="drill-panel" />,
}));
vi.mock('@/components/drill-request-card', () => ({
  DrillRequestCard: () => <div data-testid="drill-request-card" />,
}));
vi.mock('@/components/drill-controller', () => ({
  DrillController: () => <div data-testid="drill-controller" />,
}));
vi.mock('@/components/personal-records', () => ({
  PersonalRecords: () => <div data-testid="personal-records" />,
}));
vi.mock('@/components/weekly-summary', () => ({
  WeeklySummary: () => <div data-testid="weekly-summary" />,
}));

// Mock all hooks
vi.mock('@/features/coaching/coaching-client', () => ({
  useCoachingChat: () => ({
    messages: [],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
    error: null,
    setInput: vi.fn(),
  }),
}));
vi.mock('@/hooks/use-drill-generation', () => ({
  useDrillGeneration: () => ({
    drill: null,
    isGenerating: false,
    error: null,
    generate: vi.fn(),
    retry: vi.fn(),
    dismiss: vi.fn(),
  }),
}));
vi.mock('@/hooks/use-drill-session', () => ({
  useDrillSession: () => ({
    phase: null,
    currentRep: 0,
    repHistory: [],
    improvementMessage: null,
    startDrill: vi.fn(),
    tryAgain: vi.fn(),
    complete: vi.fn(),
  }),
}));

let mockIsAuthenticated = false;
vi.mock('@/stores/app-store', () => ({
  useAppStore: vi.fn((selector: (s: { isAuthenticated: boolean }) => boolean) =>
    selector({ isAuthenticated: mockIsAuthenticated })
  ),
}));
vi.mock('@/stores/session-store', () => ({
  useSessionStore: Object.assign(
    vi.fn(() => ({})),
    {
      getState: () => ({ currentSnapshot: null }),
    }
  ),
}));

import { DashboardChat } from './dashboard-chat';

describe('DashboardChat', () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
  });

  describe('layout structure (Story 28.2)', () => {
    it('does not render StatusBar (hoisted to session page)', () => {
      render(<DashboardChat />);
      expect(screen.queryByTestId('status-bar')).not.toBeInTheDocument();
    });

    it('does not render a <main> element (single <main> at page level)', () => {
      render(<DashboardChat />);
      expect(document.querySelector('main')).not.toBeInTheDocument();
    });

    it('renders the visualization canvas', () => {
      render(<DashboardChat />);
      expect(screen.getByTestId('viz-canvas')).toBeInTheDocument();
    });

    it('renders the chat panel', () => {
      render(<DashboardChat />);
      expect(screen.getByTestId('ai-chat-panel')).toBeInTheDocument();
    });

    it('renders the data card', () => {
      render(<DashboardChat />);
      expect(screen.getByTestId('data-card')).toBeInTheDocument();
    });
  });

  describe('engagement toggle accessibility (UI-H1, UI-H2)', () => {
    beforeEach(() => {
      mockIsAuthenticated = true;
    });

    it('renders the Progress toggle button for authenticated users', () => {
      render(<DashboardChat />);
      expect(screen.getByRole('button', { name: /progress/i })).toBeInTheDocument();
    });

    it('toggle button has aria-expanded="false" when collapsed', () => {
      render(<DashboardChat />);
      const toggle = screen.getByRole('button', { name: /progress/i });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('toggle button has aria-controls="engagement-section"', () => {
      render(<DashboardChat />);
      const toggle = screen.getByRole('button', { name: /progress/i });
      expect(toggle).toHaveAttribute('aria-controls', 'engagement-section');
    });

    it('toggle button has aria-expanded="true" after clicking', () => {
      render(<DashboardChat />);
      const toggle = screen.getByRole('button', { name: /progress/i });
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    it('engagement section has id="engagement-section" when expanded', () => {
      render(<DashboardChat />);
      fireEvent.click(screen.getByRole('button', { name: /progress/i }));
      expect(document.getElementById('engagement-section')).toBeInTheDocument();
    });

    it('aria-live region announces "expanded" when section opens', () => {
      render(<DashboardChat />);
      fireEvent.click(screen.getByRole('button', { name: /progress/i }));
      expect(screen.getByText('Progress section expanded')).toBeInTheDocument();
    });

    it('aria-live region announces "collapsed" when section closes', () => {
      render(<DashboardChat />);
      const toggle = screen.getByRole('button', { name: /progress/i });
      // Open then close
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      expect(screen.getByText('Progress section collapsed')).toBeInTheDocument();
    });

    it('does not render toggle for unauthenticated users', () => {
      mockIsAuthenticated = false;
      render(<DashboardChat />);
      expect(screen.queryByRole('button', { name: /progress/i })).not.toBeInTheDocument();
    });
  });
});
