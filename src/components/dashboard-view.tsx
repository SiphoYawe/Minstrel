'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { useStreak } from '@/features/engagement/use-streak';
import { useXp } from '@/features/engagement/use-xp';
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
  Play as PlayIcon,
  TrendingUp,
  CircleDot,
  Puzzle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
  sessions: PlayIcon,
  speed: TrendingUp,
  accuracy: CircleDot,
  complexity: Puzzle,
};

const MAX_RECENT_ACHIEVEMENTS = 5;
const MAX_DISPLAYED_GENRES = 5;
const MAX_TOP_ITEMS = 3;

/** Collapsible section wrapper for below-fold dashboard content */
function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  hasData,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  hasData: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!hasData) return null;

  return (
    <section>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between py-2 mb-3 group"
      >
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{title}</p>
        <span
          className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground transition-colors"
          aria-hidden="true"
        >
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && children}
    </section>
  );
}

const DIFFICULTY_PARAM_LABELS: Record<string, string> = {
  tempo: 'Tempo',
  harmonicComplexity: 'Harmonic Complexity',
  keyDifficulty: 'Key Difficulty',
  rhythmicDensity: 'Rhythmic Density',
  noteRange: 'Note Range',
  tempoVariability: 'Tempo Variation',
};

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
            <span className="text-[10px] text-muted-foreground">
              {DIFFICULTY_PARAM_LABELS[key] ?? key}
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
            const IconComponent = ICON_MAP[item.definition.icon] ?? Star;
            const date = new Date(item.unlockedAt!);
            const dateStr = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={item.definition.achievementId} className="flex items-center gap-3 py-1.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary"
                  aria-hidden="true"
                >
                  <IconComponent className="w-4 h-4" strokeWidth={1.5} />
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
  const { lifetimeXp, isLoading: xpLoading } = useXp();
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

  const isLoading = statsLoading || streakLoading || xpLoading;

  // XP level calculation (100 XP per level)
  const xpPerLevel = 100;
  const currentLevel = Math.floor(lifetimeXp / xpPerLevel) + 1;
  const xpInLevel = lifetimeXp % xpPerLevel;
  const xpProgress = Math.round((xpInLevel / xpPerLevel) * 100);

  const unlockedCount = achievementItems.filter((a) => a.unlocked).length;

  const hasSessionData = !!(stats && stats.totalSessions > 0);
  const hasSkillData = !!skillProfile;
  const hasDifficultyData = !!difficultyState;
  const hasAchievementData = achievementItems.some((a) => a.unlocked);

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
      {/* Hero Metrics: max 4 key cards (always visible) */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Streak */}
          <Link
            href="/achievements"
            className="border border-surface-light bg-card px-4 py-3 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays
                className={`w-4 h-4 ${
                  streak.currentStreak > 0 ? 'text-accent-success' : 'text-muted-foreground'
                }`}
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className="font-mono text-lg text-white">
                {streak.currentStreak > 0 ? `${streak.currentStreak}` : '0'}
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {streak.currentStreak > 0 ? 'Day streak' : 'Ready for today\u2019s session?'}
            </p>
          </Link>

          {/* XP Level */}
          <Link
            href="/achievements"
            className="border border-surface-light bg-card px-4 py-3 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-primary" strokeWidth={1.5} aria-hidden="true" />
              <span className="font-mono text-lg text-white">Lvl {currentLevel}</span>
            </div>
            <div className="h-1 w-full bg-surface-light mt-1">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
              {lifetimeXp} XP
            </p>
          </Link>

          {/* Session count or AI suggestion */}
          {hasSessionData ? (
            <div className="border border-surface-light bg-card px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <span className="font-mono text-lg text-white">{stats!.totalSessions}</span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Sessions
              </p>
            </div>
          ) : (
            <Link
              href="/session"
              className="border border-surface-light bg-card px-4 py-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <PlayIcon className="w-4 h-4 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <span className="font-mono text-lg text-white">Go</span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Start your first session
              </p>
            </Link>
          )}

          {/* Achievements */}
          <Link
            href="/achievements"
            className="border border-surface-light bg-card px-4 py-3 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell
                className={`w-4 h-4 ${unlockedCount > 0 ? 'text-accent-success' : 'text-muted-foreground'}`}
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className="font-mono text-lg text-white">{unlockedCount}</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {unlockedCount > 0 ? 'Achievements' : 'First one is a session away'}
            </p>
          </Link>
        </div>
      </section>

      {/* Warm-Up CTA (always visible) */}
      <section>
        <div className="border border-surface-light bg-card px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Quick Warm-Up</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasSessionData
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

      {/* Collapsible: Session Stats (only if has data) */}
      <CollapsibleSection title="Session Stats" hasData={hasSessionData} defaultOpen={true}>
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
      </CollapsibleSection>

      {/* Collapsible: Skill Profile + Difficulty Level */}
      <CollapsibleSection
        title="Skill & Difficulty"
        hasData={hasSkillData || hasDifficultyData}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkillProfileSection skillProfile={skillProfile} />
          <DifficultyCard difficultyState={difficultyState} />
        </div>
      </CollapsibleSection>

      {/* Collapsible: Improvement Trends */}
      <CollapsibleSection title="Improvement Trends" hasData={hasSessionData}>
        <ProgressTrends />
      </CollapsibleSection>

      {/* Collapsible: Achievements + Playing Style */}
      <CollapsibleSection
        title="Achievements & Style"
        hasData={hasAchievementData || hasSessionData}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RecentAchievements achievements={achievementItems} isLoading={achievementsLoading} />
          <PlayingStyleCard />
        </div>
      </CollapsibleSection>
    </div>
  );
}
