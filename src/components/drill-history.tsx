'use client';

import { Button } from '@/components/ui/button';

interface DrillHistoryRecord {
  drillId: string;
  targetSkill: string;
  createdAt: string;
  status: string;
  results: {
    repsCompleted?: number;
    accuracyAchieved?: number;
    passed?: boolean;
  } | null;
}

interface DrillHistoryProps {
  drills: DrillHistoryRecord[];
  onRestart: (drillId: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);

  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TrendIndicator({
  status,
  results,
}: {
  status: string;
  results: DrillHistoryRecord['results'];
}) {
  if (status === 'generated') {
    return (
      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
        New
      </span>
    );
  }

  if (!results || results.accuracyAchieved === undefined) {
    return <span className="font-mono text-[9px] text-muted-foreground">—</span>;
  }

  const accuracy = Math.round(results.accuracyAchieved * 100);
  const passed = results.passed;

  return (
    <span
      className={`font-mono text-[11px] tabular-nums ${
        passed
          ? 'text-accent-success'
          : accuracy >= 50
            ? 'text-accent-warm'
            : 'text-muted-foreground'
      }`}
    >
      {accuracy}%
    </span>
  );
}

function DrillHistoryCard({
  drill,
  onRestart,
}: {
  drill: DrillHistoryRecord;
  onRestart: () => void;
}) {
  const reps = drill.results?.repsCompleted ?? 0;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 hover:bg-card/60 transition-colors duration-150 group">
      {/* Left: skill name + date */}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-foreground truncate">
          {drill.targetSkill}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-mono text-[9px] text-muted-foreground">
            {formatDate(drill.createdAt)}
          </span>
          {reps > 0 && (
            <>
              <span className="w-px h-2.5 bg-border" />
              <span className="font-mono text-[9px] text-muted-foreground">
                {reps} rep{reps !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Center: accuracy indicator */}
      <TrendIndicator status={drill.status} results={drill.results} />

      {/* Right: restart button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRestart}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 font-mono text-[9px] uppercase tracking-[0.1em] h-6 px-2"
      >
        Restart
      </Button>
    </div>
  );
}

export function DrillHistory({ drills, onRestart }: DrillHistoryProps) {
  if (drills.length === 0) {
    return (
      <div className="px-3 py-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">
          No drills yet
        </p>
        <p className="font-sans text-[11px] text-muted-foreground/70 leading-relaxed">
          Generate your first drill from a practice session
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[320px] overflow-y-auto" role="list" aria-label="Drill history">
      {drills.map((drill) => (
        <div key={drill.drillId} role="listitem">
          <DrillHistoryCard drill={drill} onRestart={() => onRestart(drill.drillId)} />
        </div>
      ))}
    </div>
  );
}
