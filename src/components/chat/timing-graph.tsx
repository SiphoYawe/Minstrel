'use client';

interface TimingGraphProps {
  early: number;
  onTime: number;
  late: number;
}

export function TimingGraph({ early, onTime, late }: TimingGraphProps) {
  const total = early + onTime + late || 1;
  const earlyPct = Math.round((early / total) * 100);
  const onTimePct = Math.round((onTime / total) * 100);
  const latePct = Math.round((late / total) * 100);

  return (
    <div className="my-2 p-3 bg-surface-1 border border-border">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-sans">
        Timing Distribution
      </p>
      <div className="flex gap-1 h-6">
        {earlyPct > 0 && (
          <div
            className="bg-accent-warm flex items-center justify-center text-[9px] font-mono text-background"
            style={{ width: `${earlyPct}%`, minWidth: earlyPct > 5 ? undefined : '20px' }}
          >
            {earlyPct}%
          </div>
        )}
        {onTimePct > 0 && (
          <div
            className="bg-accent-success flex items-center justify-center text-[9px] font-mono text-background"
            style={{ width: `${onTimePct}%`, minWidth: onTimePct > 5 ? undefined : '20px' }}
          >
            {onTimePct}%
          </div>
        )}
        {latePct > 0 && (
          <div
            className="bg-accent-warm flex items-center justify-center text-[9px] font-mono text-background"
            style={{ width: `${latePct}%`, minWidth: latePct > 5 ? undefined : '20px' }}
          >
            {latePct}%
          </div>
        )}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-1">
        <span>Early</span>
        <span>On Time</span>
        <span>Late</span>
      </div>
    </div>
  );
}
