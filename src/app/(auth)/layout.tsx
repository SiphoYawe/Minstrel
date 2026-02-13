'use client';

import { ReconnectSyncListener } from '@/components/reconnect-sync-listener';
import { SessionExpiredModal } from '@/components/session-expired-modal';
import { AppSidebar } from '@/components/app-sidebar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Story 13.5: Skip-to-content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:text-primary focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <ReconnectSyncListener />
      <SessionExpiredModal />

      <div className="flex h-dvh w-screen overflow-hidden">
        <AppSidebar />
        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 overflow-auto outline-none">
          {children}
        </main>
      </div>
    </>
  );
}
