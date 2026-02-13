import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { DashboardChat } from './dashboard-chat';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';

describe('DashboardChat', () => {
  beforeEach(() => {
    useSessionStore.setState({
      currentMode: 'dashboard-chat',
      currentKey: null,
      currentTempo: null,
      timingAccuracy: 100,
      detectedChords: [],
      chatHistory: [],
    });
    useAppStore.setState({ hasApiKey: true });
  });

  it('renders the visualization canvas area', () => {
    render(<DashboardChat />);
    expect(screen.getByRole('img', { name: 'MIDI note visualization' })).toBeInTheDocument();
  });

  it('renders the data card section', () => {
    render(<DashboardChat />);
    expect(screen.getByRole('region', { name: 'Session metrics' })).toBeInTheDocument();
  });

  it('renders the chat panel', () => {
    render(<DashboardChat />);
    expect(screen.getByRole('log')).toBeInTheDocument();
  });

  it('renders the mode switcher', () => {
    render(<DashboardChat />);
    expect(screen.getByRole('tablist', { name: 'Session mode' })).toBeInTheDocument();
  });

  it('uses CSS grid layout with 3fr 2fr split', () => {
    const { container } = render(<DashboardChat />);
    const grid = container.querySelector('.lg\\:grid-cols-\\[3fr_2fr\\]');
    expect(grid).not.toBeNull();
  });

  it('renders status bar', () => {
    render(<DashboardChat />);
    const statusElements = screen.getAllByRole('status');
    expect(statusElements.length).toBeGreaterThanOrEqual(1);
  });
});
