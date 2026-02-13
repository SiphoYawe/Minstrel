'use client';

interface PracticeTipProps {
  content: string;
}

export function PracticeTip({ content }: PracticeTipProps) {
  return (
    <div className="my-2 border-l-2 border-primary pl-3 py-2 bg-surface-1">
      <p className="text-[10px] uppercase tracking-wider text-primary mb-1 font-sans">
        Practice Tip
      </p>
      <p className="text-sm text-foreground font-sans">{content}</p>
    </div>
  );
}
