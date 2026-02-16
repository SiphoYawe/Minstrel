'use client';

import { VisualizationCanvas } from '@/components/viz/visualization-canvas';
import { SnapshotCTA } from '@/components/snapshot-cta';
import { CanvasLegend } from '@/components/viz/canvas-legend';
import { ChordProgressionStrip } from '@/components/chord-progression-strip';
import { ChordHud } from '@/components/viz/chord-hud';
import { SessionEmptyState } from '@/components/session-empty-state';
import { useSessionStore } from '@/stores/session-store';

/**
 * Silent Coach mode — full-screen immersive visualization.
 * Canvas fills viewport. StatusBar is hoisted to session page layout (Story 28.2).
 */
export function SilentCoach() {
  const hasSnapshot = useSessionStore((s) => !!s.currentSnapshot);

  return (
    <div className="relative h-dvh w-full bg-background">
      {/* Canvas fills the entire viewport */}
      <div className="absolute inset-0 pt-10">
        <VisualizationCanvas />
        <SessionEmptyState />
        <ChordHud />
        <SnapshotCTA />
        <CanvasLegend />
        {!hasSnapshot && <ChordProgressionStrip />}
      </div>
    </div>
  );
}
