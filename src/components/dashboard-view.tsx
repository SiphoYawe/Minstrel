'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { useStreak } from '@/features/engagement/use-streak';
import { fetchAchievementDisplay } from '@/features/engagement/achievement-service';
import { achievementRegistry } from '@/features/engagement/achievement-definitions';
import Link from 'next/link';
import { ProgressTrends } from '@/components/progress-trends';
import { SkillRadarChart } from '@/components/skill-radar-chart';
import {
  GrowthZoneStatus,
  type SkillProfile,
  type DifficultyState,
} from '@/features/difficulty/difficulty-types';
import type { AchievementDisplayItem } from '@/features/engagement/engagement-types';

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

const MAX_RECENT_ACHIEVEMENTS = 5;
const MAX_DISPLAYED_GENRES = 5;
const MAX_TOP_ITEMS = 3;

const ZONE_LABELS: Record<GrowthZoneStatus, { label: string; color: string }> = {
  [GrowthZoneStatus.TooEasy]: {
    label: 'Comfort Zone',
    color: 'hsl(var(--muted-foreground))',
  },
  [GrowthZoneStatus.GrowthZone]: {
    label: 'Growth Zone',
    color: 'hsl(var(--accent-success))',
  },
  [GrowthZoneStatus.TooHard]: {
    label: 'Challenge Zone',
    color: 'hsl(var(--accent-warm))',
  },
};

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StatCard({ value, label, mono = true }: { value: string; label: string; mono?: boolean }) {
  return (
    <div className="border border-surface-light bg-card px-4 py-3" aria-label={label}>
      <div className={`text-xl leading-tight text-white ${mono ? 'font-mono' : 'font-sans'}`}>
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function SkillProfileSection({ skillProfile }: { skillProfile: SkillProfile | null }) {
  if (!skillProfile) {
    return (
      <div className="border border-surface-light bg-card px-5 py-8">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Skill Profile
        </p>
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div className="w-8 h-px bg-surface-light" />
          <p className="text-sm text-muted-foreground text-center">
            Play more to build your skill profile
          </p>
          <div className="w-8 h-px bg-surface-light" />
        </div>
      </div>
    );
  }

  return <SkillRadarChart skillProfile={skillProfile} />;
}

function DifficultyCard({ difficultyState }: { difficultyState: DifficultyState | null }) {
  if (!difficultyState) {
    return (
      <div className="border border-surface-light bg-card px-5 py-8">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Difficulty Level
        </p>
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div className="w-8 h-px bg-surface-light" />
          <p className="text-sm text-muted-foreground text-center">
            Start a session to calibrate difficulty
          </p>
          <div className="w-8 h-px bg-surface-light" />
        </div>
      </div>
    );
  }

  const { currentParameters, zoneStatus } = difficultyState;
  const zone = ZONE_LABELS[zoneStatus];

  // Compute an overall difficulty score (0-100) from parameters
  const paramValues = Object.values(currentParameters);
  const avgDifficulty = Math.round(
    (paramValues.reduce((s, v) => s + v, 0) / paramValues.length) * 100
  );
  const clampedDifficulty = Math.max(0, Math.min(100, avgDifficulty));

  return (
    <div className="border border-surface-light bg-card px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Difficulty Level
        </p>
        <span
          className="text-[10px] uppercase tracking-[0.15em] font-mono"
          style={{ color: zone.color }}
        >
          {zone.label}
        </span>
      </div>

      {/* Overall difficulty bar */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-1">
          <span className="font-mono text-2xl text-white leading-none">{clampedDifficulty}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
        <div className="h-1.5 w-full bg-surface-light">
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${clampedDifficulty}%`,
              backgroundColor: zone.color,
            }}
          />
        </div>
      </div>

      {/* Parameter breakdown */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {Object.entries(currentParameters).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <span className="font-mono text-[11px] text-white">
              {typeof value === 'number'
                ? value < 10
                  ? value.toFixed(2)
                  : Math.round(value)
                : '\u2014'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentAchievements({
  achievements,
  isLoading,
}: {
  achievements: AchievementDisplayItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="border border-surface-light bg-card px-5 py-8">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Recent Achievements
        </p>
        <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
      </div>
    );
  }

  const unlocked = achievements
    .filter((a) => a.unlocked && a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, MAX_RECENT_ACHIEVEMENTS);

  return (
    <div className="border border-surface-light bg-card px-5 py-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
        Recent Achievements
      </p>
      {unlocked.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div className="w-8 h-px bg-surface-light" />
          <p className="text-sm text-muted-foreground text-center">
            No achievements yet. Keep practicing.
          </p>
          <div className="w-8 h-px bg-surface-light" />
        </div>
      ) : (
        <div className="space-y-3">
          {unlocked.map((item) => {
            const icon = ICON_MAP[item.definition.icon] ?? '\u2605';
            const date = new Date(item.unlockedAt!);
            const dateStr = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={item.definition.achievementId} className="flex items-center gap-3 py-1.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary font-mono text-sm"
                  role="img"
                  aria-hidden="true"
                >
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white truncate">{item.definition.name}</p>
                  <p className="text-[10px] text-muted-foreground">{dateStr}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlayingStyleCard() {
  const playingTendencies = useSessionStore((s) => s.playingTendencies);
  const detectedGenres = useSessionStore((s) => s.detectedGenres);

  const hasData = playingTendencies || detectedGenres.length > 0;

  return (
    <div className="border border-surface-light bg-card px-5 py-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
        Playing Style
      </p>
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div className="w-8 h-px bg-surface-light" />
          <p className="text-sm text-muted-foreground text-center">
            Play a session to discover your style
          </p>
          <div className="w-8 h-px bg-surface-light" />
        </div>
      ) : (
        <div className="space-y-3">
          {detectedGenres.length > 0 && (
            <div>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Detected Genres
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {detectedGenres.slice(0, MAX_DISPLAYED_GENRES).map((genre) => (
                  <span
                    key={genre.genre}
                    className="border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary"
                  >
                    {genre.genre}
                  </span>
                ))}
              </div>
            </div>
          )}
          {playingTendencies && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Tendencies
              </span>
              <div className="space-y-2">
                {/* Top keys */}
                {Object.keys(playingTendencies.keyDistribution).length > 0 && (
                  <div>
                    <span className="text-[10px] text-muted-foreground">Preferred Keys</span>
                    <p className="font-mono text-xs text-white">
                      {Object.entries(playingTendencies.keyDistribution)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, MAX_TOP_ITEMS)
                        .map(([key]) => key)
                        .join(', ')}
                    </p>
                  </div>
                )}
                {/* Top chord types */}
                {Object.keys(playingTendencies.chordTypeDistribution).length > 0 && (
                  <div>
                    <span className="text-[10px] text-muted-foreground">Common Chords</span>
                    <p className="font-mono text-xs text-white">
                      {Object.entries(playingTendencies.chordTypeDistribution)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, MAX_TOP_ITEMS)
                        .map(([type]) => type)
                        .join(', ')}
                    </p>
                  </div>
                )}
                {/* Rhythm profile */}
                {playingTendencies.rhythmProfile && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Swing Ratio</span>
                      <p className="font-mono text-xs text-white">
                        {playingTendencies.rhythmProfile.swingRatio.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Note Density</span>
                      <p className="font-mono text-xs text-white">
                        {playingTendencies.rhythmProfile.averageDensity.toFixed(1)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DashboardView() {
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { streak, loading: streakLoading } = useStreak();
  const skillProfile = useSessionStore((s) => s.skillProfile);
  const difficultyState = useSessionStore((s) => s.difficultyState);

  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  const [achievementItems, setAchievementItems] = useState<AchievementDisplayItem[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAchievements() {
      if (isAuthenticated && user?.id) {
        try {
          const items = await fetchAchievementDisplay(user.id);
          if (!cancelled) setAchievementItems(items);
        } catch {
          if (!cancelled) {
            const allLocked: AchievementDisplayItem[] = [];
            for (const def of achievementRegistry.values()) {
              allLocked.push({ definition: def, unlocked: false, unlockedAt: null });
            }
            setAchievementItems(allLocked);
          }
        }
      } else {
        const allLocked: AchievementDisplayItem[] = [];
        for (const def of achievementRegistry.values()) {
          allLocked.push({ definition: def, unlocked: false, unlockedAt: null });
        }
        if (!cancelled) setAchievementItems(allLocked);
      }
      if (!cancelled) setAchievementsLoading(false);
    }

    loadAchievements();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const isLoading = statsLoading || streakLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
        <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground/60">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Section: Session Stats Summary */}
      <section>
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
          Session Stats
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-surface-light">
          <StatCard
            value={stats ? formatDuration(stats.totalPracticeMs) : '0m'}
            label="Total Practice"
          />
          <StatCard value={stats ? String(stats.totalSessions) : '0'} label="Sessions" />
          <StatCard
            value={stats ? formatNumber(stats.totalNotesPlayed) : '0'}
            label="Notes Played"
          />
          <StatCard
            value={streak.currentStreak > 0 ? `Day ${streak.currentStreak}` : '--'}
            label="Current Streak"
            mono={false}
          />
          <StatCard
            value={
              stats && stats.averageSessionMs > 0 ? formatDuration(stats.averageSessionMs) : '--'
            }
            label="Avg Session"
          />
        </div>
      </section>

      {/* Section: Warm-Up */}
      <section>
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
          Warm-Up
        </p>
        <div className="border border-surface-light bg-card px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Quick Warm-Up</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats && stats.totalSessions > 0
                  ? 'Loosen up before your session'
                  : 'Start with a basic warm-up to calibrate your skill profile'}
              </p>
            </div>
            <Link
              href="/session"
              className="h-8 px-4 inline-flex items-center bg-primary text-background hover:brightness-90 font-mono text-xs uppercase tracking-wider"
            >
              Start
            </Link>
          </div>
        </div>
      </section>

      {/* Section: Skill Profile + Difficulty Level */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkillProfileSection skillProfile={skillProfile} />
        <DifficultyCard difficultyState={difficultyState} />
      </section>

      {/* Section: Improvement Trends */}
      <section>
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
          Improvement Trends
        </p>
        <ProgressTrends />
      </section>

      {/* Section: Recent Achievements + Playing Style */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RecentAchievements achievements={achievementItems} isLoading={achievementsLoading} />
        <PlayingStyleCard />
      </section>
    </div>
  );
}
