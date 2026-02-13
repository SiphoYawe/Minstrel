'use client';

import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/stores/session-store';

interface DrillSuggestionProps {
  drillName: string;
  targetSkill: string;
}

export function DrillSuggestion({ drillName, targetSkill }: DrillSuggestionProps) {
  void targetSkill;
  const setPendingDrillRequest = useSessionStore((s) => s.setPendingDrillRequest);

  function handleStartDrill() {
    setPendingDrillRequest(true);
  }

  return (
    <div className="my-2 p-3 bg-surface-1 border border-border">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-sans">
        Suggested Drill
      </p>
      <p className="text-sm text-foreground font-mono mb-2">{drillName}</p>
      <p className="text-[10px] text-muted-foreground mb-2 font-sans">Focus: {targetSkill}</p>
      <Button
        onClick={handleStartDrill}
        className="h-7 px-3 bg-primary text-background hover:brightness-90 font-mono text-[10px] uppercase tracking-wider"
      >
        Start This Drill
      </Button>
    </div>
  );
}
