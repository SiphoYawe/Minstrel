import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from './logout-button';

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return user ? (
    <div className="flex items-center gap-4">
      <Link
        href="/session"
        className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#7CB9E8] transition-colors duration-150 hover:brightness-110"
      >
        Practice
      </Link>
      <Link
        href="/settings"
        className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#666] transition-colors duration-150 hover:text-[#A3A3A3]"
      >
        Settings
      </Link>
      <LogoutButton />
    </div>
  ) : (
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
