import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';
import { SessionExpiredModal } from './session-expired-modal';
import { useAppStore } from '@/stores/app-store';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({ sessionExpired: false });
});

describe('SessionExpiredModal', () => {
  it('does not render when sessionExpired is false', () => {
    useAppStore.setState({ sessionExpired: false });
    render(<SessionExpiredModal />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when sessionExpired is true', () => {
    useAppStore.setState({ sessionExpired: true });
    render(<SessionExpiredModal />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Session Expired')).toBeInTheDocument();
    expect(
      screen.getByText('Your session has expired. Sign in again to continue.')
    ).toBeInTheDocument();
  });

  it('renders data preservation reassurance message', () => {
    useAppStore.setState({ sessionExpired: true });
    render(<SessionExpiredModal />);
    expect(screen.getByText('Your practice data is safely saved locally.')).toBeInTheDocument();
  });

  it('renders a Sign In button', () => {
    useAppStore.setState({ sessionExpired: true });
    render(<SessionExpiredModal />);
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('navigates to login with redirect on button click', () => {
    useAppStore.setState({ sessionExpired: true });
    render(<SessionExpiredModal />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/^\/login\?redirectTo=/));
  });

  it('clears sessionExpired state on button click', () => {
    useAppStore.setState({ sessionExpired: true });
    render(<SessionExpiredModal />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(useAppStore.getState().sessionExpired).toBe(false);
  });

  it('has proper aria attributes for accessibility', () => {
    useAppStore.setState({ sessionExpired: true });
    render(<SessionExpiredModal />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'session-expired-title');
  });
});
