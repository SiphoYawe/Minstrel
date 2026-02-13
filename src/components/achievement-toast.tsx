'use client';

import { useState, useEffect, useRef } from 'react';
import { Music, Crosshair, CalendarDays, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AchievementToastItem {
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

interface AchievementToastProps {
  achievements: AchievementToastItem[];
  onDismiss: () => void;
}

const DISMISS_MS = 4000;
const STAGGER_MS = 300;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Genre: Music,
  Technique: Crosshair,
  Consistency: CalendarDays,
  PersonalRecord: TrendingUp,
};

function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? Music;
}

export function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
  const [visibleSet, setVisibleSet] = useState<Set<string>>(new Set());
  const [exitingSet, setExitingSet] = useState<Set<string>>(new Set());
  const dismissedCount = useRef(0);
  const totalCount = achievements.length;

  useEffect(() => {
    if (achievements.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    achievements.forEach((achievement, index) => {
      const showTimer = setTimeout(() => {
        setVisibleSet((prev) => new Set([...prev, achievement.achievementId]));
      }, index * STAGGER_MS);
      timers.push(showTimer);

      const exitTimer = setTimeout(
        () => {
          setExitingSet((prev) => new Set([...prev, achievement.achievementId]));
        },
        index * STAGGER_MS + DISMISS_MS - 300
      );
      timers.push(exitTimer);

      const dismissTimer = setTimeout(
        () => {
          dismissedCount.current += 1;
          if (dismissedCount.current >= totalCount) {
            onDismiss();
          }
        },
        index * STAGGER_MS + DISMISS_MS
      );
      timers.push(dismissTimer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [achievements, totalCount, onDismiss]);

  if (achievements.length === 0) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: '340px' }}
    >
      {achievements.map((achievement) => {
        const isVisible = visibleSet.has(achievement.achievementId);
        const isExiting = exitingSet.has(achievement.achievementId);
        const Icon = getCategoryIcon(achievement.category);

        return (
          <div
            key={achievement.achievementId}
            className="pointer-events-auto transition-all duration-300 ease-out"
            style={{
              transform: isVisible && !isExiting ? 'translateX(0)' : 'translateX(120%)',
              opacity: isVisible && !isExiting ? 1 : 0,
            }}
          >
            <div
              className="relative flex items-start gap-3 bg-card border-l-2 border-l-accent-success border-r border-t border-b border-r-surface-light border-t-surface-light border-b-surface-light px-3 py-2.5"
              role="alert"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-background border border-surface-light text-accent-success">
                <Icon className="w-4 h-4" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white leading-tight truncate">
                  {achievement.name}
                </p>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                  {achievement.description}
                </p>
              </div>

              {/* Progress line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-surface-light">
                <div
                  className="h-full bg-accent-success/40"
                  style={{
                    width: isVisible && !isExiting ? '0%' : '100%',
                    transition:
                      isVisible && !isExiting ? `width ${DISMISS_MS - 600}ms linear` : 'none',
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}

      <span className="sr-only">
        {achievements.length === 1
          ? `Achievement unlocked: ${achievements[0].name}`
          : `${achievements.length} achievements unlocked: ${achievements.map((a) => a.name).join(', ')}`}
      </span>
    </div>
  );
}
