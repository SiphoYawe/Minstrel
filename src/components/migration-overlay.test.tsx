import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MigrationOverlay } from './migration-overlay';
import { useAppStore } from '@/stores/app-store';

describe('MigrationOverlay', () => {
  beforeEach(() => {
    useAppStore.setState({
      migrationStatus: 'idle',
      migrationProgress: { synced: 0, total: 0 },
    });
  });

  it('renders nothing when migration is idle', () => {
    const { container } = render(<MigrationOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when migration is complete', () => {
    useAppStore.setState({ migrationStatus: 'complete' });
    const { container } = render(<MigrationOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders blocking overlay when migrating', () => {
    useAppStore.setState({ migrationStatus: 'migrating' });
    render(<MigrationOverlay />);

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText(/Moving your practice data/)).toBeDefined();
  });

  it('shows session progress when total > 0', () => {
    useAppStore.setState({
      migrationStatus: 'migrating',
      migrationProgress: { synced: 2, total: 5 },
    });
    render(<MigrationOverlay />);

    expect(screen.getByText('2 of 5 sessions synced')).toBeDefined();
  });

  it('hides progress when total is 0', () => {
    useAppStore.setState({
      migrationStatus: 'migrating',
      migrationProgress: { synced: 0, total: 0 },
    });
    render(<MigrationOverlay />);

    expect(screen.queryByText(/sessions synced/)).toBeNull();
  });
});
