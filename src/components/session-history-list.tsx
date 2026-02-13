'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { db, type GuestSession, type StoredMidiEvent } from '@/lib/dexie/db';
import { EmptyState } from '@/components/empty-state';
import { MockVisualization } from '@/components/illustrations/mock-visualization';

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteSession = useCallback(async () => {
    if (!db || confirmDeleteId == null) return;
    setIsDeleting(true);
    try {
      await db.transaction('rw', db.sessions, db.midiEvents, db.analysisSnapshots, async () => {
        await db.midiEvents.where('sessionId').equals(confirmDeleteId).delete();
        await db.analysisSnapshots.where('sessionId').equals(confirmDeleteId).delete();
        await db.sessions.delete(confirmDeleteId);
      });
      setSessions((prev) => prev.filter((s) => s.id !== confirmDeleteId));
      setTotalCount((prev) => prev - 1);
    } catch {
      // Silently handle — session may already be deleted
    } finally {
      setIsDeleting(false);
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId]);

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
      <EmptyState
        illustration={<MockVisualization className="text-foreground" />}
        title="Play your first note to see your music come alive"
        description="Your session history will appear here — every phrase, every chord, mapped out and ready to review."
        ctaText="Start Playing"
        ctaHref="/session"
      />
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
          <div key={session.id} className="group relative" role="listitem">
            {/* Card link — covers the entire card */}
            <Link
              href={`/session?replay=${session.id}`}
              className="block border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-surface-light"
              aria-label={`Replay session from ${formatDate(session.startedAt)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-sm text-foreground">
                    {formatDate(session.startedAt)}
                  </p>
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
                    {session.tempo && (
                      <span className="text-[10px] text-muted-foreground"> BPM</span>
                    )}
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

            {/* Delete button — floats above the link */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteId(session.id!);
              }}
              className="absolute top-3 right-3 z-10 p-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:!opacity-100 focus-visible:opacity-100"
              aria-label={`Delete session from ${formatDate(session.startedAt)}`}
            >
              <Trash2
                className="h-3.5 w-3.5 text-muted-foreground transition-colors duration-150 hover:text-red-400"
                strokeWidth={1.5}
              />
            </button>
          </div>
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

      {/* Delete confirmation overlay */}
      {confirmDeleteId != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => !isDeleting && setConfirmDeleteId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm session deletion"
        >
          <div
            className="w-full max-w-[320px] border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-sm text-foreground">Delete this session?</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              This will permanently remove the session and all its data. This cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
                className="px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={isDeleting}
                className="border border-red-500/30 bg-red-500/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-red-400 transition-colors hover:border-red-500/50 hover:bg-red-500/20 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
