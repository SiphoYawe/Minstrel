import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
    supabase
      .from('user_api_keys')
      .select('provider, created_at, last_four')
      .eq('user_id', user.id),
    supabase.from('achievements').select('*').eq('user_id', user.id),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    userId: user.id,
    email: user.email,
    profile: profile.data ?? null,
    sessions: sessions.data ?? [],
    progressMetrics: metrics.data ?? [],
    aiConversations: conversations.data ?? [],
    apiKeys: apiKeys.data ?? [],
    achievements: achievements.data ?? [],
  };

  const dateStr = new Date().toISOString().split('T')[0];

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="minstrel-data-export-${dateStr}.json"`,
    },
  });
}
