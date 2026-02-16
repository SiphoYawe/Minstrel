import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TroubleshootingPanel } from '../troubleshooting-panel';
import type { TroubleshootingStep } from '@/features/midi/troubleshooting';

const mockSteps: TroubleshootingStep[] = [
  {
    id: 'power-check',
    title: 'Check your device',
    description: 'Is it on?',
    actionLabel: 'Try Again',
  },
  {
    id: 'usb-port',
    title: 'Try a different port',
    description: 'Switch USB',
    actionLabel: 'Try Again',
  },
];

const defaultProps = {
  steps: mockSteps,
  onRetry: vi.fn().mockResolvedValue(undefined),
  onDismiss: vi.fn(),
  onAudioFallback: vi.fn().mockResolvedValue(undefined),
  connectionStatus: 'disconnected' as const,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TroubleshootingPanel', () => {
  it('renders steps when provided', () => {
    render(<TroubleshootingPanel {...defaultProps} />);
    expect(screen.getByText('Check your device')).toBeInTheDocument();
    expect(screen.getByText('Try a different port')).toBeInTheDocument();
  });

  it('renders nothing when steps is empty', () => {
    const { container } = render(<TroubleshootingPanel {...defaultProps} steps={[]} />);
    expect(container.querySelector('[role="complementary"]')).toBeNull();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    render(<TroubleshootingPanel {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Dismiss troubleshooting'));
    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('calls onDismiss when Escape is pressed', () => {
    render(<TroubleshootingPanel {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('shows success state after 2s debounce when connected', () => {
    const { rerender } = render(<TroubleshootingPanel {...defaultProps} />);

    // Transition to connected
    rerender(<TroubleshootingPanel {...defaultProps} connectionStatus="connected" />);

    // Before debounce — no success yet
    expect(screen.queryByText(/all set/)).toBeNull();

    // After 2s debounce
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText(/all set/)).toBeInTheDocument();
  });

  it('auto-dismisses 3s after showing success', () => {
    const { rerender } = render(<TroubleshootingPanel {...defaultProps} />);

    rerender(<TroubleshootingPanel {...defaultProps} connectionStatus="connected" />);

    // Wait for debounce (2s) + success display (3s)
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('does not flicker on rapid connect/disconnect (debounce)', () => {
    const { rerender } = render(<TroubleshootingPanel {...defaultProps} />);

    // Rapid connect
    rerender(<TroubleshootingPanel {...defaultProps} connectionStatus="connected" />);

    // Rapid disconnect within debounce window
    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender(<TroubleshootingPanel {...defaultProps} connectionStatus="disconnected" />);

    // Wait past debounce — should NOT show success since we disconnected
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText(/all set/)).toBeNull();
    expect(defaultProps.onDismiss).not.toHaveBeenCalled();
  });
});
