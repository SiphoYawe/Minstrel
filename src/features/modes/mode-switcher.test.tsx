import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ModeSwitcher } from './mode-switcher';
import { useSessionStore } from '@/stores/session-store';

describe('ModeSwitcher', () => {
  beforeEach(() => {
    useSessionStore.getState().setCurrentMode('silent-coach');
    useSessionStore.getState().setSessionStartTimestamp(null);
    useSessionStore.getState().resetAnalysis();
  });

  it('renders three mode tabs', () => {
    render(<ModeSwitcher />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    // Verify labels via aria-label on the inner label spans
    expect(screen.getByLabelText('Silent Coach')).toBeDefined();
    expect(screen.getByLabelText('Dashboard')).toBeDefined();
    expect(screen.getByLabelText('Replay')).toBeDefined();
  });

  it('marks Silent Coach as active by default', () => {
    render(<ModeSwitcher />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(tabs[2].getAttribute('aria-selected')).toBe('false');
  });

  it('switches mode on click', () => {
    render(<ModeSwitcher />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]); // Dashboard tab
    expect(useSessionStore.getState().currentMode).toBe('dashboard-chat');
  });

  it('responds to Alt+2 keyboard shortcut', () => {
    render(<ModeSwitcher />);
    fireEvent.keyDown(window, { key: '2', altKey: true });
    expect(useSessionStore.getState().currentMode).toBe('dashboard-chat');
  });

  it('responds to Alt+3 keyboard shortcut', () => {
    render(<ModeSwitcher />);
    fireEvent.keyDown(window, { key: '3', altKey: true });
    expect(useSessionStore.getState().currentMode).toBe('replay-studio');
  });

  it('does not switch on digit press without modifier key', () => {
    render(<ModeSwitcher />);
    fireEvent.keyDown(window, { key: '2' });
    expect(useSessionStore.getState().currentMode).toBe('silent-coach');
  });

  it('does not switch on Ctrl+digit (reserved for browser tab switching)', () => {
    render(<ModeSwitcher />);
    fireEvent.keyDown(window, { key: '2', ctrlKey: true });
    expect(useSessionStore.getState().currentMode).toBe('silent-coach');
  });

  it('has tablist role on container', () => {
    render(<ModeSwitcher />);
    expect(screen.getByRole('tablist')).toBeDefined();
  });

  it('has aria-keyshortcuts on each button', () => {
    render(<ModeSwitcher />);
    const tabs = screen.getAllByRole('tab');
    for (const tab of tabs) {
      expect(tab.getAttribute('aria-keyshortcuts')).toBeDefined();
    }
  });

  it('has aria-live region for mode announcements', () => {
    render(<ModeSwitcher />);
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('cleans up keyboard listener on unmount', () => {
    render(<ModeSwitcher />);
    cleanup();
    fireEvent.keyDown(window, { key: '2', altKey: true });
    expect(useSessionStore.getState().currentMode).toBe('silent-coach');
  });

  it('renders mode labels for each tab', () => {
    render(<ModeSwitcher />);
    expect(screen.getByText('Play')).toBeDefined();
    expect(screen.getByText('Coach')).toBeDefined();
    expect(screen.getByText('Replay')).toBeDefined();
  });
});
