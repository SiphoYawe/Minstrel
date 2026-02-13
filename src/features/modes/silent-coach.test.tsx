import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils/render';

vi.mock('@/components/status-bar', () => ({
  StatusBar: () => <div data-testid="status-bar">StatusBar</div>,
}));
vi.mock('@/components/viz/visualization-canvas', () => ({
  VisualizationCanvas: () => <div data-testid="visualization-canvas">VisualizationCanvas</div>,
}));
vi.mock('@/features/modes/mode-switcher', () => ({
  ModeSwitcher: () => <div data-testid="mode-switcher">ModeSwitcher</div>,
}));

import { SilentCoach } from './silent-coach';

describe('SilentCoach', () => {
  it('renders VisualizationCanvas', () => {
    render(<SilentCoach />);
    expect(screen.getByTestId('visualization-canvas')).toBeInTheDocument();
  });

  it('renders StatusBar', () => {
    render(<SilentCoach />);
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });

  it('renders ModeSwitcher', () => {
    render(<SilentCoach />);
    expect(screen.getByTestId('mode-switcher')).toBeInTheDocument();
  });

  it('does not render any chat panel or data cards', () => {
    render(<SilentCoach />);
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('data-cards')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });
});
