'use client';

import { useCallback, useState } from 'react';
import { TroubleshootingPanel } from '@/components/troubleshooting-panel';
import { KeyboardShortcutsPanel } from '@/components/keyboard-shortcuts-panel';
import { FirstRunPrompt } from '@/components/first-run-prompt';
import { ReturnSessionBanner } from '@/components/return-session-banner';
import { SessionSummary } from '@/components/session-summary';
import { WarmUpPrompt } from '@/components/warm-up-prompt';
import { SilentCoach } from '@/features/modes/silent-coach';
import { DashboardChat } from '@/features/modes/dashboard-chat';
import { ReplayStudio } from '@/features/modes/replay-studio';
import { useMidi } from '@/features/midi/use-midi';
import { getTroubleshootingSteps } from '@/features/midi/troubleshooting';
import { isAudioSupported } from '@/features/midi/audio-engine';
import { useAnalysisPipeline } from '@/features/analysis/use-analysis-pipeline';
import { useSessionStore } from '@/stores/session-store';
import { startWarmUp, skipWarmUp } from '@/features/session/warm-up-flow';

export default function SessionPage() {
  useAnalysisPipeline();

  const currentMode = useSessionStore((s) => s.currentMode);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const [showSummary, setShowSummary] = useState(false);

  const {
    connectionStatus,
    showTroubleshooting,
    detectedChannel,
    retryConnection,
    dismissTroubleshooting,
    startAudioMode,
  } = useMidi();

  const steps = getTroubleshootingSteps(connectionStatus, detectedChannel, isAudioSupported());

  const handleDismissSummary = useCallback(() => {
    setShowSummary(false);
  }, []);

  const handleContinuePracticing = useCallback(() => {
    setShowSummary(false);
    useSessionStore.getState().resetAnalysis();
  }, []);

  const handleViewReplay = useCallback(() => {
    setShowSummary(false);
    useSessionStore.getState().setCurrentMode('replay-studio');
  }, []);

  const handleSaveAndReview = useCallback(() => {
    setShowSummary(false);
    useSessionStore.getState().setCurrentMode('replay-studio');
  }, []);

  return (
    <>
      {/* Mode-specific layout */}
      <div className="relative">
        <FirstRunPrompt />
        <ReturnSessionBanner />
        <WarmUpPrompt onStartWarmUp={startWarmUp} onSkip={skipWarmUp} />
        {currentMode === 'silent-coach' && <SilentCoach />}
        {currentMode === 'dashboard-chat' && <DashboardChat />}
        {currentMode === 'replay-studio' && <ReplayStudio sessionId={activeSessionId} />}
      </div>

      {/* Session summary overlay */}
      {showSummary && (
        <SessionSummary
          onDismiss={handleDismissSummary}
          onContinuePracticing={handleContinuePracticing}
          onViewReplay={handleViewReplay}
          onSaveAndReview={handleSaveAndReview}
        />
      )}

      {/* Troubleshooting overlay */}
      {showTroubleshooting && (
        <TroubleshootingPanel
          steps={steps}
          onRetry={retryConnection}
          onDismiss={dismissTroubleshooting}
          onAudioFallback={startAudioMode}
          connectionStatus={connectionStatus}
        />
      )}

      <KeyboardShortcutsPanel />
    </>
  );
}
