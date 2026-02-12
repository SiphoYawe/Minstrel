import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TroubleshootingPanel } from './troubleshooting-panel';
import type { TroubleshootingStep } from '@/features/midi/troubleshooting';
import type { MidiConnectionStatus } from '@/features/midi/midi-types';

const defaultSteps: TroubleshootingStep[] = [
  {
    id: 'power-check',
    title: 'Check your device',
    description: 'Is your MIDI device powered on?',
    actionLabel: 'Try Again',
  },
  {
    id: 'usb-port',
    title: 'Try a different connection',
    description: 'Try switching USB ports.',
    actionLabel: 'Try Again',
  },
];

const channelStep: TroubleshootingStep = {
  id: 'channel-mismatch',
  title: 'Unexpected MIDI channel',
  description: 'Your device is sending on channel 10.',
  actionLabel: 'Got It',
};

function renderPanel(
  overrides: Partial<{
    steps: TroubleshootingStep[];
    onRetry: () => Promise<void>;
    onDismiss: () => void;
    connectionStatus: MidiConnectionStatus;
  }> = {}
) {
  const props = {
    steps: defaultSteps,
    onRetry: vi.fn().mockResolvedValue(undefined),
    onDismiss: vi.fn(),
    connectionStatus: 'disconnected' as MidiConnectionStatus,
    ...overrides,
  };
  return { ...render(<TroubleshootingPanel {...props} />), props };
}

describe('TroubleshootingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when steps array is empty', () => {
    const { container } = renderPanel({ steps: [] });
    expect(container.firstChild).toBeNull();
  });

  it('renders the panel title', () => {
    renderPanel();
    expect(screen.getByText(/get connected/i)).toBeInTheDocument();
  });

  it('renders all steps with titles and descriptions', () => {
    renderPanel();
    expect(screen.getByText('Check your device')).toBeInTheDocument();
    expect(screen.getByText('Try a different connection')).toBeInTheDocument();
    expect(screen.getByText('Is your MIDI device powered on?')).toBeInTheDocument();
  });

  it('renders step numbers', () => {
    renderPanel();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    renderPanel();
    const panel = screen.getByRole('complementary');
    expect(panel).toHaveAttribute('aria-label', 'MIDI troubleshooting');
  });

  it('calls onDismiss when close button is clicked', () => {
    const { props } = renderPanel();
    const dismissBtn = screen.getByLabelText('Dismiss troubleshooting');
    fireEvent.click(dismissBtn);
    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry when Try Again button is clicked', async () => {
    const { props } = renderPanel();
    const retryButtons = screen.getAllByText('Try Again');
    fireEvent.click(retryButtons[0]);
    await waitFor(() => {
      expect(props.onRetry).toHaveBeenCalledTimes(1);
    });
  });

  it('disables retry button while retrying', async () => {
    let resolveRetry!: () => void;
    const onRetry = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRetry = resolve;
        })
    );
    renderPanel({ onRetry });

    const retryButtons = screen.getAllByText('Try Again');
    fireEvent.click(retryButtons[0]);

    // Button should be disabled during retry
    await waitFor(() => {
      expect(retryButtons[0].closest('button')).toBeDisabled();
    });

    // Resolve the retry
    resolveRetry();
    await waitFor(() => {
      expect(retryButtons[0].closest('button')).not.toBeDisabled();
    });
  });

  it('renders channel mismatch step with amber styling', () => {
    renderPanel({ steps: [channelStep] });
    const gotItBtn = screen.getByText('Got It');
    expect(gotItBtn).toBeInTheDocument();
  });

  it('calls onDismiss when channel mismatch Got It button is clicked', () => {
    const { props } = renderPanel({ steps: [channelStep] });
    fireEvent.click(screen.getByText('Got It'));
    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses when connectionStatus becomes connected', () => {
    const { props, rerender } = renderPanel();
    expect(props.onDismiss).not.toHaveBeenCalled();

    rerender(
      <TroubleshootingPanel
        steps={defaultSteps}
        onRetry={props.onRetry}
        onDismiss={props.onDismiss}
        connectionStatus="connected"
      />
    );
    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not auto-dismiss when steps are empty', () => {
    const { props } = renderPanel({ steps: [], connectionStatus: 'connected' });
    expect(props.onDismiss).not.toHaveBeenCalled();
  });

  it('dismisses on Escape key press', () => {
    const { props } = renderPanel();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });
});
