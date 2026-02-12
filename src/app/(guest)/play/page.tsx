'use client';

import { StatusBar } from '@/components/status-bar';
import { VisualizationCanvas } from '@/components/viz/visualization-canvas';
import { TroubleshootingPanel } from '@/components/troubleshooting-panel';
import { AudioModeBanner } from '@/components/audio-mode-banner';
import { GuestPrompt } from '@/components/guest-prompt';
import { ApiKeyPrompt } from '@/components/api-key-prompt';
import { useMidi } from '@/features/midi/use-midi';
import { getTroubleshootingSteps } from '@/features/midi/troubleshooting';
import { isAudioSupported } from '@/features/midi/audio-engine';
import { useGuestSession } from '@/features/session/use-guest-session';

export default function GuestPlayPage() {
  useGuestSession();

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
    <div className="flex h-screen flex-col bg-background pb-10">
      {/* Banners — stacked above the canvas */}
      <AudioModeBanner />
      <GuestPrompt />

      {/* Main stage — visualization takes all available space */}
      <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Canvas — the star */}
        <div className="flex-1">
          <VisualizationCanvas />
        </div>

        {/* Sidebar — AI feature placeholder */}
        <aside className="shrink-0 border-t border-border p-4 lg:w-72 lg:border-l lg:border-t-0">
          <ApiKeyPrompt />
        </aside>
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

      <StatusBar />
    </div>
  );
}
