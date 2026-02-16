'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

export function ApiKeyExpiryBanner() {
  const apiKeyStatus = useAppStore((s) => s.apiKeyStatus);
  const [dismissed, setDismissed] = useState(false);

  if (apiKeyStatus !== 'invalid' || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center justify-between gap-3 border border-accent-warm/20 bg-accent-warm/10 px-4 py-2 text-accent-warm font-mono text-xs tracking-wide"
    >
      <p>Your API key may have expired. Update it in Settings to continue coaching.</p>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/settings#api-keys"
          aria-label="Go to settings"
          className="underline underline-offset-2 hover:text-white transition-colors"
        >
          SETTINGS
        </a>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss notification"
          className="p-1 hover:text-white transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
