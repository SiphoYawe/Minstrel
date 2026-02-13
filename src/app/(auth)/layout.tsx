'use client';

import { ReconnectSyncListener } from '@/components/reconnect-sync-listener';
import { SessionExpiredModal } from '@/components/session-expired-modal';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ReconnectSyncListener />
      <SessionExpiredModal />
      {children}
    </>
  );
}
