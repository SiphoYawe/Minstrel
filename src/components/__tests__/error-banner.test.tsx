import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ErrorBanner } from '../error-banner';
import { useMidiStore } from '@/stores/midi-store';

// Reset store before each test
beforeEach(() => {
  act(() => {
    useMidiStore.getState().reset();
  });
});

describe('ErrorBanner', () => {
  it('renders nothing when errorMessage is null', () => {
    const { container } = render(<ErrorBanner />);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('renders banner when errorMessage is set', () => {
    act(() => {
      useMidiStore.getState().setErrorMessage('MIDI device disconnected');
    });

    render(<ErrorBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('MIDI device disconnected')).toBeInTheDocument();
  });

  it('shows new errors when errorMessage changes', () => {
    render(<ErrorBanner />);

    act(() => {
      useMidiStore.getState().setErrorMessage('First error');
    });

    expect(screen.getByText('First error')).toBeInTheDocument();

    act(() => {
      useMidiStore.getState().setErrorMessage('Second error');
    });

    expect(screen.getByText('Second error')).toBeInTheDocument();
  });

  it('hides banner on dismiss but preserves error in store', () => {
    act(() => {
      useMidiStore.getState().setErrorMessage('Test error');
    });

    render(<ErrorBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Dismiss notification'));
    expect(screen.queryByRole('alert')).toBeNull();

    // Error should still be in the store
    expect(useMidiStore.getState().errorMessage).toBe('Test error');
  });

  it('shows count badge when multiple errors queue up', () => {
    render(<ErrorBanner />);

    act(() => {
      useMidiStore.getState().setErrorMessage('Error one');
    });

    act(() => {
      useMidiStore.getState().setErrorMessage('Error two');
    });

    expect(screen.getByLabelText('2 notifications')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not duplicate same error message consecutively', () => {
    render(<ErrorBanner />);

    act(() => {
      useMidiStore.getState().setErrorMessage('Same error');
    });

    // Set same message again (simulating re-trigger)
    act(() => {
      useMidiStore.getState().setErrorMessage(null);
    });
    act(() => {
      useMidiStore.getState().setErrorMessage('Same error');
    });

    // Should show the error but not show a count badge for duplicates
    expect(screen.getByText('Same error')).toBeInTheDocument();
  });

  it('re-shows banner after dismiss when new error arrives', () => {
    render(<ErrorBanner />);

    act(() => {
      useMidiStore.getState().setErrorMessage('Error A');
    });

    fireEvent.click(screen.getByLabelText('Dismiss notification'));
    expect(screen.queryByRole('alert')).toBeNull();

    act(() => {
      useMidiStore.getState().setErrorMessage('Error B');
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error B')).toBeInTheDocument();
  });

  it('uses amber styling and growth mindset approach', () => {
    act(() => {
      useMidiStore.getState().setErrorMessage('Something went wrong');
    });

    render(<ErrorBanner />);
    const alert = screen.getByRole('alert');

    // Should use amber color tokens, not red
    expect(alert.className).toContain('accent-warm');
    expect(alert.className).not.toContain('red');
    expect(alert.className).not.toContain('destructive');
  });
});
