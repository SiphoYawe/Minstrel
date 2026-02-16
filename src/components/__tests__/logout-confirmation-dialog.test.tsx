import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoutConfirmationDialog } from '../logout-confirmation-dialog';

describe('LogoutConfirmationDialog', () => {
  it('renders dialog when open is true', () => {
    render(<LogoutConfirmationDialog open={true} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Sign out?')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<LogoutConfirmationDialog open={false} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows correct title and description text', () => {
    render(<LogoutConfirmationDialog open={true} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByText('Sign out?')).toBeInTheDocument();
    expect(
      screen.getByText(/your practice data is saved.*resume your session/i)
    ).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();

    render(
      <LogoutConfirmationDialog open={true} onOpenChange={vi.fn()} onConfirm={handleConfirm} />
    );

    const confirmButton = screen.getByRole('button', { name: /sign out/i });
    await user.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <LogoutConfirmationDialog open={true} onOpenChange={handleOpenChange} onConfirm={vi.fn()} />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('has correct accessibility roles', () => {
    render(<LogoutConfirmationDialog open={true} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<LogoutConfirmationDialog open={true} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    const title = screen.getByText('Sign out?');
    expect(title).toHaveClass('font-mono', 'uppercase');

    const confirmButton = screen.getByRole('button', { name: /sign out/i });
    expect(confirmButton).toHaveClass('font-mono', 'uppercase', 'text-accent-warm');
  });
});
