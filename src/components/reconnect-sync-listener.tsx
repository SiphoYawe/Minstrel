'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { useAppStore } from '@/stores/app-store';
import { syncPendingSessions } from '@/lib/dexie/sync';

/**
 * Invisible component that listens for network reconnection
 * and triggers a sync of pending sessions to Supabase.
 * Mounted in the auth layout so it is active for authenticated users.
 */
export function ReconnectSyncListener() {
  useOnlineStatus({
    onReconnect: () => {
      const user = useAppStore.getState().user;
      if (user?.id) {
        syncPendingSessions(user.id).catch(() => {
          // Sync failure is non-critical; will retry next reconnect or session start
        });
      }
    },
  });

  return null;
}
