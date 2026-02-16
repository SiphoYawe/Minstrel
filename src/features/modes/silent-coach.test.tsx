import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils/render';

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

  it('does not render StatusBar (hoisted to session page layout, Story 28.2)', () => {
    render(<SilentCoach />);
    expect(screen.queryByTestId('status-bar')).not.toBeInTheDocument();
  });

  it('does not render a <main> element (single <main> is at page level, Story 28.2)', () => {
    render(<SilentCoach />);
    const mainEl = document.querySelector('main');
    expect(mainEl).not.toBeInTheDocument();
  });

  it('does not render any chat panel or data cards', () => {
    render(<SilentCoach />);
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('data-cards')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });
});
