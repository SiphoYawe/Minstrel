import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { gzipSync } from 'zlib';

/** AI-L5: Threshold for gzip compression — session count above this triggers compression. */
const GZIP_SESSION_THRESHOLD = 100;

/**
 * GET /api/user/export
 *
 * GDPR-compliant data export endpoint. Returns all user data as a JSON
 * file download. SECURITY: Never includes encrypted_key from user_api_keys.
 * Only exposes provider, created_at, and last_four for API key metadata.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query all user data in parallel — NEVER include encrypted_key
  const [profile, sessions, metrics, conversations, apiKeys, achievements] = await Promise.all([
    supabase
      .from('profiles')
      .select('email, display_name, created_at')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('sessions').select('*').eq('user_id', user.id),
    supabase.from('progress_metrics').select('*').eq('user_id', user.id),
    supabase.from('ai_conversations').select('*').eq('user_id', user.id),
    supabase.from('user_api_keys').select('provider, created_at, last_four').eq('user_id', user.id),
    supabase.from('achievements').select('*').eq('user_id', user.id),
  ]);

  // Aggregate token usage by provider + model from ai_conversations (AI-M2)
  const conversationRows = conversations.data ?? [];
  const tokenAggregation = new Map<
    string,
    {
      provider: string;
      model: string;
      totalTokens: number;
      promptTokens: number;
      completionTokens: number;
      interactionCount: number;
    }
  >();

  for (const row of conversationRows) {
    const provider = (row.provider as string) || 'unknown';
    const model = (row.model as string) || 'unknown';
    const key = `${provider}::${model}`;

    let entry = tokenAggregation.get(key);
    if (!entry) {
      entry = {
        provider,
        model,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        interactionCount: 0,
      };
      tokenAggregation.set(key, entry);
    }

    entry.totalTokens += (row.token_count as number) ?? 0;
    entry.interactionCount += 1;

    const meta = row.metadata as Record<string, unknown> | null;
    if (meta) {
      if (typeof meta.prompt_tokens === 'number') {
        entry.promptTokens += meta.prompt_tokens;
      }
      if (typeof meta.completion_tokens === 'number') {
        entry.completionTokens += meta.completion_tokens;
      }
    }
  }

  const tokenUsage = Array.from(tokenAggregation.values());

  const exportData = {
    exportedAt: new Date().toISOString(),
    userId: user.id,
    email: user.email,
    profile: profile.data ?? null,
    sessions: sessions.data ?? [],
    progressMetrics: metrics.data ?? [],
    aiConversations: conversationRows,
    apiKeys: apiKeys.data ?? [],
    achievements: achievements.data ?? [],
    tokenUsage,
  };

  const dateStr = new Date().toISOString().split('T')[0];
  const jsonBody = JSON.stringify(exportData, null, 2);

  // AI-L5: Use gzip compression for large exports to stay within response size limits
  const sessionCount = (sessions.data ?? []).length;
  if (sessionCount >= GZIP_SESSION_THRESHOLD) {
    const compressed = gzipSync(Buffer.from(jsonBody, 'utf-8'));
    return new NextResponse(compressed, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
        'Content-Disposition': `attachment; filename="minstrel-data-export-${dateStr}.json"`,
      },
    });
  }

  return new NextResponse(jsonBody, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="minstrel-data-export-${dateStr}.json"`,
    },
  });
}
