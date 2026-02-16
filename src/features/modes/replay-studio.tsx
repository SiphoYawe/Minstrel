'use client';

import { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import Link from 'next/link';
import { ChevronUp, Settings } from 'lucide-react';
import { VisualizationCanvas } from '@/components/viz/visualization-canvas';
import { StatusBar } from '@/components/status-bar';
import { TimelineScrubber } from '@/components/timeline-scrubber';
import type { TimelineMarker } from '@/components/timeline-scrubber';
import { useReplaySession } from '@/features/session/use-replay-session';
import { useSessionStore } from '@/stores/session-store';
import { useReplayChat } from '@/features/coaching/use-replay-chat';
import { togglePlayback, setPlaybackSpeed, seekTo } from '@/features/session/replay-engine';
import type { AnalysisSnapshot, StoredDrillRecord } from '@/lib/dexie/db';

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatPositionMmSs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// --- Tab type ---

type TabId = 'insights' | 'sessions' | 'chat';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'insights', label: 'Insights' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'chat', label: 'Chat' },
];

// --- Main Component ---

interface ReplayStudioProps {
  sessionId: number | null;
}

export function ReplayStudio({ sessionId }: ReplayStudioProps) {
  useReplaySession(sessionId);

  const replaySession = useSessionStore((s) => s.replaySession);
  const replayEvents = useSessionStore((s) => s.replayEvents);
  const replayStatus = useSessionStore((s) => s.replayStatus);
  const replayPosition = useSessionStore((s) => s.replayPosition);
  const replayState = useSessionStore((s) => s.replayState);
  const replaySpeed = useSessionStore((s) => s.replaySpeed);
  const setReplayPosition = useSessionStore((s) => s.setReplayPosition);

  const [activeTab, setActiveTab] = useState<TabId>('insights');

  const totalDurationMs = useMemo(() => {
    if (!replaySession) return 0;
    if (replaySession.duration) return replaySession.duration * 1000;
    if (replaySession.endedAt && replaySession.startedAt) {
      return replaySession.endedAt - replaySession.startedAt;
    }
    return 0;
  }, [replaySession]);

  const noteCount = replayEvents.filter((e) => e.type === 'note-on').length;

  // --- Load analysis snapshots and drill records for timeline markers ---
  const [snapshots, setSnapshots] = useState<AnalysisSnapshot[]>([]);
  const [drillRecords, setDrillRecords] = useState<StoredDrillRecord[]>([]);

  useEffect(() => {
    if (!replaySession?.id) {
      setSnapshots([]);
      setDrillRecords([]);
      return;
    }

    const sessionId = replaySession.id;

    import('@/lib/dexie/db')
      .then(({ db }) => {
        if (!db) return;

        // Load analysis snapshots for this session
        db.analysisSnapshots
          .where('sessionId')
          .equals(sessionId)
          .sortBy('createdAt')
          .then((snaps) => setSnapshots(snaps))
          .catch(() => setSnapshots([]));

        // Load drill records for this session (sessionId stored as string)
        db.drillRecords
          .where('sessionId')
          .equals(String(sessionId))
          .toArray()
          .then((drills) => setDrillRecords(drills))
          .catch(() => setDrillRecords([]));
      })
      .catch(() => {
        setSnapshots([]);
        setDrillRecords([]);
      });
  }, [replaySession?.id]);

  // --- Build timeline markers from loaded data ---
  const markers = useMemo<TimelineMarker[]>(() => {
    if (!replaySession) return [];

    const sessionStart = replaySession.startedAt;
    const result: TimelineMarker[] = [];

    // Snapshot markers
    for (const snap of snapshots) {
      const relativeTs = snap.createdAt - sessionStart;
      if (relativeTs < 0) continue;

      // Extract summary from snapshot data
      const data = snap.data as Record<string, unknown>;
      const key = (data.key as string) ?? '';
      const tempo = data.tempo as number | undefined;
      const summary = key
        ? `Snapshot: ${key}${tempo ? ` @ ${Math.round(tempo)} BPM` : ''}`
        : 'Analysis snapshot';

      result.push({
        timestamp: relativeTs,
        type: 'snapshot',
        summary,
      });
    }

    // Drill markers
    for (const drill of drillRecords) {
      const createdAtMs = new Date(drill.createdAt).getTime();
      const relativeTs = createdAtMs - sessionStart;
      if (relativeTs < 0) continue;

      result.push({
        timestamp: relativeTs,
        type: 'drill',
        summary: `Drill: ${drill.targetSkill || drill.weaknessDescription || 'Practice exercise'}`,
      });
    }

    // Sort by timestamp
    result.sort((a, b) => a.timestamp - b.timestamp);

    return result;
  }, [replaySession, snapshots, drillRecords]);

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      let nextIndex: number | null = null;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % TABS.length;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = TABS.length - 1;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Activate current tab (already active via roving tabindex focus)
        return;
      }

      if (nextIndex !== null) {
        const nextTab = TABS[nextIndex];
        setActiveTab(nextTab.id);
        // Move focus to the newly active tab
        const tabEl = document.getElementById(`tab-${nextTab.id}`);
        tabEl?.focus();
      }
    },
    [activeTab]
  );

  // --- Loading state ---
  if (replayStatus === 'loading') {
    return (
      <div className="relative h-dvh w-full bg-background">
        <StatusBar />
        <div className="flex h-full pt-10 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div
              className="h-1 w-48 bg-card overflow-hidden"
              role="progressbar"
              aria-label="Loading session"
            >
              <div className="h-full w-1/3 bg-primary animate-[shimmer_1.2s_ease-in-out_infinite]" />
            </div>
            <p className="font-mono text-xs tracking-widest uppercase text-primary/60">
              Loading session...
            </p>
            <span className="sr-only" aria-live="assertive">
              Loading replay data
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (replayStatus === 'error') {
    return (
      <div className="relative h-dvh w-full bg-background">
        <StatusBar />
        <div className="flex h-full pt-10 items-center justify-center">
          <div className="max-w-md px-6 text-center">
            <div className="mb-4 font-mono text-lg text-accent-warm" aria-live="polite">
              No sessions to replay
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Play a session first, then come back here to review your playing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Success state: two-column layout with scrubber in left column (Story 13.4) ---
  return (
    <div className="relative h-dvh w-full bg-background">
      <StatusBar />

      {/* Main grid: canvas+scrubber column + detail panel */}
      <div className="flex flex-col h-full pt-10">
        {/* Upper region: canvas + right panel */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[2fr_1fr] transition-all duration-300 overflow-y-auto lg:overflow-hidden">
          {/* Left column: canvas + timeline scrubber (Story 13.4) */}
          <div className="flex flex-col min-w-0 min-h-[400px] lg:min-h-0 h-full">
            <div className="flex-1 min-h-0">
              <VisualizationCanvas />
            </div>
            {/* Timeline scrubber — contained within canvas column */}
            <TimelineScrubber
              position={replayPosition}
              totalDuration={totalDurationMs}
              playbackState={replayState}
              speed={replaySpeed}
              markers={markers}
              onPositionChange={setReplayPosition}
              onPlayPause={togglePlayback}
              onSpeedChange={setPlaybackSpeed}
              onRestart={() => seekTo(0)}
            />
          </div>

          {/* Right detail panel (Story 13.4: min-w-[320px], visual separator) */}
          <div className="relative flex flex-col h-full border-l border-border min-w-0 lg:min-w-[320px] bg-background">
            {/* Tab bar */}
            <div
              className="flex shrink-0 border-b border-border"
              role="tablist"
              aria-label="Replay details"
            >
              {TABS.map((tab) => (
                /* Raw <button> retained: role="tab" + aria-selected semantics conflict with Button component */
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={handleTabKeyDown}
                  className={`
                    relative flex-1 px-4 py-3
                    text-xs uppercase tracking-[0.12em] font-medium
                    transition-colors duration-200
                    ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground/60'}
                  `}
                >
                  {tab.label}
                  {/* Active underline */}
                  {activeTab === tab.id && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-px bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {/* Insights panel */}
              <div
                role="tabpanel"
                id="panel-insights"
                aria-labelledby="tab-insights"
                hidden={activeTab !== 'insights'}
                className="h-full overflow-y-auto"
              >
                {activeTab === 'insights' && (
                  <InsightsPanel session={replaySession} eventCount={noteCount} />
                )}
              </div>

              {/* Sessions panel */}
              <div
                role="tabpanel"
                id="panel-sessions"
                aria-labelledby="tab-sessions"
                hidden={activeTab !== 'sessions'}
                className="h-full overflow-y-auto"
              >
                {activeTab === 'sessions' && <SessionsListPanel />}
              </div>

              {/* Chat panel */}
              <div
                role="tabpanel"
                id="panel-chat"
                aria-labelledby="tab-chat"
                hidden={activeTab !== 'chat'}
                className="h-full"
              >
                {activeTab === 'chat' && <ChatPanel />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Insights Panel ---

const InsightsPanel = memo(function InsightsPanel({
  session,
  eventCount,
}: {
  session: ReturnType<typeof useSessionStore.getState>['replaySession'];
  eventCount: number;
}) {
  if (!session) return null;

  const metrics = [
    {
      label: 'Date',
      value: formatDate(session.startedAt),
      mono: false,
    },
    {
      label: 'Duration',
      value: formatDuration(session.duration),
      mono: true,
    },
    {
      label: 'Key',
      value: session.key ?? '--',
      mono: false,
    },
    {
      label: 'Tempo',
      value: session.tempo ? `${Math.round(session.tempo)}` : '--',
      mono: true,
      unit: 'BPM',
    },
    {
      label: 'Notes',
      value: String(eventCount),
      mono: true,
    },
    {
      label: 'Type',
      value: session.sessionType ?? 'freeform',
      mono: false,
    },
  ];

  return (
    <div className="p-3" role="region" aria-label="Session insights">
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-surface-light border border-border p-3">
            <span className="block text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">
              {metric.label}
            </span>
            <span
              className={`block text-sm text-foreground truncate ${metric.mono ? 'font-mono' : ''}`}
            >
              {metric.value}
              {metric.unit && (
                <span className="text-[10px] text-muted-foreground ml-1">{metric.unit}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// --- Chat Panel ---

const ChatPanel = memo(function ChatPanel() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error: chatError,
    hasApiKey,
    currentTimestamp,
  } = useReplayChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle Enter key in textarea
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // --- No API key: graceful degradation ---
  if (!hasApiKey) {
    return (
      <div className="flex flex-col h-full" role="region" aria-label="Replay chat">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-[220px]">
            <div
              className="inline-flex w-8 h-8 mb-3 border border-border bg-surface-light
                items-center justify-center text-muted-foreground"
              aria-hidden="true"
            >
              <Settings className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Connect your API key in Settings to ask questions about your playing.
            </p>
            <Link
              href="/settings"
              className="inline-block text-[11px] font-mono uppercase tracking-[0.1em]
                text-primary hover:text-white
                border border-primary/20 hover:border-primary/50
                px-3 py-1.5 transition-colors duration-150"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" role="region" aria-label="Replay chat">
      {/* Message area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[11px] text-muted-foreground font-mono text-center leading-relaxed max-w-[200px]">
              Ask about what happened at any moment in your session
            </p>
          </div>
        )}

        {messages.map((message) => {
          const textContent = message.parts
            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join('');

          if (!textContent) return null;

          const isUser = message.role === 'user';

          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`
                  max-w-[85%] px-3 py-2 text-xs leading-relaxed
                  ${
                    isUser
                      ? 'bg-card text-foreground border border-border'
                      : 'bg-surface-light text-muted-foreground border border-border'
                  }
                `}
              >
                {textContent}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface-light border border-border px-3 py-2 flex items-center gap-1">
              <span
                className="block w-1 h-1 bg-primary/60 animate-[pulse-dot_1.4s_ease-in-out_infinite]"
                aria-hidden="true"
              />
              <span
                className="block w-1 h-1 bg-primary/60 animate-[pulse-dot_1.4s_ease-in-out_0.2s_infinite]"
                style={{ animationDelay: '0.2s' }}
                aria-hidden="true"
              />
              <span
                className="block w-1 h-1 bg-primary/60 animate-[pulse-dot_1.4s_ease-in-out_0.4s_infinite]"
                style={{ animationDelay: '0.4s' }}
                aria-hidden="true"
              />
              <span className="sr-only">AI is responding</span>
            </div>
          </div>
        )}

        {/* Error display */}
        {chatError && (
          <div className="px-3 py-2 bg-surface-light border border-accent-warm/20 text-[11px] text-accent-warm">
            {chatError.message}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-background">
        {/* Timestamp context indicator */}
        <div className="px-3 pt-2 pb-1">
          <span className="font-mono text-[10px] text-muted-foreground tracking-wide">
            Asking about moment at{' '}
            <span className="text-primary/70">{formatPositionMmSs(currentTimestamp)}</span>
          </span>
        </div>

        {/* Input + send */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2 px-3 pb-3">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="What happened here?"
            rows={1}
            aria-label="Ask about this moment"
            className="flex-1 resize-none bg-surface-light border border-border
              text-xs text-foreground placeholder:text-muted-foreground
              px-3 py-2 font-mono
              focus:outline-none focus:border-primary/30
              transition-colors duration-150"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="shrink-0 w-8 h-8 flex items-center justify-center
              border border-border bg-surface-light
              text-primary text-xs
              hover:border-primary/30 hover:bg-primary/5
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-150"
          >
            <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </form>
      </div>
    </div>
  );
});

// --- Sessions List Panel ---

const SessionsListPanel = memo(function SessionsListPanel() {
  const [sessions, setSessions] = useState<
    Array<{
      id: number;
      startedAt: number;
      duration: number | null;
      key: string | null;
      tempo: number | null;
    }>
  >([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    import('@/lib/dexie/db').then(({ db }) => {
      db.sessions
        .orderBy('startedAt')
        .reverse()
        .limit(20)
        .toArray()
        .then((rows) => {
          setSessions(
            rows.map((r) => ({
              id: r.id!,
              startedAt: r.startedAt,
              duration: r.duration,
              key: r.key,
              tempo: r.tempo,
            }))
          );
        })
        .finally(() => setLoadingList(false));
    });
  }, []);

  if (loadingList) {
    return (
      <div className="p-4">
        <p className="font-mono text-xs text-muted-foreground">Loading sessions...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-4">
        <p className="text-xs text-muted-foreground">No sessions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="p-2 flex flex-col gap-1">
      {sessions.map((session) => (
        <button
          key={session.id}
          onClick={() => {
            useSessionStore.getState().resetReplay();
            useSessionStore.getState().setReplayStatus('loading');
            // Trigger reload by updating the replay session
            import('@/lib/dexie/db')
              .then(({ db }) => {
                db.sessions
                  .get(session.id)
                  .then((s) => {
                    if (!s) {
                      useSessionStore.getState().setReplayStatus('error');
                      return;
                    }
                    useSessionStore.getState().setReplaySession(s);
                    db.midiEvents
                      .where('sessionId')
                      .equals(session.id)
                      .sortBy('timestamp')
                      .then((events) => {
                        useSessionStore.getState().setReplayEvents(events);
                        useSessionStore.getState().setReplayStatus('success');
                      })
                      .catch(() => {
                        useSessionStore.getState().setReplayStatus('error');
                      });
                  })
                  .catch(() => {
                    useSessionStore.getState().setReplayStatus('error');
                  });
              })
              .catch(() => {
                useSessionStore.getState().setReplayStatus('error');
              });
          }}
          className="text-left bg-card border border-surface-light p-3 hover:bg-surface-light transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs text-foreground">
              {new Intl.DateTimeFormat(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(session.startedAt))}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {session.duration
                ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s`
                : '--'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {session.key && <span>{session.key}</span>}
            {session.tempo && <span>{Math.round(session.tempo)} BPM</span>}
          </div>
        </button>
      ))}
    </div>
  );
});
