'use client';

import { TroubleshootingPanel } from '@/components/troubleshooting-panel';
import { SilentCoach } from '@/features/modes/silent-coach';
import { useMidi } from '@/features/midi/use-midi';
import { getTroubleshootingSteps } from '@/features/midi/troubleshooting';
import { isAudioSupported } from '@/features/midi/audio-engine';
import { useGuestSession } from '@/features/session/use-guest-session';
import { useAnalysisPipeline } from '@/features/analysis/use-analysis-pipeline';
import { useSessionStore } from '@/stores/session-store';

export default function GuestPlayPage() {
  useGuestSession();
  useAnalysisPipeline();

  const currentMode = useSessionStore((s) => s.currentMode);

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
      {currentMode === 'silent-coach' && <SilentCoach />}
      {currentMode === 'dashboard-chat' && (
        <div className="flex h-screen items-center justify-center bg-background">
          <span className="font-mono text-caption text-muted-foreground">
            Dashboard + Chat — coming soon
          </span>
        </div>
      )}
      {currentMode === 'replay-studio' && (
        <div className="flex h-screen items-center justify-center bg-background">
          <span className="font-mono text-caption text-muted-foreground">
            Replay Studio — coming soon
          </span>
        </div>
      )}

      {/* Troubleshooting overlay (always available regardless of mode) */}
      {showTroubleshooting && (
        <TroubleshootingPanel
          steps={steps}
          onRetry={retryConnection}
          onDismiss={dismissTroubleshooting}
          onAudioFallback={startAudioMode}
          connectionStatus={connectionStatus}
        />
      )}
    </>
  );
}
