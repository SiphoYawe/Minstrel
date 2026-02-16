'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TroubleshootingPanel } from '@/components/troubleshooting-panel';
import { KeyboardShortcutsPanel } from '@/components/keyboard-shortcuts-panel';
import { FirstRunPrompt } from '@/components/first-run-prompt';
import { ReturnSessionBanner } from '@/components/return-session-banner';
import { SessionSummary } from '@/components/session-summary';
import { WarmUpPrompt } from '@/components/warm-up-prompt';
import { AchievementToast } from '@/components/achievement-toast';
import type { AchievementToastItem } from '@/components/achievement-toast';
import { ErrorBanner } from '@/components/error-banner';
import { MidiConnectionLoading } from '@/components/midi-connection-loading';
import { AudioModeLimitations } from '@/components/audio-mode-limitations';
import { SilentCoach } from '@/features/modes/silent-coach';
import { DashboardChat } from '@/features/modes/dashboard-chat';
import { ReplayStudio } from '@/features/modes/replay-studio';
import { useMidi } from '@/features/midi/use-midi';
import { getTroubleshootingSteps } from '@/features/midi/troubleshooting';
import { isAudioSupported } from '@/features/midi/audio-engine';
import { useAnalysisPipeline } from '@/features/analysis/use-analysis-pipeline';
import { useSessionStore } from '@/stores/session-store';
import { useAchievements } from '@/features/engagement/use-achievements';
import { buildTriggerContext } from '@/features/engagement/achievement-engine';
import { achievementRegistry } from '@/features/engagement/achievement-definitions';
import { startWarmUp, skipWarmUp } from '@/features/session/warm-up-flow';

export default function SessionPage() {
  useAnalysisPipeline();
  const router = useRouter();

  const currentMode = useSessionStore((s) => s.currentMode);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const showSummary = useSessionStore((s) => s.showSessionSummary);

  // Achievement system
  const { recentlyUnlocked, evaluateSessionAchievements, dismissRecent } = useAchievements();
  const achievementEvaluatedRef = useRef(false);

  // Evaluate achievements when session summary appears
  useEffect(() => {
    if (!showSummary || achievementEvaluatedRef.current) return;
    achievementEvaluatedRef.current = true;

    const state = useSessionStore.getState();
    const context = buildTriggerContext({
      totalNotesPlayed: state.totalNotesPlayed,
      timingAccuracy: state.timingAccuracy / 100,
      detectedGenres: state.detectedGenres.map((g) => g.genre),
      chordsDetected: state.detectedChords.map((c) => `${c.root}${c.quality}`),
      sessionDurationMs: state.sessionStartTimestamp ? Date.now() - state.sessionStartTimestamp : 0,
    });

    evaluateSessionAchievements(context, activeSessionId != null ? String(activeSessionId) : null);
  }, [showSummary, activeSessionId, evaluateSessionAchievements]);

  // Reset evaluation flag when summary is dismissed
  useEffect(() => {
    if (!showSummary) {
      achievementEvaluatedRef.current = false;
    }
  }, [showSummary]);

  // Map recently unlocked achievements to toast items
  const toastItems: AchievementToastItem[] = recentlyUnlocked.map((u) => {
    const def = achievementRegistry.get(u.achievementId);
    return {
      achievementId: u.achievementId,
      name: def?.name ?? u.achievementId,
      description: def?.description ?? '',
      icon: def?.icon ?? '',
      category: def?.category ?? 'Genre',
    };
  });

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
    useSessionStore.getState().setShowSessionSummary(false);
  }, []);

  const handleContinuePracticing = useCallback(() => {
    useSessionStore.getState().setShowSessionSummary(false);
  }, []);

  const handleViewReplay = useCallback(() => {
    useSessionStore.getState().setShowSessionSummary(false);
    useSessionStore.getState().setCurrentMode('replay-studio');
  }, []);

  const handleEndSession = useCallback(() => {
    useSessionStore.getState().setShowSessionSummary(false);
    useSessionStore.getState().resetAnalysis();
    router.push('/dashboard');
  }, [router]);

  return (
    <>
      {/* Centralized error banner — visible across all modes */}
      <ErrorBanner />
      <MidiConnectionLoading />

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
          onEndSession={handleEndSession}
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

      {/* Audio mode limitations explainer */}
      <AudioModeLimitations />

      <KeyboardShortcutsPanel />

      {/* Achievement notifications */}
      {toastItems.length > 0 && (
        <AchievementToast achievements={toastItems} onDismiss={dismissRecent} />
      )}
    </>
  );
}
