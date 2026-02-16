'use client';

import { StreakStatus, type StreakData } from '@/features/engagement/engagement-types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StreakBadgeProps {
  streak: StreakData;
}

function FlameIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? 'text-[hsl(var(--accent-warm))]' : 'text-muted-foreground'}
      aria-hidden="true"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function getTooltipText(streak: StreakData): string {
  switch (streak.streakStatus) {
    case StreakStatus.AtRisk:
      return 'Ready for today\u2019s session?';
    case StreakStatus.Broken:
      return 'Your next session starts a new streak';
    case StreakStatus.Milestone:
      return `Day ${streak.currentStreak} milestone`;
    case StreakStatus.Active:
    default:
      return `${streak.currentStreak} day streak`;
  }
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const isActive =
    streak.streakStatus === StreakStatus.Active || streak.streakStatus === StreakStatus.Milestone;
  const isAtRisk = streak.streakStatus === StreakStatus.AtRisk;
  const isMilestone = streak.streakStatus === StreakStatus.Milestone;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-sans ${
              isMilestone ? 'shadow-[0_0_8px_hsl(var(--accent-success)/0.3)]' : ''
            }`}
            aria-label={`Practice streak: ${streak.currentStreak} days`}
          >
            <FlameIcon active={isActive || isAtRisk} />
            <span className={isActive || isAtRisk ? 'text-foreground' : 'text-muted-foreground'}>
              {streak.currentStreak > 0 ? `Day ${streak.currentStreak}` : 'No streak'}
            </span>
            {isMilestone && (
              <span role="status" aria-live="polite" className="sr-only">
                Milestone reached: Day {streak.currentStreak}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>{getTooltipText(streak)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
