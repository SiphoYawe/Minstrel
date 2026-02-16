'use client';

import { VisualizationCanvas } from '@/components/viz/visualization-canvas';
import { StatusBar } from '@/components/status-bar';
import { SnapshotCTA } from '@/components/snapshot-cta';
import { CanvasLegend } from '@/components/viz/canvas-legend';
import { ChordProgressionStrip } from '@/components/chord-progression-strip';
import { ChordHud } from '@/components/viz/chord-hud';
import { SessionEmptyState } from '@/components/session-empty-state';
import { useSessionStore } from '@/stores/session-store';

/**
 * Silent Coach mode — full-screen immersive visualization.
 * Only the Canvas, StatusBar overlay, and SnapshotCTA are rendered.
 * ModeSwitcher is now integrated into the StatusBar (Story 13.2).
 */
export function SilentCoach() {
  const hasSnapshot = useSessionStore((s) => !!s.currentSnapshot);

  return (
    <main id="main-content" className="relative h-dvh w-full bg-background">
      {/* Canvas fills the entire viewport */}
      <div className="absolute inset-0 pt-10">
        <VisualizationCanvas />
        <SessionEmptyState />
        <ChordHud />
        <SnapshotCTA />
        <CanvasLegend />
        {!hasSnapshot && <ChordProgressionStrip />}
      </div>

      {/* StatusBar — fixed top overlay (includes ModeSwitcher) */}
      <StatusBar />
    </main>
  );
}
