'use client';

import { ApiKeyRequired } from '@/features/auth/api-key-required';

function ChatReadyState() {
  return (
    <div className="border border-border bg-card p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        AI Coaching
      </p>
      <p className="mt-3 font-sans text-[13px] leading-relaxed text-foreground">
        AI coaching ready &mdash; start a session to begin.
      </p>
    </div>
  );
}

export function AiChatPlaceholder() {
  return (
    <ApiKeyRequired feature="coaching">
      <ChatReadyState />
    </ApiKeyRequired>
  );
}
