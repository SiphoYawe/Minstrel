import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto';
import { validateApiKey } from './validate';
import { checkRateLimit, recordRequest } from './rate-limit';
import type { ApiResult } from '@/types/api';
import type { ApiKeyMetadata } from '@/features/auth/auth-types';

const postBodySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'other']),
  apiKey: z.string().min(10).max(500),
});

const deleteBodySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'other']),
});

function jsonResponse<T>(data: ApiResult<T>, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

function errorResponse(code: string, message: string, status = 400): NextResponse {
  return jsonResponse({ data: null, error: { code, message } }, status);
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { user: null, supabase };
  }
  return { user, supabase };
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const rateCheck = checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      return errorResponse('RATE_LIMITED', 'Too many key submissions — try again later.', 429);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('VALIDATION_ERROR', 'Invalid JSON body.', 400);
    }

    const parseResult = postBodySchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid request body.', 400);
    }

    const { provider, apiKey } = parseResult.data;

    // Record rate limit hit before validation (prevents abuse of provider API calls)
    recordRequest(user.id);

    const validation = await validateApiKey(provider, apiKey);
    if (!validation.valid && validation.error) {
      return jsonResponse(
        { data: null, error: { code: validation.error.code, message: validation.error.message } },
        400
      );
    }

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length < 32) {
      Sentry.captureMessage('ENCRYPTION_KEY is missing or too short (min 32 chars)', 'error');
      return errorResponse('SERVER_ERROR', 'Server configuration error.', 500);
    }

    const encryptedKey = encrypt(apiKey, encryptionKey);
    const keyLastFour = apiKey.slice(-4);

    const { data: upsertedRow, error: dbError } = await supabase
      .from('user_api_keys')
      .upsert(
        {
          user_id: user.id,
          provider,
          encrypted_key: encryptedKey,
          key_last_four: keyLastFour,
          status: 'active',
        },
        { onConflict: 'user_id,provider' }
      )
      .select('created_at, updated_at')
      .single();

    if (dbError) {
      Sentry.captureException(dbError, {
        tags: { component: 'api-keys', operation: 'upsert' },
      });
      return errorResponse('DB_ERROR', 'Failed to save API key.', 500);
    }

    const metadata: ApiKeyMetadata = {
      provider: provider as ApiKeyMetadata['provider'],
      lastFour: keyLastFour,
      status: 'active',
      createdAt: upsertedRow?.created_at ?? new Date().toISOString(),
      updatedAt: upsertedRow?.updated_at ?? new Date().toISOString(),
    };

    return jsonResponse({ data: metadata, error: null });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'api-keys', operation: 'post' },
    });
    return errorResponse('SERVER_ERROR', 'An unexpected error occurred.', 500);
  }
}

export async function GET() {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { data, error: dbError } = await supabase
      .from('user_api_keys')
      .select('provider, key_last_four, status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (dbError) {
      Sentry.captureException(dbError, {
        tags: { component: 'api-keys', operation: 'get' },
      });
      return errorResponse('DB_ERROR', 'Failed to load API keys.', 500);
    }

    if (!data || data.length === 0) {
      return jsonResponse({ data: null, error: null });
    }

    const metadata: ApiKeyMetadata = {
      provider: data[0].provider as ApiKeyMetadata['provider'],
      lastFour: data[0].key_last_four,
      status: data[0].status as ApiKeyMetadata['status'],
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at,
    };

    return jsonResponse({ data: metadata, error: null });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'api-keys', operation: 'get' },
    });
    return errorResponse('SERVER_ERROR', 'An unexpected error occurred.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('VALIDATION_ERROR', 'Invalid JSON body.', 400);
    }

    const parseResult = deleteBodySchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid request body.', 400);
    }

    const { provider } = parseResult.data;

    const { data, error: dbError } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider)
      .select('id');

    if (dbError) {
      Sentry.captureException(dbError, {
        tags: { component: 'api-keys', operation: 'delete' },
      });
      return errorResponse('DB_ERROR', 'Failed to delete API key.', 500);
    }

    if (!data || data.length === 0) {
      return errorResponse('NOT_FOUND', 'No key found for that provider.', 404);
    }

    return jsonResponse({ data: { deleted: true }, error: null });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'api-keys', operation: 'delete' },
    });
    return errorResponse('SERVER_ERROR', 'An unexpected error occurred.', 500);
  }
}
