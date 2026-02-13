import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils/render';

// Mock all child component imports to isolate landmark testing
vi.mock('@/components/viz/visualization-canvas', () => ({
  VisualizationCanvas: () => <div data-testid="viz-canvas" />,
}));
vi.mock('@/components/status-bar', () => ({
  StatusBar: () => <div data-testid="status-bar" />,
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
vi.mock('@/stores/app-store', () => ({
  useAppStore: vi.fn(() => false),
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
  describe('landmark structure (UI-C1)', () => {
    it('renders a <main> landmark element', () => {
      render(<DashboardChat />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('the <main> element contains the visualization canvas', () => {
      render(<DashboardChat />);
      const main = screen.getByRole('main');
      expect(main.querySelector('[data-testid="viz-canvas"]')).not.toBeNull();
    });

    it('the <main> element contains the chat panel', () => {
      render(<DashboardChat />);
      const main = screen.getByRole('main');
      expect(main.querySelector('[data-testid="ai-chat-panel"]')).not.toBeNull();
    });

    it('the <main> element contains the data card', () => {
      render(<DashboardChat />);
      const main = screen.getByRole('main');
      expect(main.querySelector('[data-testid="data-card"]')).not.toBeNull();
    });
  });
});
