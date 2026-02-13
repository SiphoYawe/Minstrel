import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider } from './auth-provider';
import { useAppStore } from '@/stores/app-store';

// Mock Supabase client
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      hasApiKey: false,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('sets loading to false after initial auth check with no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(useAppStore.getState().isLoading).toBe(false);
    });
    expect(useAppStore.getState().isAuthenticated).toBe(false);
  });

  it('sets user in appStore when authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { display_name: 'Test User' },
        },
      },
    });

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(useAppStore.getState().isAuthenticated).toBe(true);
    });
    expect(useAppStore.getState().user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
    });
  });

  it('subscribes to auth state changes', () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    );

    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('clears user on sign-out auth state change', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com', user_metadata: {} },
      },
    });

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(useAppStore.getState().isAuthenticated).toBe(true);
    });

    // Simulate sign-out via auth state change callback
    const callback = mockOnAuthStateChange.mock.calls[0][0];
    callback('SIGNED_OUT', null);

    expect(useAppStore.getState().isAuthenticated).toBe(false);
    expect(useAppStore.getState().user).toBeNull();
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = vi.fn();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { unmount } = render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    );

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
