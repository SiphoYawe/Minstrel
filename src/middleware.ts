import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PATHS = ['/session', '/settings', '/replay'];
const AUTH_PATHS = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isAuth = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Only run auth check on protected or auth routes
  if (!isProtected && !isAuth) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    loginUrl.searchParams.set('redirectTo', pathname);
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
  matcher: [
    '/session/:path*',
    '/settings/:path*',
    '/replay/:path*',
    '/login/:path*',
    '/signup/:path*',
  ],
};
