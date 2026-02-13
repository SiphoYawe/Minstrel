'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

interface UseOnlineStatusOptions {
  /** Callback fired once when connection is restored */
  onReconnect?: () => void;
}

/**
 * SSR-safe hook that tracks browser online/offline state.
 *
 * - `isOnline` reflects `navigator.onLine` in real time.
 * - `wasOffline` is true for 3 seconds after reconnecting, so UI can
 *   show a transient "Back online" indicator.
 * - `onReconnect` fires once per offline-to-online transition.
 */
export function useOnlineStatus(options?: UseOnlineStatusOptions): OnlineStatus {
  const { onReconnect } = options ?? {};

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  const wasOfflineRef = useRef(false);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setWasOffline(true);
    wasOfflineRef.current = true;

    onReconnectRef.current?.();

    // Clear wasOffline after 3 seconds
    setTimeout(() => {
      setWasOffline(false);
      wasOfflineRef.current = false;
    }, 3000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline };
}
