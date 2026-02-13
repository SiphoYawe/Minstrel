'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { db, type GuestSession, type StoredMidiEvent } from '@/lib/dexie/db';

const PAGE_SIZE = 20;

type SortMode = 'recent' | 'longest' | 'best-accuracy';

interface SessionWithStats extends GuestSession {
  noteCount: number;
  averageAccuracy: number | null;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Complete';
    case 'recording':
      return 'Active';
    default:
      return 'Abandoned';
  }
}

function getStatusClasses(status: string): string {
  switch (status) {
    case 'completed':
      return 'border-accent-success/20 bg-accent-success/5 text-accent-success';
    case 'recording':
      return 'border-accent-warm/20 bg-accent-warm/5 text-accent-warm';
    default:
      return 'border-border bg-card text-muted-foreground';
  }
}

export function SessionHistoryList() {
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(!!db);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const hasMore = sessions.length < totalCount;

  const loadPage = useCallback(async (offset: number, append: boolean) => {
    if (!db) return;

    try {
      const allSorted = await db.sessions.orderBy('startedAt').reverse().toArray();

      if (!append) {
        setTotalCount(allSorted.length);
      }

      const page = allSorted.slice(offset, offset + PAGE_SIZE);

      const pageWithStats: SessionWithStats[] = await Promise.all(
        page.map(async (session) => {
          const sessionId = session.id!;
          const events: StoredMidiEvent[] = await db.midiEvents
            .where('sessionId')
            .equals(sessionId)
            .toArray();

          const noteCount = events.filter((e) => e.type === 'note-on').length;

          return {
            ...session,
            noteCount,
            averageAccuracy: null,
          };
        })
      );

      if (append) {
        setSessions((prev) => [...prev, ...pageWithStats]);
      } else {
        setSessions(pageWithStats);
      }
    } catch {
      // Silently handle — loading state cleared below
    }
  }, []);

  useEffect(() => {
    if (!db) return;

    let cancelled = false;

    async function initialLoad() {
      await loadPage(0, false);
      if (!cancelled) {
        setIsLoading(false);
      }
    }

    initialLoad();

    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    await loadPage(sessions.length, true);
    setIsLoadingMore(false);
  }, [loadPage, sessions.length]);

  const sortedSessions = useMemo(() => {
    const copy = [...sessions];
    switch (sortMode) {
      case 'recent':
        return copy.sort((a, b) => b.startedAt - a.startedAt);
      case 'longest':
        return copy.sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
      case 'best-accuracy':
        return copy.sort((a, b) => b.noteCount - a.noteCount);
      default:
        return copy;
    }
  }, [sessions, sortMode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="font-mono text-xs text-muted-foreground">Loading sessions...</span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 flex h-12 w-12 items-center justify-center border border-border bg-card">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-muted-foreground"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <p className="font-mono text-sm text-foreground">No sessions yet</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Start practicing to see your session history here.
        </p>
        <Link
          href="/session"
          className="mt-4 border border-border bg-card px-4 py-2 font-mono text-xs uppercase tracking-wider text-foreground transition-colors hover:bg-surface-light"
        >
          Start Practicing
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="mb-6 flex items-center gap-2" role="group" aria-label="Sort sessions">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sort:</span>
        {(
          [
            { value: 'recent', label: 'Most Recent' },
            { value: 'longest', label: 'Longest' },
            { value: 'best-accuracy', label: 'Most Notes' },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            onClick={() => setSortMode(option.value)}
            className={`border px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              sortMode === option.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={sortMode === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Session cards */}
      <div className="flex flex-col gap-3" role="list" aria-label="Practice sessions">
        {sortedSessions.map((session) => (
          <Link
            key={session.id}
            href={`/session?replay=${session.id}`}
            className="group block border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-surface-light"
            role="listitem"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-sm text-foreground">{formatDate(session.startedAt)}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatTime(session.startedAt)}
                </p>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Replay
              </span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-3">
              {/* Duration */}
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Duration
                </span>
                <span className="mt-0.5 block font-mono text-sm text-foreground">
                  {session.duration ? formatDuration(session.duration) : '--'}
                </span>
              </div>

              {/* Key */}
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Key
                </span>
                <span className="mt-0.5 block font-mono text-sm text-foreground">
                  {session.key ?? '--'}
                </span>
              </div>

              {/* Tempo */}
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Tempo
                </span>
                <span className="mt-0.5 block font-mono text-sm text-foreground">
                  {session.tempo ? `${Math.round(session.tempo)}` : '--'}
                  {session.tempo && <span className="text-[10px] text-muted-foreground"> BPM</span>}
                </span>
              </div>

              {/* Notes */}
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Notes
                </span>
                <span className="mt-0.5 block font-mono text-sm text-foreground">
                  {session.noteCount}
                </span>
              </div>
            </div>

            {/* Input source + status badges */}
            <div className="mt-3 flex items-center gap-2">
              <span className="border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {session.inputSource === 'midi' ? 'MIDI' : 'Audio'}
              </span>
              <span
                className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${getStatusClasses(session.status)}`}
              >
                {getStatusLabel(session.status)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="border border-border bg-card px-6 py-2 font-mono text-xs uppercase tracking-wider text-foreground transition-colors hover:bg-surface-light disabled:opacity-50"
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Count */}
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        {sessions.length} of {totalCount} session{totalCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
