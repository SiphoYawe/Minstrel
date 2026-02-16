import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PATHS = ['/session', '/settings', '/replay'];
const AUTH_PATHS = ['/login', '/signup'];

/**
 * Validates a redirect path to prevent open redirect attacks (SEC-L1).
 * Only allows relative paths that start with '/' and don't contain protocol indicators.
 */
export function validateRedirectPath(path: string): string {
  if (path.startsWith('/') && !path.includes('://')) {
    return path;
  }
  return '/';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isAuth = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Only run auth check on protected or auth routes
  if (!isProtected && !isAuth) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes: redirect unauthenticated users to login
  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirectTo', validateRedirectPath(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Auth routes: redirect authenticated users to session
  if (user && isAuth) {
    const sessionUrl = request.nextUrl.clone();
    sessionUrl.pathname = '/session';
    return NextResponse.redirect(sessionUrl);
  }

  return response;
}

export const config = {
  // SEC-L2: API routes (/api/*) are intentionally excluded from this middleware.
  // Each API route handler performs its own auth check via createClient() + getUser()
  // because API routes need granular control: some are public (e.g., health checks),
  // and middleware cannot reliably distinguish between authenticated API calls
  // (which use cookie-based sessions) and server-to-server calls.
  matcher: [
    '/session/:path*',
    '/settings/:path*',
    '/replay/:path*',
    '/login/:path*',
    '/signup/:path*',
  ],
};
