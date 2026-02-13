import posthog from 'posthog-js';

/**
 * PostHog client-side analytics helpers.
 *
 * PostHog is initialized in instrumentation-client.ts for Next.js 15.3+.
 * These helper functions provide a consistent interface for capturing events,
 * identifying users, and tracking errors across the application.
 */

/**
 * Checks if PostHog is ready for use (client-side only).
 */
function isPostHogReady(): boolean {
  return typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_POSTHOG_KEY;
}

/**
 * Captures a custom event with optional properties.
 */
export function capture(event: string, properties?: Record<string, unknown>): void {
  if (!isPostHogReady()) return;
  posthog.capture(event, properties);
}

/**
 * Identifies a user with their unique ID and optional traits.
 * Call this on successful login or signup.
 */
export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!isPostHogReady()) return;
  posthog.identify(userId, traits);
}

/**
 * Resets the current user identity.
 * Call this on logout to disassociate events from the previous user.
 */
export function reset(): void {
  if (!isPostHogReady()) return;
  posthog.reset();
}

/**
 * Captures an exception for error tracking.
 * Uses PostHog's built-in exception capture.
 */
export function captureException(error: Error | unknown): void {
  if (!isPostHogReady()) return;
  posthog.captureException(error);
}

/**
 * Returns the current PostHog distinct ID (anonymous or identified).
 * Useful for correlating client and server-side events.
 */
export function getDistinctId(): string | undefined {
  if (!isPostHogReady()) return undefined;
  return posthog.get_distinct_id();
}

/**
 * Returns the current PostHog session ID.
 * Useful for correlating client and server-side events.
 */
export function getSessionId(): string | undefined {
  if (!isPostHogReady()) return undefined;
  return posthog.get_session_id();
}

// Re-export posthog for direct access when needed
export { posthog };
