'use client';

import { createClient } from '@/lib/supabase/client';
import { capture, reset } from '@/lib/analytics';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    capture('user_logged_out');
    reset();

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <button
      onClick={logout}
      className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors duration-150 hover:text-foreground/60"
    >
      Sign Out
    </button>
  );
}
