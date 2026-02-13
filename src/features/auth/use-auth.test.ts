import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth, validateSignUp, validateSignIn } from './use-auth';
import { useAppStore } from '@/stores/app-store';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock Supabase client
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
const mockSignUp = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
const mockSignInWithPassword = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  capture: vi.fn(),
  reset: vi.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasApiKey: false,
    });
  });

  describe('signOut', () => {
    it('redirects to / after sign out', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/');
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('does NOT redirect to /login after sign out', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockPush).not.toHaveBeenCalledWith('/login');
    });

    it('clears the user from app store on sign out', async () => {
      useAppStore.setState({
        user: { id: 'u1', email: 'test@test.com', displayName: 'Test' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(useAppStore.getState().isAuthenticated).toBe(false);
      expect(useAppStore.getState().user).toBeNull();
    });
  });

  describe('signIn', () => {
    it('redirects to /session by default after sign in', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const res = await result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(res.error).toBeNull();
      });

      expect(mockPush).toHaveBeenCalledWith('/session');
    });

    it('redirects to custom path when redirectTo is provided', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const res = await result.current.signIn(
          { email: 'test@example.com', password: 'password123' },
          '/settings'
        );
        expect(res.error).toBeNull();
      });

      expect(mockPush).toHaveBeenCalledWith('/settings');
    });

    it('returns validation error for invalid email', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const res = await result.current.signIn({
          email: 'not-an-email',
          password: 'password123',
        });
        expect(res.error).toBe('Please enter a valid email address.');
      });

      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it('returns validation error for empty password', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const res = await result.current.signIn({
          email: 'test@example.com',
          password: '',
        });
        expect(res.error).toBe('Password is required.');
      });

      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it('returns mapped error on sign-in failure', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: 'Invalid login credentials' },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const res = await result.current.signIn({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
        expect(res.error).toContain('didn\u2019t match');
      });
    });
  });
});

describe('validateSignUp', () => {
  const validData = {
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    dateOfBirth: '2000-01-01',
  };

  it('returns null for valid data', () => {
    expect(validateSignUp(validData)).toBeNull();
  });

  it('rejects empty email', () => {
    expect(validateSignUp({ ...validData, email: '' })).toContain('email');
  });

  it('rejects email without @', () => {
    expect(validateSignUp({ ...validData, email: 'notanemail' })).toContain('email');
  });

  it('rejects short password', () => {
    const result = validateSignUp({ ...validData, password: 'short', confirmPassword: 'short' });
    expect(result).toContain('8 characters');
  });

  it('rejects mismatched passwords', () => {
    const result = validateSignUp({ ...validData, confirmPassword: 'different123' });
    expect(result).toContain('match');
  });

  it('rejects missing date of birth', () => {
    const result = validateSignUp({ ...validData, dateOfBirth: '' });
    expect(result).toContain('Date of birth');
  });

  it('rejects users under 13 (COPPA)', () => {
    const today = new Date();
    const underAge = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    const result = validateSignUp({
      ...validData,
      dateOfBirth: underAge.toISOString().split('T')[0],
    });
    expect(result).toContain('13 years old');
  });

  it('accepts users exactly 13 years old', () => {
    const today = new Date();
    const exactly13 = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    const result = validateSignUp({
      ...validData,
      dateOfBirth: exactly13.toISOString().split('T')[0],
    });
    expect(result).toBeNull();
  });

  it('accepts users over 13', () => {
    const result = validateSignUp({ ...validData, dateOfBirth: '1990-06-15' });
    expect(result).toBeNull();
  });

  it('rejects users who are 12 and 364 days old', () => {
    const today = new Date();
    const almostThirteen = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate() + 1
    );
    const result = validateSignUp({
      ...validData,
      dateOfBirth: almostThirteen.toISOString().split('T')[0],
    });
    expect(result).toContain('13 years old');
  });
});

describe('validateSignIn', () => {
  it('returns null for valid data', () => {
    expect(validateSignIn({ email: 'test@example.com', password: 'password' })).toBeNull();
  });

  it('rejects empty email', () => {
    expect(validateSignIn({ email: '', password: 'password' })).toContain('email');
  });

  it('rejects email without @', () => {
    expect(validateSignIn({ email: 'bad', password: 'password' })).toContain('email');
  });

  it('rejects empty password', () => {
    expect(validateSignIn({ email: 'test@example.com', password: '' })).toContain('Password');
  });
});
