'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { createClient } from '@/lib/supabase/client';
import { capture, reset } from '@/lib/analytics';

interface NavItem {
  href: string;
  label: string;
  /** Unicode icon character */
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/session', label: 'Session', icon: '\u25B6' },
  { href: '/dashboard', label: 'Dashboard', icon: '\u25A6' },
  { href: '/history', label: 'History', icon: '\u2630' },
  { href: '/achievements', label: 'Achievements', icon: '\u2606' },
  { href: '/settings', label: 'Settings', icon: '\u2699' },
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
      {/* Collapse toggle */}
      <div className="shrink-0 h-10 flex items-center border-b border-border px-2">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="
            w-8 h-8 flex items-center justify-center
            text-muted-foreground hover:text-foreground
            transition-colors duration-150
          "
        >
          <span className="text-sm" aria-hidden="true">
            {collapsed ? '\u276F' : '\u276E'}
          </span>
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
              <span className="w-5 text-center text-sm shrink-0" aria-hidden="true">
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </a>
          );
        })}
      </nav>

      {/* User section at bottom */}
      <div className="shrink-0 border-t border-border px-1.5 py-2">
        {user && !collapsed && (
          <div className="px-2 mb-1.5">
            <span className="block text-[10px] text-muted-foreground truncate">{user.email}</span>
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
          <span className="w-5 text-center text-sm shrink-0" aria-hidden="true">
            {'\u2192'}
          </span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
