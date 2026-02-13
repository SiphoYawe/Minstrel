'use client';

import { TroubleshootingPanel } from '@/components/troubleshooting-panel';
import { KeyboardShortcutsPanel } from '@/components/keyboard-shortcuts-panel';
import { FirstRunPrompt } from '@/components/first-run-prompt';
import { ReturnSessionBanner } from '@/components/return-session-banner';
import { SilentCoach } from '@/features/modes/silent-coach';
import { DashboardChat } from '@/features/modes/dashboard-chat';
import { ReplayStudio } from '@/features/modes/replay-studio';
import { useMidi } from '@/features/midi/use-midi';
import { getTroubleshootingSteps } from '@/features/midi/troubleshooting';
import { isAudioSupported } from '@/features/midi/audio-engine';
import { useAnalysisPipeline } from '@/features/analysis/use-analysis-pipeline';
import { useSessionStore } from '@/stores/session-store';

export default function SessionPage() {
  useAnalysisPipeline();

  const currentMode = useSessionStore((s) => s.currentMode);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  const {
    connectionStatus,
    showTroubleshooting,
    detectedChannel,
    retryConnection,
    dismissTroubleshooting,
    startAudioMode,
  } = useMidi();

  const steps = getTroubleshootingSteps(connectionStatus, detectedChannel, isAudioSupported());

  return (
    <>
      {/* Mode-specific layout */}
      <div className="relative">
        <FirstRunPrompt />
        <ReturnSessionBanner />
        {currentMode === 'silent-coach' && <SilentCoach />}
        {currentMode === 'dashboard-chat' && <DashboardChat />}
        {currentMode === 'replay-studio' && <ReplayStudio sessionId={activeSessionId} />}
      </div>

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
