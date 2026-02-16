'use client';

import { useState, useCallback } from 'react';
import { VisualizationCanvas } from '@/components/viz/visualization-canvas';
import { StatusBar } from '@/components/status-bar';
import { SnapshotCTA } from '@/components/snapshot-cta';
import { DataCard } from '@/components/data-card';
import { AIChatPanel } from '@/components/ai-chat-panel';
import { DrillPanel } from '@/components/drill-panel';
import { DrillRequestCard } from '@/components/drill-request-card';
import { DrillController } from '@/components/drill-controller';
import { PersonalRecords } from '@/components/personal-records';
import { WeeklySummary } from '@/components/weekly-summary';
import { useCoachingChat } from '@/features/coaching/coaching-client';
import { useDrillGeneration } from '@/hooks/use-drill-generation';
import { useDrillSession } from '@/hooks/use-drill-session';
import { useAppStore } from '@/stores/app-store';
import { useSessionStore } from '@/stores/session-store';

export function DashboardChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setInput } =
    useCoachingChat();
  const drillGen = useDrillGeneration();
  const drillSession = useDrillSession(drillGen.drill);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [showEngagement, setShowEngagement] = useState(false);
  const [pendingDrillRequest, setPendingDrillRequest] = useState<{
    weakness: string;
    focusArea: string;
  } | null>(null);

  const isDrillSessionActive = drillSession.phase !== null;

  const handleRequestDrill = useCallback(() => {
    const snapshot = useSessionStore.getState().currentSnapshot;
    const weakness = snapshot?.keyInsight ?? 'General practice session';
    const focusArea =
      snapshot?.insights && snapshot.insights.length > 0
        ? snapshot.insights[0].text
        : 'Targeted drill based on your current session';
    setPendingDrillRequest({ weakness, focusArea });
  }, []);

  const handleConfirmDrill = useCallback(() => {
    if (pendingDrillRequest) {
      drillGen.generate(pendingDrillRequest.weakness);
      setPendingDrillRequest(null);
    }
  }, [pendingDrillRequest, drillGen]);

  const handleCancelDrillRequest = useCallback(() => {
    setPendingDrillRequest(null);
  }, []);

  return (
    <div className="relative h-dvh w-full bg-background">
      <StatusBar />

      <main className="h-full pt-10 grid grid-cols-1 lg:grid-cols-[3fr_2fr] transition-all duration-300 overflow-y-auto lg:overflow-hidden">
        <div className="min-w-0 min-h-[400px] lg:min-h-0 h-full relative">
          <VisualizationCanvas />
          <SnapshotCTA
            onGenerateDrill={handleRequestDrill}
            isDrillGenerating={drillGen.isGenerating}
          />
        </div>

        <div className="flex flex-col h-full border-l border-border min-w-0">
          <div className="shrink-0">
            <DataCard />
          </div>
          <div className="h-px bg-border shrink-0" />

          {/* Drill request confirmation card */}
          {pendingDrillRequest &&
            !isDrillSessionActive &&
            !drillGen.isGenerating &&
            !drillGen.drill && (
              <>
                <div className="shrink-0 p-3">
                  <DrillRequestCard
                    weakness={pendingDrillRequest.weakness}
                    focusArea={pendingDrillRequest.focusArea}
                    onGenerate={handleConfirmDrill}
                    onCancel={handleCancelDrillRequest}
                    isGenerating={false}
                  />
                </div>
                <div className="h-px bg-border shrink-0" />
              </>
            )}

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
                aria-expanded={showEngagement}
                aria-controls="engagement-section"
                className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-border hover:bg-card transition-colors duration-150"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  Progress
                </span>
                <span className="font-mono text-[10px] text-text-tertiary" aria-hidden="true">
                  {showEngagement ? '−' : '+'}
                </span>
              </button>
              <span className="sr-only" aria-live="polite">
                {showEngagement ? 'Progress section expanded' : 'Progress section collapsed'}
              </span>
              {showEngagement && (
                <div
                  id="engagement-section"
                  className="shrink-0 max-h-[280px] overflow-y-auto border-b border-border"
                >
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
      </main>
    </div>
  );
}
