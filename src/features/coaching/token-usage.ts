import { createClient } from '@/lib/supabase/client';
import { estimateCost } from '@/lib/ai/pricing';

export interface TokenUsageSummary {
  totalTokens: number;
  // promptTokens/completionTokens are not tracked separately in the DB (only token_count total).
  // Kept in the interface for future use when per-role tracking is added.
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
  interactionCount: number;
  provider: string | null;
  model: string | null;
}

const EMPTY_SUMMARY: TokenUsageSummary = {
  totalTokens: 0,
  promptTokens: 0,
  completionTokens: 0,
  estimatedCost: 0,
  interactionCount: 0,
  provider: null,
  model: null,
};

// MVP: Client-side aggregation with a row cap. Replace with a Supabase RPC
// (SELECT SUM(token_count) ...) when usage volume justifies it.
const MAX_ROWS = 10_000;

interface ConversationRow {
  token_count: number | null;
  model: string | null;
  provider: string | null;
}

function aggregateRows(rows: ConversationRow[]): TokenUsageSummary {
  if (rows.length === 0) return { ...EMPTY_SUMMARY };

  let totalTokens = 0;
  let estimatedCost = 0;
  let lastProvider: string | null = null;
  let lastModel: string | null = null;

  for (const row of rows) {
    const tokens = row.token_count ?? 0;
    totalTokens += tokens;

    const provider = row.provider ?? 'unknown';
    const model = row.model ?? 'unknown';

    // Estimate cost assuming ~50/50 input/output split when we only have total
    const inputTokens = Math.floor(tokens * 0.5);
    const outputTokens = tokens - inputTokens;
    estimatedCost += estimateCost(provider, model, inputTokens, outputTokens);

    lastProvider = row.provider;
    lastModel = row.model;
  }

  return {
    totalTokens,
    promptTokens: 0,
    completionTokens: 0,
    estimatedCost,
    interactionCount: rows.length,
    provider: lastProvider,
    model: lastModel,
  };
}

export async function getSessionTokenUsage(sessionId: string): Promise<TokenUsageSummary> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('token_count, model, provider')
    .eq('session_id', sessionId)
    .limit(MAX_ROWS);

  if (error || !data) return { ...EMPTY_SUMMARY };
  return aggregateRows(data);
}

export async function getTotalTokenUsage(userId: string): Promise<TokenUsageSummary> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('token_count, model, provider')
    .eq('user_id', userId)
    .limit(MAX_ROWS);

  if (error || !data) return { ...EMPTY_SUMMARY };
  return aggregateRows(data);
}

export async function getRecentSessionUsage(userId: string): Promise<TokenUsageSummary | null> {
  const supabase = createClient();

  // Get the most recent session that has AI conversations
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('session_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;

  return getSessionTokenUsage(data[0].session_id);
}
