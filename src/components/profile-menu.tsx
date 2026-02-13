'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import { capture, reset } from '@/lib/analytics';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProfileMenuProps {
  email: string;
  displayName: string | null;
}

export function ProfileMenu({ email, displayName }: ProfileMenuProps) {
  const router = useRouter();

  const initial = (displayName ?? email ?? '?').charAt(0).toUpperCase();
  const label = displayName ?? email.split('@')[0];

  const handleSignOut = async () => {
    capture('user_logged_out');
    reset();
    const supabase = createClient();
    await supabase.auth.signOut();
    useAppStore.getState().clearUser();
    router.push('/');
  };

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/session"
        className="font-mono text-[11px] uppercase tracking-[0.12em] text-primary transition-colors duration-150 hover:brightness-110"
      >
        Practice
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 transition-colors duration-150 hover:opacity-80 focus:outline-none"
            aria-label="Profile menu"
          >
            <div
              className="flex h-7 w-7 items-center justify-center bg-primary/15 text-[11px] font-medium text-primary"
              aria-hidden="true"
            >
              {initial}
            </div>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.08em] text-secondary sm:inline">
              {label}
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48 border-surface-light bg-background">
          <DropdownMenuItem asChild>
            <Link
              href="/settings"
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-secondary focus:bg-card focus:text-foreground"
            >
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-surface-light" />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground focus:bg-card focus:text-foreground"
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
