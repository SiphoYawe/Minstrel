import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

// Helper: build a cloneable URL that mimics NextURL
function buildCloneableUrl(pathname: string) {
  const url = new URL(pathname, 'http://localhost:3000');
  // NextURL has a clone() method that returns a mutable copy
  (url as Record<string, unknown>).clone = () => new URL(url.toString());
  return url;
}

// Helper: build a minimal NextRequest-like object
function buildRequest(pathname: string): NextRequest {
  const nextUrl = buildCloneableUrl(pathname);
  const cookieStore = new Map<string, string>();

  return {
    url: nextUrl.toString(),
    nextUrl,
    cookies: {
      getAll: () => Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => cookieStore.set(name, value),
      get: (name: string) => {
        const v = cookieStore.get(name);
        return v !== undefined ? { name, value: v } : undefined;
      },
      delete: (name: string) => cookieStore.delete(name),
    },
  } as unknown as NextRequest;
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: unauthenticated
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  // Re-import middleware fresh for each test to avoid module caching issues
  async function runMiddleware(pathname: string) {
    const { middleware } = await import('./middleware');
    const request = buildRequest(pathname);
    return middleware(request);
  }

  // ──────────────────────────────────────────────
  // Public routes (passthrough)
  // ──────────────────────────────────────────────

  it('passes through public route /', async () => {
    const response = await runMiddleware('/');
    // NextResponse.next() returns a response with no redirect
    expect(response.headers.get('location')).toBeNull();
  });

  it('passes through public route /play', async () => {
    const response = await runMiddleware('/play');
    expect(response.headers.get('location')).toBeNull();
  });

  it('passes through /api/* routes', async () => {
    const response = await runMiddleware('/api/ai/chat');
    expect(response.headers.get('location')).toBeNull();
  });

  it('passes through /auth/* routes', async () => {
    const response = await runMiddleware('/auth/confirm');
    expect(response.headers.get('location')).toBeNull();
  });

  // ──────────────────────────────────────────────
  // Protected routes — unauthenticated users
  // ──────────────────────────────────────────────

  it('redirects unauthenticated user from /session to /login with redirectTo', async () => {
    const response = await runMiddleware('/session');
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location!);
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('redirectTo')).toBe('/session');
  });

  it('redirects unauthenticated user from /settings to /login with redirectTo', async () => {
    const response = await runMiddleware('/settings');
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location!);
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('redirectTo')).toBe('/settings');
  });

  it('redirects unauthenticated user from /replay to /login with redirectTo', async () => {
    const response = await runMiddleware('/replay');
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location!);
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('redirectTo')).toBe('/replay');
  });

  it('redirects unauthenticated user from /replay/some-session to /login', async () => {
    const response = await runMiddleware('/replay/some-session');
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location!);
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('redirectTo')).toBe('/replay/some-session');
  });

  // ──────────────────────────────────────────────
  // Protected routes — authenticated users
  // ──────────────────────────────────────────────

  it('allows authenticated user to access /session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const response = await runMiddleware('/session');
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows authenticated user to access /settings', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const response = await runMiddleware('/settings');
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows authenticated user to access /replay', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const response = await runMiddleware('/replay');
    expect(response.headers.get('location')).toBeNull();
  });

  // ──────────────────────────────────────────────
  // Auth routes — authenticated users (redirect away)
  // ──────────────────────────────────────────────

  it('redirects authenticated user from /login to /session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const response = await runMiddleware('/login');
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location!);
    expect(url.pathname).toBe('/session');
  });

  it('redirects authenticated user from /signup to /session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const response = await runMiddleware('/signup');
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location!);
    expect(url.pathname).toBe('/session');
  });

  // ──────────────────────────────────────────────
  // Auth routes — unauthenticated users (passthrough)
  // ──────────────────────────────────────────────

  it('allows unauthenticated user to access /login', async () => {
    const response = await runMiddleware('/login');
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows unauthenticated user to access /signup', async () => {
    const response = await runMiddleware('/signup');
    expect(response.headers.get('location')).toBeNull();
  });

  // ──────────────────────────────────────────────
  // Redirect path validation (SEC-L1)
  // ──────────────────────────────────────────────

  it('validates redirect path - blocks protocol-based paths', async () => {
    const { validateRedirectPath } = await import('./middleware');
    expect(validateRedirectPath('https://evil.com/steal')).toBe('/');
    expect(validateRedirectPath('http://attacker.io')).toBe('/');
    expect(validateRedirectPath('javascript://alert(1)')).toBe('/');
  });

  it('validates redirect path - allows safe relative paths', async () => {
    const { validateRedirectPath } = await import('./middleware');
    expect(validateRedirectPath('/session')).toBe('/session');
    expect(validateRedirectPath('/settings')).toBe('/settings');
    expect(validateRedirectPath('/replay/abc-123')).toBe('/replay/abc-123');
  });

  it('validates redirect path - blocks paths not starting with /', async () => {
    const { validateRedirectPath } = await import('./middleware');
    expect(validateRedirectPath('evil.com/redirect')).toBe('/');
    expect(validateRedirectPath('')).toBe('/');
  });

  it('applies redirect validation when redirecting unauthenticated users', async () => {
    const response = await runMiddleware('/session');
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location!);
    // redirectTo should be the validated pathname
    expect(url.searchParams.get('redirectTo')).toBe('/session');
  });

  // ──────────────────────────────────────────────
  // Config / matcher export
  // ──────────────────────────────────────────────

  it('exports a config with matcher covering protected and auth routes', async () => {
    const { config } = await import('./middleware');
    expect(config.matcher).toContain('/session/:path*');
    expect(config.matcher).toContain('/settings/:path*');
    expect(config.matcher).toContain('/replay/:path*');
    expect(config.matcher).toContain('/login/:path*');
    expect(config.matcher).toContain('/signup/:path*');
  });

  // ──────────────────────────────────────────────
  // Uses getUser() not getSession()
  // ──────────────────────────────────────────────

  it('calls getUser for auth validation, not getSession', async () => {
    await runMiddleware('/session');
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });
});
