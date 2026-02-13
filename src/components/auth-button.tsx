import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProfileMenu } from './profile-menu';

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (user) {
    const email = (user as Record<string, unknown>).email as string | undefined;
    const displayName = (
      (user as Record<string, unknown>).user_metadata as Record<string, unknown> | undefined
    )?.display_name as string | undefined;
    return <ProfileMenu email={email ?? ''} displayName={displayName ?? null} />;
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#666] transition-colors duration-150 hover:text-[#A3A3A3]"
      >
        Sign In
      </Link>
      <Link
        href="/signup"
        className="inline-flex h-8 items-center bg-[#7CB9E8] px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[#0F0F0F] transition-all duration-150 hover:brightness-110"
      >
        Sign Up
      </Link>
    </div>
  );
}
