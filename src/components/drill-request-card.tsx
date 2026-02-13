'use client';

import { Button } from '@/components/ui/button';

interface DrillRequestCardProps {
  weakness: string;
  focusArea: string;
  onGenerate: () => void;
  onCancel: () => void;
  isGenerating: boolean;
}

export function DrillRequestCard({
  weakness,
  focusArea,
  onGenerate,
  onCancel,
  isGenerating,
}: DrillRequestCardProps) {
  return (
    <div className="border border-primary/20 bg-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block h-1.5 w-1.5 bg-primary" aria-hidden="true" />
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          Drill Request
        </p>
      </div>

      {/* Weakness */}
      <div className="mb-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
          Identified Weakness
        </p>
        <p className="font-sans text-[13px] leading-relaxed text-foreground">{weakness}</p>
      </div>

      {/* Focus area */}
      <div className="mb-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
          Suggested Focus
        </p>
        <p className="font-sans text-[12px] leading-relaxed text-muted-foreground">{focusArea}</p>
      </div>

      {/* Separator */}
      <div className="h-px bg-border mb-4" />

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em]"
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isGenerating}
          className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em]"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
