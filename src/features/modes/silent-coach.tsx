'use client';

import { VisualizationCanvas } from '@/components/viz/visualization-canvas';
import { StatusBar } from '@/components/status-bar';
import { ModeSwitcher } from '@/features/modes/mode-switcher';
import { SnapshotCTA } from '@/components/snapshot-cta';

/**
 * Silent Coach mode — full-screen immersive visualization.
 * Only the Canvas, StatusBar overlay, and ModeSwitcher are rendered.
 * No chat, no data cards, no sidebars.
 */
export function SilentCoach() {
  return (
    <div className="relative h-dvh w-screen bg-background">
      {/* Canvas fills the entire viewport */}
      <div className="absolute inset-0 pt-10">
        <VisualizationCanvas />
        <SnapshotCTA />
      </div>

      {/* StatusBar — fixed top overlay (positioned via its own CSS) */}
      <StatusBar />

      {/* ModeSwitcher — top right, below StatusBar */}
      <div className="fixed right-4 top-12 z-30">
        <ModeSwitcher />
      </div>
    </div>
  );
}
