'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { createClient } from '@/lib/supabase/client';
import { capture, reset } from '@/lib/analytics';
import {
  Play,
  LayoutDashboard,
  Clock,
  Trophy,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/session', label: 'Session', icon: Play },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/achievements', label: 'Achievements', icon: Trophy },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const setCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const user = useAppStore((s) => s.user);

  const handleSignOut = async () => {
    capture('user_logged_out');
    reset();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside
      className={`
        shrink-0 h-dvh flex flex-col
        border-r border-border bg-card/50
        sidebar-transition overflow-hidden
        ${collapsed ? 'w-[52px]' : 'w-[180px]'}
      `}
      aria-label="Main navigation"
    >
      {/* Logo + Collapse toggle */}
      <div className="shrink-0 h-10 flex items-center justify-between border-b border-border px-2">
        <a
          href="/session"
          onClick={(e) => {
            e.preventDefault();
            router.push('/session');
          }}
          className="flex items-center gap-2 min-w-0"
          aria-label="Minstrel home"
        >
          <Image
            src="/minstrel-symbol.svg"
            alt=""
            width={20}
            height={20}
            className="shrink-0 invert"
            aria-hidden="true"
          />
          {!collapsed && (
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-foreground truncate">
              Minstrel
            </span>
          )}
        </a>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="
            w-6 h-6 flex items-center justify-center shrink-0
            text-muted-foreground hover:text-foreground
            transition-colors duration-150
          "
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 flex flex-col gap-0.5 py-2 px-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                router.push(item.href);
              }}
              className={`
                flex items-center gap-2.5 h-9 px-2
                font-mono text-[11px] uppercase tracking-[0.08em]
                transition-colors duration-150
                ${
                  isActive
                    ? 'text-primary bg-primary/8 border-l-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card border-l-2 border-transparent'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" strokeWidth={1.5} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </a>
          );
        })}
      </nav>

      {/* User section at bottom */}
      <div className="shrink-0 border-t border-border px-1.5 py-2">
        {user && !collapsed && (
          <div className="px-2 mb-1.5">
            <span className="block text-xs text-foreground/80 truncate">{user.email}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="
            flex items-center gap-2.5 h-9 px-2 w-full
            font-mono text-[11px] uppercase tracking-[0.08em]
            text-muted-foreground hover:text-accent-warm
            transition-colors duration-150
          "
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" strokeWidth={1.5} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
