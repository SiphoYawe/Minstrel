import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';
import { checkRateLimit, rateLimitHeaders } from './rate-limiter';
import { AiError, aiErrorToResponse, classifyAiError } from './errors';
import type { SupportedProvider } from './provider';
import * as Sentry from '@sentry/nextjs';

export interface AuthenticatedContext {
  userId: string;
  providerId: SupportedProvider;
  apiKey: string;
}

export interface RateLimitConfig {
  /** Rate limit bucket name (e.g. 'chat', 'drill') */
  bucket?: string;
  /** Max requests per window (defaults to global RATE_LIMIT_MAX) */
  maxRequests?: number;
}

/**
 * Validate the user session, check rate limits, and decrypt the API key.
 * Returns the authenticated context or a Response to send back.
 */
export async function authenticateAiRequest(
  providerId: SupportedProvider,
  rateLimitConfig?: RateLimitConfig
): Promise<AuthenticatedContext | Response> {
  // 1. Validate session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Sign in to use AI features.' } },
      { status: 401 }
    );
  }

  // 2. Rate limit (separate buckets for chat vs drill)
  const bucket = rateLimitConfig?.bucket ?? 'ai';
  const rateLimitKey = `${bucket}:${user.id}`;
  const rateResult = await checkRateLimit(rateLimitKey, rateLimitConfig?.maxRequests);
  if (!rateResult.allowed) {
    const aiError = new AiError('RATE_LIMITED');
    const body = { data: null, error: { code: aiError.code, message: aiError.message } };
    return new Response(JSON.stringify(body), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimitHeaders(rateResult),
      },
    });
  }

  // 3. Fetch and decrypt API key
  const { data: keyRow, error: keyError } = await supabase
    .from('user_api_keys')
    .select('encrypted_key')
    .eq('user_id', user.id)
    .eq('provider', providerId)
    .single();

  if (keyError || !keyRow) {
    return Response.json(
      {
        data: null,
        error: { code: 'NO_API_KEY', message: 'Connect your API key in Settings.' },
      },
      { status: 400 }
    );
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    Sentry.captureMessage('ENCRYPTION_KEY environment variable is not set', 'error');
    return Response.json(
      { data: null, error: { code: 'GENERATION_FAILED', message: 'Server configuration error.' } },
      { status: 500 }
    );
  }

  try {
    const apiKey = decrypt(keyRow.encrypted_key, encryptionKey);
    return { userId: user.id, providerId, apiKey };
  } catch (err) {
    Sentry.captureException(err);
    return Response.json(
      {
        data: null,
        error: { code: 'GENERATION_FAILED', message: 'Could not process your API key.' },
      },
      { status: 500 }
    );
  }
}

/**
 * Wrap an AI operation with error classification and Sentry reporting.
 * Never logs the API key.
 */
export async function withAiErrorHandling(operation: () => Promise<Response>): Promise<Response> {
  try {
    return await operation();
  } catch (error) {
    const aiError = classifyAiError(error);
    Sentry.captureException(error, {
      tags: { aiErrorCode: aiError.code },
    });
    return aiErrorToResponse(aiError);
  }
}
