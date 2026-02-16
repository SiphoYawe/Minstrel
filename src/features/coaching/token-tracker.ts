import { createClient } from '@/lib/supabase/server';
import * as Sentry from '@sentry/nextjs';
import { isValidUUID } from '@/lib/validation';

export interface TokenUsageParams {
  sessionId: string;
  userId: string;
  role: string;
  content: string;
  tokenCount: number;
  model: string;
  provider: string;
  metadata?: Record<string, unknown>;
}

export interface ExtractedTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TokenUsageSummaryResult {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  interactionCount: number;
  provider: string | null;
}

/**
 * Extract token usage from a Vercel AI SDK response.
 * Supports AI SDK v6 naming (inputTokens/outputTokens) and legacy naming
 * (promptTokens/completionTokens). Falls back to character-based estimation.
 */
export function extractTokenUsage(aiResponse: {
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
  text?: string;
}): ExtractedTokenUsage {
  const usage = aiResponse.usage;

  if (usage) {
    // AI SDK v6 uses inputTokens/outputTokens
    const prompt = usage.inputTokens ?? usage.promptTokens ?? 0;
    const completion = usage.outputTokens ?? usage.completionTokens ?? 0;
    const total =
      typeof usage.totalTokens === 'number' && usage.totalTokens > 0
        ? usage.totalTokens
        : prompt + completion;

    if (total > 0) {
      return { promptTokens: prompt, completionTokens: completion, totalTokens: total };
    }
  }

  // Fallback: estimate from text content (~4 chars per token)
  const text = aiResponse.text ?? '';
  const estimatedTokens = Math.ceil(text.length / 4);
  return {
    promptTokens: 0,
    completionTokens: estimatedTokens,
    totalTokens: estimatedTokens,
  };
}

// In-memory fallback queue for failed token tracking writes.
// Retries are drained on the next successful recordTokenUsage call.
const tokenFallbackQueue: Array<{
  params: TokenUsageParams;
  timestamp: number;
}> = [];

/** Get the current fallback queue size (for testing). */
export function getTokenFallbackQueueSize(): number {
  return tokenFallbackQueue.length;
}

/**
 * Record token usage to the ai_conversations table.
 * On failure, reports to Sentry and queues the record for retry.
 */
export async function recordTokenUsage(params: TokenUsageParams): Promise<void> {
  // SEC-M4: Validate sessionId is a valid UUID when non-empty
  if (params.sessionId && !isValidUUID(params.sessionId)) {
    console.error('Invalid sessionId format (not a UUID):', params.sessionId);
    return;
  }

  const supabase = await createClient();

  // Attempt to drain fallback queue first
  if (tokenFallbackQueue.length > 0) {
    const pending = [...tokenFallbackQueue];
    tokenFallbackQueue.length = 0;
    for (const entry of pending) {
      const { error: retryError } = await supabase.from('ai_conversations').insert({
        session_id: entry.params.sessionId,
        user_id: entry.params.userId,
        role: entry.params.role,
        content: entry.params.content,
        token_count: entry.params.tokenCount,
        model: entry.params.model,
        provider: entry.params.provider,
        metadata: entry.params.metadata ?? null,
      });
      if (retryError) {
        // Re-queue if retry also fails
        tokenFallbackQueue.push(entry);
      }
    }
  }

  const { error } = await supabase.from('ai_conversations').insert({
    session_id: params.sessionId,
    user_id: params.userId,
    role: params.role,
    content: params.content,
    token_count: params.tokenCount,
    model: params.model,
    provider: params.provider,
    metadata: params.metadata ?? null,
  });

  if (error) {
    console.error('Failed to record token usage:', error.message);
    Sentry.captureException(new Error(`Token tracking failed: ${error.message}`), {
      tags: { component: 'token-tracker' },
      extra: {
        provider: params.provider,
        model: params.model,
        tokenCount: params.tokenCount,
      },
    });
    // Queue for retry on next call
    tokenFallbackQueue.push({ params, timestamp: Date.now() });
  }
}

/**
 * Get a summary of token usage for a user, aggregated across all interactions.
 */
export async function getTokenUsageSummary(userId: string): Promise<TokenUsageSummaryResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('token_count, provider, metadata')
    .eq('user_id', userId)
    .limit(10_000);

  if (error || !data) {
    return {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      interactionCount: 0,
      provider: null,
    };
  }

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let lastProvider: string | null = null;

  for (const row of data) {
    const tokens = row.token_count ?? 0;
    totalTokens += tokens;

    // Extract prompt/completion breakdown from metadata if available
    const meta = row.metadata as Record<string, unknown> | null;
    if (meta && typeof meta.prompt_tokens === 'number') {
      totalPromptTokens += meta.prompt_tokens;
    }
    if (meta && typeof meta.completion_tokens === 'number') {
      totalCompletionTokens += meta.completion_tokens;
    }

    if (row.provider) {
      lastProvider = row.provider;
    }
  }

  return {
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    interactionCount: data.length,
    provider: lastProvider,
  };
}
