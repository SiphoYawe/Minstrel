import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { useSessionStore } from '@/stores/session-store';

// Mock child components
vi.mock('@/components/status-bar', () => ({
  StatusBar: () => <div data-testid="status-bar">StatusBar</div>,
}));
vi.mock('@/components/viz/visualization-canvas', () => ({
  VisualizationCanvas: () => <div data-testid="visualization-canvas">VisualizationCanvas</div>,
}));
vi.mock('@/components/troubleshooting-panel', () => ({
  TroubleshootingPanel: () => <div data-testid="troubleshooting-panel">TroubleshootingPanel</div>,
}));
vi.mock('@/features/modes/mode-switcher', () => ({
  ModeSwitcher: () => <div data-testid="mode-switcher">ModeSwitcher</div>,
}));

// Mock hooks and utilities
vi.mock('@/features/session/use-guest-session', () => ({
  useGuestSession: vi.fn(),
}));
vi.mock('@/features/analysis/use-analysis-pipeline', () => ({
  useAnalysisPipeline: vi.fn(),
}));
const mockUseMidi = vi.fn();
vi.mock('@/features/midi/use-midi', () => ({
  useMidi: () => mockUseMidi(),
}));
vi.mock('@/features/midi/troubleshooting', () => ({
  getTroubleshootingSteps: vi.fn(() => []),
}));
vi.mock('@/features/midi/audio-engine', () => ({
  isAudioSupported: vi.fn(() => true),
}));

import GuestPlayPage from './page';

describe('GuestPlayPage', () => {
  beforeEach(() => {
    useSessionStore.getState().setCurrentMode('silent-coach');
    useSessionStore.getState().setSessionStartTimestamp(null);
    useSessionStore.getState().resetAnalysis();
    mockUseMidi.mockReturnValue({
      connectionStatus: 'connecting',
      showTroubleshooting: false,
      detectedChannel: null,
      retryConnection: vi.fn(),
      dismissTroubleshooting: vi.fn(),
      startAudioMode: vi.fn(),
      inputSource: 'none',
    });
  });

  it('renders without authentication', () => {
    render(<GuestPlayPage />);
    expect(screen.getByTestId('visualization-canvas')).toBeInTheDocument();
  });

  it('renders StatusBar in Silent Coach mode', () => {
    render(<GuestPlayPage />);
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });

  it('renders VisualizationCanvas in Silent Coach mode', () => {
    render(<GuestPlayPage />);
    expect(screen.getByTestId('visualization-canvas')).toBeInTheDocument();
  });

  it('renders ModeSwitcher in Silent Coach mode', () => {
    render(<GuestPlayPage />);
    expect(screen.getByTestId('mode-switcher')).toBeInTheDocument();
  });

  it('does not render TroubleshootingPanel when showTroubleshooting is false', () => {
    render(<GuestPlayPage />);
    expect(screen.queryByTestId('troubleshooting-panel')).not.toBeInTheDocument();
  });

  it('renders TroubleshootingPanel when showTroubleshooting is true', () => {
    mockUseMidi.mockReturnValue({
      connectionStatus: 'disconnected',
      showTroubleshooting: true,
      detectedChannel: null,
      retryConnection: vi.fn(),
      dismissTroubleshooting: vi.fn(),
      startAudioMode: vi.fn(),
      inputSource: 'none',
    });
    render(<GuestPlayPage />);
    expect(screen.getByTestId('troubleshooting-panel')).toBeInTheDocument();
  });

  it('renders Dashboard placeholder when mode is dashboard-chat', () => {
    useSessionStore.getState().setCurrentMode('dashboard-chat');
    render(<GuestPlayPage />);
    expect(screen.getByText(/Dashboard \+ Chat/)).toBeInTheDocument();
    expect(screen.queryByTestId('visualization-canvas')).not.toBeInTheDocument();
  });

  it('renders Replay placeholder when mode is replay-studio', () => {
    useSessionStore.getState().setCurrentMode('replay-studio');
    render(<GuestPlayPage />);
    expect(screen.getByText(/Replay Studio/)).toBeInTheDocument();
    expect(screen.queryByTestId('visualization-canvas')).not.toBeInTheDocument();
  });
});
