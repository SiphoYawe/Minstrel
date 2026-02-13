import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils/render';

// Mock all child components
vi.mock('@/components/status-bar', () => ({
  StatusBar: () => <div data-testid="status-bar">StatusBar</div>,
}));
vi.mock('@/components/viz/visualization-canvas', () => ({
  VisualizationCanvas: () => <div data-testid="visualization-canvas">VisualizationCanvas</div>,
}));
vi.mock('@/components/troubleshooting-panel', () => ({
  TroubleshootingPanel: () => <div data-testid="troubleshooting-panel">TroubleshootingPanel</div>,
}));
vi.mock('@/components/audio-mode-banner', () => ({
  AudioModeBanner: () => <div data-testid="audio-mode-banner">AudioModeBanner</div>,
}));
vi.mock('@/components/guest-prompt', () => ({
  GuestPrompt: () => <div data-testid="guest-prompt">GuestPrompt</div>,
}));
vi.mock('@/components/api-key-prompt', () => ({
  ApiKeyPrompt: () => <div data-testid="api-key-prompt">ApiKeyPrompt</div>,
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

  it('renders StatusBar', () => {
    render(<GuestPlayPage />);
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });

  it('renders VisualizationCanvas', () => {
    render(<GuestPlayPage />);
    expect(screen.getByTestId('visualization-canvas')).toBeInTheDocument();
  });

  it('renders GuestPrompt banner', () => {
    render(<GuestPlayPage />);
    expect(screen.getByTestId('guest-prompt')).toBeInTheDocument();
  });

  it('renders ApiKeyPrompt', () => {
    render(<GuestPlayPage />);
    expect(screen.getByTestId('api-key-prompt')).toBeInTheDocument();
  });

  it('renders AudioModeBanner', () => {
    render(<GuestPlayPage />);
    expect(screen.getByTestId('audio-mode-banner')).toBeInTheDocument();
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
});
