'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db, type GuestSession, type StoredMidiEvent } from '@/lib/dexie/db';

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

export function SessionHistoryList() {
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(!!db);
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  useEffect(() => {
    if (!db) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const allSessions = await db.sessions.orderBy('startedAt').reverse().toArray();

        // For each session, count MIDI events
        const sessionsWithStats: SessionWithStats[] = await Promise.all(
          allSessions.map(async (session) => {
            const sessionId = session.id!;
            const events: StoredMidiEvent[] = await db.midiEvents
              .where('sessionId')
              .equals(sessionId)
              .toArray();

            const noteOnEvents = events.filter((e) => e.type === 'note-on');
            const noteCount = noteOnEvents.length;

            return {
              ...session,
              noteCount,
              averageAccuracy: null, // Timing accuracy per-session is not stored in Dexie
            };
          })
        );

        if (!cancelled) {
          setSessions(sessionsWithStats);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const sortedSessions = useMemo(() => {
    const copy = [...sessions];
    switch (sortMode) {
      case 'recent':
        return copy.sort((a, b) => b.startedAt - a.startedAt);
      case 'longest':
        return copy.sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
      case 'best-accuracy':
        // Sort by note count as proxy since accuracy is session-level
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

            <div className="mt-3 grid grid-cols-3 gap-3">
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

            {/* Input source badge */}
            <div className="mt-3 flex items-center gap-2">
              <span className="border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {session.inputSource === 'midi' ? 'MIDI' : 'Audio'}
              </span>
              {session.status === 'completed' && (
                <span className="border border-accent-success/20 bg-accent-success/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent-success">
                  Complete
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Count */}
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        {sessions.length} session{sessions.length !== 1 ? 's' : ''} total
      </p>
    </div>
  );
}
