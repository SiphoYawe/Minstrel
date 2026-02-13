'use client';

import { VisualizationCanvas } from '@/components/viz/visualization-canvas';
import { StatusBar } from '@/components/status-bar';
import { SnapshotCTA } from '@/components/snapshot-cta';

/**
 * Silent Coach mode — full-screen immersive visualization.
 * Only the Canvas, StatusBar overlay, and SnapshotCTA are rendered.
 * ModeSwitcher is now integrated into the StatusBar (Story 13.2).
 */
export function SilentCoach() {
  return (
    <div className="relative h-dvh w-full bg-background">
      {/* Canvas fills the entire viewport */}
      <div className="absolute inset-0 pt-10">
        <VisualizationCanvas />
        <SnapshotCTA />
      </div>

      {/* StatusBar — fixed top overlay (includes ModeSwitcher) */}
      <StatusBar />
    </div>
  );
}
