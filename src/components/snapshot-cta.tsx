'use client';

import { useSessionStore } from '@/stores/session-store';

export function SnapshotCTA() {
  const currentSnapshot = useSessionStore((s) => s.currentSnapshot);
  const setCurrentMode = useSessionStore((s) => s.setCurrentMode);

  if (!currentSnapshot) return null;

  return (
    <div className="absolute bottom-16 left-1/2 z-20 -translate-x-1/2 flex gap-3 animate-[fadeUp_300ms_ease-out]">
      <button
        onClick={() => setCurrentMode('dashboard-chat')}
        className="inline-flex h-9 items-center gap-2 border border-[#2A2A2A] bg-[#0F0F0F]/90 px-4
          font-mono text-[11px] uppercase tracking-[0.1em] text-[#999]
          backdrop-blur-sm transition-all duration-150
          hover:border-[#7CB9E8]/30 hover:text-[#7CB9E8]"
      >
        View Dashboard
      </button>
      <button
        onClick={() => {
          setCurrentMode('dashboard-chat');
        }}
        className="inline-flex h-9 items-center gap-2 bg-[#7CB9E8]/10 border border-[#7CB9E8]/20 px-4
          font-mono text-[11px] uppercase tracking-[0.1em] text-[#7CB9E8]
          backdrop-blur-sm transition-all duration-150
          hover:bg-[#7CB9E8]/20 hover:border-[#7CB9E8]/40"
      >
        Generate Drill
      </button>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translate(-50%, 8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
