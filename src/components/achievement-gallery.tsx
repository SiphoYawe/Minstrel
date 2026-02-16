'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import {
  Music,
  Guitar,
  Star,
  Disc,
  Zap,
  Crosshair,
  Waves,
  Target,
  ListMusic,
  Dumbbell,
  CalendarDays,
  Award,
  Play,
  TrendingUp,
  CircleDot,
  Puzzle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type FilterCategory = 'all' | AchievementCategory;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Genre: Music,
  Technique: Crosshair,
  Consistency: CalendarDays,
  PersonalRecord: TrendingUp,
};

const ICON_MAP: Record<string, LucideIcon> = {
  jazz: Music,
  blues: Guitar,
  pop: Star,
  classical: Disc,
  rock: Zap,
  precision: Crosshair,
  smooth: Waves,
  target: Target,
  notes: ListMusic,
  drill: Dumbbell,
  calendar: CalendarDays,
  xp: Award,
  sessions: Play,
  speed: TrendingUp,
  accuracy: CircleDot,
  complexity: Puzzle,
};

function getIcon(definition: AchievementDisplayItem['definition']): LucideIcon {
  return ICON_MAP[definition.icon] ?? CATEGORY_ICONS[definition.category] ?? Star;
}

function formatUnlockedDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const PAGE_SIZE = 24;

export function AchievementGallery() {
  const [items, setItems] = useState<AchievementDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
          if (!cancelled) {
            const allLocked: AchievementDisplayItem[] = [];
            for (const definition of achievementRegistry.values()) {
              allLocked.push({ definition, unlocked: false, unlockedAt: null });
            }
            setItems(allLocked);
          }
        }
      } else {
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

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    return a.definition.category.localeCompare(b.definition.category);
  });

  const paginatedItems = sortedItems.slice(0, visibleCount);
  const hasMore = visibleCount < sortedItems.length;

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
            onClick={() => {
              setFilter(option.value);
              setVisibleCount(PAGE_SIZE);
            }}
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
        {paginatedItems.map((item) => {
          const Icon = getIcon(item.definition);
          return (
            <div
              key={item.definition.achievementId}
              className={`border p-4 transition-colors ${
                item.unlocked
                  ? 'border-primary/20 bg-card'
                  : 'border-border bg-background opacity-50'
              }`}
              role="listitem"
              aria-label={`${item.definition.name}${item.unlocked ? ' - Earned' : ' - Not yet earned'}`}
            >
              {/* Icon */}
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center border ${
                  item.unlocked
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-surface-light text-muted-foreground'
                }`}
                aria-hidden="true"
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
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
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="border border-border bg-card px-6 py-2 font-mono text-xs uppercase tracking-wider text-foreground transition-colors hover:bg-surface-light"
          >
            Show More
          </button>
        </div>
      )}

      {sortedItems.length > 0 && (
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          {paginatedItems.length} of {sortedItems.length} achievement
          {sortedItems.length !== 1 ? 's' : ''}
        </p>
      )}

      {filteredItems.length === 0 && unlockedCount === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-8 h-px bg-primary/30 mb-6" aria-hidden="true" />
          <div className="mb-4 grid grid-cols-4 gap-2 opacity-40">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex h-10 w-10 items-center justify-center border border-border bg-surface-light"
              >
                <Star className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              </div>
            ))}
          </div>
          <p className="font-mono text-sm text-foreground tracking-wide">
            Your first achievement is just a session away
          </p>
          <p className="mt-2 max-w-xs text-xs text-muted-foreground leading-relaxed">
            Play, practice, and explore — badges unlock as you progress.
          </p>
          <Link
            href="/session"
            className="mt-5 border border-primary bg-primary/10 px-5 py-2 font-mono text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
          >
            Start Playing
          </Link>
          <div className="w-8 h-px bg-primary/30 mt-6" aria-hidden="true" />
        </div>
      )}
      {filteredItems.length === 0 && unlockedCount > 0 && (
        <p className="py-8 text-center text-xs text-muted-foreground">
          No achievements in this category.
        </p>
      )}
    </div>
  );
}
