/**
 * CSRF protection middleware for API routes.
 *
 * Validates that POST/DELETE requests originate from the same site by
 * checking the Origin header (or Referer fallback) against the app domain.
 */

const VERCEL_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+-[a-z0-9-]+\.vercel\.app$/;

function getOriginFromRequest(request: Request): string | null {
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin;
    } catch {
      return null;
    }
  }

  return null;
}

function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      const url = new URL(appUrl);
      origins.push(url.origin);
    } catch {
      // Invalid URL — skip
    }
  }

  // localhost development
  origins.push('http://localhost:3000');
  origins.push('http://127.0.0.1:3000');

  return origins;
}

/**
 * Validates CSRF for a request. Returns null if valid, or a 403 Response
 * if the origin is not allowed.
 */
export function validateCsrf(request: Request): Response | null {
  const method = request.method.toUpperCase();
  if (method !== 'POST' && method !== 'DELETE' && method !== 'PUT' && method !== 'PATCH') {
    return null; // Only validate state-changing methods
  }

  const requestOrigin = getOriginFromRequest(request);

  if (!requestOrigin) {
    return Response.json(
      { data: null, error: { code: 'CSRF_ERROR', message: 'Missing Origin header.' } },
      { status: 403 }
    );
  }

  const allowedOrigins = getAllowedOrigins();

  // Exact match against configured origins
  if (allowedOrigins.includes(requestOrigin)) {
    return null;
  }

  // Vercel preview deployment pattern
  if (VERCEL_PREVIEW_PATTERN.test(requestOrigin)) {
    return null;
  }

  return Response.json(
    { data: null, error: { code: 'CSRF_ERROR', message: 'Cross-origin request rejected.' } },
    { status: 403 }
  );
}
