'use client';

import { useState } from 'react';
import { VisualizationCanvas } from '@/components/viz/visualization-canvas';
import { StatusBar } from '@/components/status-bar';
import { SnapshotCTA } from '@/components/snapshot-cta';
import { DataCard } from '@/components/data-card';
import { AIChatPanel } from '@/components/ai-chat-panel';
import { DrillPanel } from '@/components/drill-panel';
import { DrillController } from '@/components/drill-controller';
import { PersonalRecords } from '@/components/personal-records';
import { WeeklySummary } from '@/components/weekly-summary';
import { useCoachingChat } from '@/features/coaching/coaching-client';
import { useDrillGeneration } from '@/hooks/use-drill-generation';
import { useDrillSession } from '@/hooks/use-drill-session';
import { useAppStore } from '@/stores/app-store';

export function DashboardChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setInput } =
    useCoachingChat();
  const drillGen = useDrillGeneration();
  const drillSession = useDrillSession(drillGen.drill);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [showEngagement, setShowEngagement] = useState(false);

  const isDrillSessionActive = drillSession.phase !== null;

  return (
    <div className="relative h-dvh w-full bg-background">
      <StatusBar />

      <div className="h-full pt-10 grid grid-cols-1 lg:grid-cols-[3fr_2fr] transition-all duration-300 overflow-y-auto lg:overflow-hidden">
        <div className="min-w-0 min-h-[400px] lg:min-h-0 h-full relative">
          <VisualizationCanvas />
          <SnapshotCTA
            onGenerateDrill={() => drillGen.generate()}
            isDrillGenerating={drillGen.isGenerating}
          />
        </div>

        <div className="flex flex-col h-full border-l border-border min-w-0">
          <div className="shrink-0">
            <DataCard />
          </div>
          <div className="h-px bg-border shrink-0" />

          {/* Active drill session: show DrillController */}
          {isDrillSessionActive && drillGen.drill && (
            <>
              <div className="shrink-0 p-3">
                <DrillController
                  drill={drillGen.drill}
                  currentPhase={drillSession.phase!}
                  currentRep={drillSession.currentRep}
                  repHistory={drillSession.repHistory}
                  improvementMessage={drillSession.improvementMessage}
                  onOneMore={drillSession.tryAgain}
                  onComplete={drillSession.complete}
                  onStartDrill={drillSession.startDrill}
                  onNewDrill={() => {
                    drillSession.complete();
                    drillGen.dismiss();
                    drillGen.generate();
                  }}
                  onDone={() => {
                    drillSession.complete();
                    drillGen.dismiss();
                  }}
                />
              </div>
              <div className="h-px bg-border shrink-0" />
            </>
          )}

          {/* Drill panel: shown when generating, error, or drill ready (but no active session) */}
          {!isDrillSessionActive && (drillGen.isGenerating || drillGen.error || drillGen.drill) && (
            <>
              <div className="shrink-0 p-3">
                <DrillPanel
                  drill={drillGen.drill}
                  isGenerating={drillGen.isGenerating}
                  error={drillGen.error}
                  onRetry={drillGen.retry}
                  onDismiss={drillGen.dismiss}
                  onStart={drillSession.startDrill}
                />
              </div>
              <div className="h-px bg-border shrink-0" />
            </>
          )}

          {/* Engagement toggle (authenticated users only) */}
          {isAuthenticated && (
            <>
              {/* Raw <button> retained: full-width accordion toggle with custom layout */}
              <button
                onClick={() => setShowEngagement((v) => !v)}
                className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-border hover:bg-card transition-colors duration-150"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  Progress
                </span>
                <span className="font-mono text-[10px] text-text-tertiary">
                  {showEngagement ? '−' : '+'}
                </span>
              </button>
              {showEngagement && (
                <div className="shrink-0 max-h-[280px] overflow-y-auto border-b border-border">
                  <WeeklySummary />
                  <div className="h-px bg-border" />
                  <PersonalRecords />
                </div>
              )}
            </>
          )}

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
