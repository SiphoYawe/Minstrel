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

/**
 * Extract token usage from a Vercel AI SDK response.
 * Falls back to character-based estimation if the SDK doesn't provide counts.
 */
export function extractTokenUsage(aiResponse: {
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  text?: string;
}): ExtractedTokenUsage {
  const usage = aiResponse.usage;

  if (usage && typeof usage.totalTokens === 'number' && usage.totalTokens > 0) {
    return {
      promptTokens: usage.promptTokens ?? 0,
      completionTokens: usage.completionTokens ?? 0,
      totalTokens: usage.totalTokens,
    };
  }

  if (
    usage &&
    typeof usage.promptTokens === 'number' &&
    typeof usage.completionTokens === 'number' &&
    (usage.promptTokens > 0 || usage.completionTokens > 0)
  ) {
    return {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.promptTokens + usage.completionTokens,
    };
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
