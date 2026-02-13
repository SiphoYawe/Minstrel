'use client';

import { useCallback } from 'react';
import { VisualizationCanvas } from '@/components/viz/visualization-canvas';
import { StatusBar } from '@/components/status-bar';
import { ModeSwitcher } from '@/features/modes/mode-switcher';
import { DataCard } from '@/components/data-card';
import { AIChatPanel } from '@/components/ai-chat-panel';
import { useSessionStore } from '@/stores/session-store';
import type { ChatMessage } from '@/features/coaching/coaching-types';

export function DashboardChat() {
  const chatHistory = useSessionStore((s) => s.chatHistory);
  const addChatMessage = useSessionStore((s) => s.addChatMessage);

  const handleSubmit = useCallback(
    (content: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      addChatMessage(userMessage);
    },
    [addChatMessage]
  );

  return (
    <div className="relative h-dvh w-screen bg-background">
      {/* StatusBar — fixed top overlay */}
      <StatusBar />

      {/* ModeSwitcher — top right, below StatusBar */}
      <div className="fixed right-4 top-12 z-30">
        <ModeSwitcher />
      </div>

      {/* Main content grid: Canvas (60%) | Panel (40%) */}
      <div
        className="h-full pt-10 grid transition-all duration-300"
        style={{ gridTemplateColumns: '3fr 2fr' }}
      >
        {/* Left: Visualization Canvas */}
        <div className="min-w-0 h-full">
          <VisualizationCanvas />
        </div>

        {/* Right: Data + Chat panel */}
        <div className="flex flex-col h-full border-l border-[#1A1A1A] min-w-0">
          {/* Data cards (top) */}
          <div className="shrink-0">
            <DataCard />
          </div>

          {/* Separator */}
          <div className="h-px bg-[#1A1A1A] shrink-0" />

          {/* Chat panel (bottom, fills remaining space) */}
          <div className="flex-1 min-h-0">
            <AIChatPanel messages={chatHistory} onSubmit={handleSubmit} isLoading={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
