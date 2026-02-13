'use client';

import { VisualizationCanvas } from '@/components/viz/visualization-canvas';
import { StatusBar } from '@/components/status-bar';
import { ModeSwitcher } from '@/features/modes/mode-switcher';
import { DataCard } from '@/components/data-card';
import { AIChatPanel } from '@/components/ai-chat-panel';
import { useCoachingChat } from '@/features/coaching/coaching-client';

export function DashboardChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setInput } =
    useCoachingChat();

  return (
    <div className="relative h-dvh w-screen bg-background">
      <StatusBar />

      <div className="fixed right-4 top-12 z-30">
        <ModeSwitcher />
      </div>

      <div
        className="h-full pt-10 grid transition-all duration-300"
        style={{ gridTemplateColumns: '3fr 2fr' }}
      >
        <div className="min-w-0 h-full">
          <VisualizationCanvas />
        </div>

        <div className="flex flex-col h-full border-l border-[#1A1A1A] min-w-0">
          <div className="shrink-0">
            <DataCard />
          </div>
          <div className="h-px bg-[#1A1A1A] shrink-0" />
          <div className="flex-1 min-h-0">
            <AIChatPanel
              messages={messages}
              input={input}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              setInput={setInput}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
