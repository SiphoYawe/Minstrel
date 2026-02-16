import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoutButton } from '../logout-button';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
}));

// Mock Supabase client
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  capture: vi.fn(),
  reset: vi.fn(),
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sign out button', () => {
    render(<LogoutButton />);
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('shows confirmation dialog when button is clicked', async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    await user.click(signOutButton);

    // Dialog should appear
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Sign out?')).toBeInTheDocument();
  });

  it('logs out when confirmation button is clicked', async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    // Click sign out button
    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    await user.click(signOutButton);

    // Confirm in dialog
    const confirmButton = await screen.findByRole('button', { name: /^sign out$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('does not log out when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    // Click sign out button
    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    await user.click(signOutButton);

    // Cancel in dialog
    const cancelButton = await screen.findByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Should not have called signOut
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
