'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import {
  AchievementCategory,
  type AchievementDisplayItem,
} from '@/features/engagement/engagement-types';
import { fetchAchievementDisplay } from '@/features/engagement/achievement-service';
import {
  achievementRegistry,
  ACHIEVEMENT_COUNT,
} from '@/features/engagement/achievement-definitions';

type FilterCategory = 'all' | AchievementCategory;

const CATEGORY_ICONS: Record<string, string> = {
  Genre: '\u266A',
  Technique: '\u25CE',
  Consistency: '\u25B0',
  PersonalRecord: '\u2191',
};

const ICON_MAP: Record<string, string> = {
  jazz: '\u266B',
  blues: '\u266A',
  pop: '\u2606',
  classical: '\u2669',
  rock: '\u26A1',
  precision: '\u25CE',
  smooth: '\u223F',
  target: '\u25C9',
  notes: '\u266C',
  drill: '\u2726',
  calendar: '\u25A3',
  xp: '\u2B50',
  sessions: '\u25B6',
  speed: '\u21E7',
  accuracy: '\u25C9',
  complexity: '\u2234',
};

function getIcon(definition: AchievementDisplayItem['definition']): string {
  return ICON_MAP[definition.icon] ?? CATEGORY_ICONS[definition.category] ?? '\u2605';
}

function formatUnlockedDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AchievementGallery() {
  const [items, setItems] = useState<AchievementDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterCategory>('all');

  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (isAuthenticated && user?.id) {
        try {
          const displayItems = await fetchAchievementDisplay(user.id);
          if (!cancelled) {
            setItems(displayItems);
          }
        } catch {
          // Fall back to showing all locked
          if (!cancelled) {
            const allLocked: AchievementDisplayItem[] = [];
            for (const definition of achievementRegistry.values()) {
              allLocked.push({ definition, unlocked: false, unlockedAt: null });
            }
            setItems(allLocked);
          }
        }
      } else {
        // Guest/unauthenticated: show all as locked
        const allLocked: AchievementDisplayItem[] = [];
        for (const definition of achievementRegistry.values()) {
          allLocked.push({ definition, unlocked: false, unlockedAt: null });
        }
        if (!cancelled) {
          setItems(allLocked);
        }
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const unlockedCount = items.filter((i) => i.unlocked).length;

  const filteredItems =
    filter === 'all' ? items : items.filter((i) => i.definition.category === filter);

  // Sort: unlocked first, then by category
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    return a.definition.category.localeCompare(b.definition.category);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="font-mono text-xs text-muted-foreground">Loading achievements...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Progress summary */}
      <div className="mb-6 border border-border bg-card p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Progress
          </span>
          <span className="font-mono text-sm text-primary">
            {unlockedCount} / {ACHIEVEMENT_COUNT}
          </span>
        </div>
        <div className="mt-2 h-1 w-full bg-surface-light">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(unlockedCount / ACHIEVEMENT_COUNT) * 100}%` }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div
        className="mb-6 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter achievements"
      >
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Filter:</span>
        {(
          [
            { value: 'all' as FilterCategory, label: 'All' },
            { value: AchievementCategory.Genre, label: 'Genre' },
            { value: AchievementCategory.Technique, label: 'Technique' },
            { value: AchievementCategory.Consistency, label: 'Consistency' },
            { value: AchievementCategory.PersonalRecord, label: 'Records' },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`border px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              filter === option.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={filter === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
        aria-label="Achievements"
      >
        {sortedItems.map((item) => (
          <div
            key={item.definition.achievementId}
            className={`border p-4 transition-colors ${
              item.unlocked ? 'border-primary/20 bg-card' : 'border-border bg-background opacity-50'
            }`}
            role="listitem"
            aria-label={`${item.definition.name}${item.unlocked ? ' - Earned' : ' - Not yet earned'}`}
          >
            {/* Icon */}
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center border font-mono text-lg ${
                item.unlocked
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border bg-surface-light text-muted-foreground'
              }`}
              aria-hidden="true"
            >
              {getIcon(item.definition)}
            </div>

            {/* Content */}
            <h3
              className={`font-mono text-sm ${
                item.unlocked ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {item.definition.name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{item.definition.description}</p>

            {/* Status */}
            <div className="mt-3">
              {item.unlocked && item.unlockedAt ? (
                <span className="text-[10px] uppercase tracking-wider text-primary">
                  Earned {formatUnlockedDate(item.unlockedAt)}
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Not yet earned
                </span>
              )}
            </div>

            {/* Category badge */}
            <div className="mt-2">
              <span
                className={`inline-block border px-2 py-0.5 text-[9px] uppercase tracking-wider ${
                  item.unlocked
                    ? 'border-primary/10 text-primary/60'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {item.definition.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <p className="py-8 text-center text-xs text-muted-foreground">
          No achievements in this category.
        </p>
      )}
    </div>
  );
}
