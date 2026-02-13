import { createClient } from '@/lib/supabase/client';

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

/**
 * Record token usage to the ai_conversations table.
 *
 * NOTE: Currently uses the browser Supabase client for RLS-authenticated inserts.
 * When Epic 4 integrates this into server-side API routes, switch the import to
 * `@/lib/supabase/server` (createClient from server) for cookie-based auth.
 */
export async function recordTokenUsage(params: TokenUsageParams): Promise<void> {
  const supabase = createClient();

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
  }
}

/**
 * Track token usage for a specific user and provider interaction.
 * Upserts a row into ai_conversations with prompt/completion breakdown.
 * Designed for server-side or client-side use after an AI response completes.
 */
export async function trackTokenUsage(
  userId: string,
  providerId: string,
  promptTokens: number,
  completionTokens: number
): Promise<void> {
  const supabase = createClient();

  const totalTokens = promptTokens + completionTokens;

  const { error } = await supabase.from('ai_conversations').insert({
    user_id: userId,
    provider: providerId,
    token_count: totalTokens,
    role: 'assistant',
    content: '',
    model: '',
    session_id: '',
    metadata: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      tracked_at: new Date().toISOString(),
    },
  });

  if (error) {
    console.error('Failed to track token usage:', error.message);
  }
}

/**
 * Get a summary of token usage for a user, aggregated across all interactions.
 */
export async function getTokenUsageSummary(userId: string): Promise<TokenUsageSummaryResult> {
  const supabase = createClient();

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
