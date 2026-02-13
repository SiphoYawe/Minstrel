import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

/**
 * Returns a singleton PostHog server-side client.
 * Configured for server-side analytics with immediate flushing
 * since Next.js server functions can be short-lived.
 */
export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      // Flush immediately for server-side tracking (short-lived functions)
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

/**
 * Shuts down the PostHog client gracefully.
 * Call this after capturing events in API routes.
 */
export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}
