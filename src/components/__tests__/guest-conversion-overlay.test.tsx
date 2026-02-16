import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuestConversionOverlay } from '../guest-conversion-overlay';
import { useAppStore } from '@/stores/app-store';

describe('GuestConversionOverlay', () => {
  beforeEach(() => {
    useAppStore.setState({ migrationStatus: 'idle' });
  });

  it('does not render when migrationStatus is idle', () => {
    useAppStore.setState({ migrationStatus: 'idle' });
    const { container } = render(<GuestConversionOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders overlay when migrationStatus is migrating', () => {
    useAppStore.setState({ migrationStatus: 'migrating' });
    render(<GuestConversionOverlay />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Migration in Progress')).toBeInTheDocument();
    expect(
      screen.getByText('Creating your account and migrating your practice data...')
    ).toBeInTheDocument();
  });

  it('does not render when migrationStatus is complete', () => {
    useAppStore.setState({ migrationStatus: 'complete' });
    const { container } = render(<GuestConversionOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when migrationStatus is partial-failure', () => {
    useAppStore.setState({ migrationStatus: 'partial-failure' });
    const { container } = render(<GuestConversionOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('has correct ARIA attributes', () => {
    useAppStore.setState({ migrationStatus: 'migrating' });
    render(<GuestConversionOverlay />);

    const overlay = screen.getByRole('alert');
    expect(overlay).toHaveAttribute('aria-live', 'polite');
    expect(overlay).toHaveAttribute('aria-busy', 'true');
  });

  it('displays spinner animation', () => {
    useAppStore.setState({ migrationStatus: 'migrating' });
    render(<GuestConversionOverlay />);

    const spinner = screen.getByRole('alert').querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('has correct z-index for overlay stacking', () => {
    useAppStore.setState({ migrationStatus: 'migrating' });
    render(<GuestConversionOverlay />);

    const overlay = screen.getByRole('alert');
    expect(overlay).toHaveClass('z-[9999]');
  });
});
