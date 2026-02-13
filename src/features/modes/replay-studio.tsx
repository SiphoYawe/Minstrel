'use client';

import { useState, useCallback, useMemo } from 'react';
import { VisualizationCanvas } from '@/components/viz/visualization-canvas';
import { StatusBar } from '@/components/status-bar';
import { ModeSwitcher } from '@/features/modes/mode-switcher';
import { TimelineScrubber } from '@/components/timeline-scrubber';
import type { TimelineMarker } from '@/components/timeline-scrubber';
import { useReplaySession } from '@/features/session/use-replay-session';
import { useSessionStore } from '@/stores/session-store';
import { togglePlayback, setPlaybackSpeed } from '@/features/session/replay-engine';

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

// --- Tab type ---

type TabId = 'insights' | 'sessions';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'insights', label: 'Insights' },
  { id: 'sessions', label: 'Sessions' },
];

// --- Main Component ---

interface ReplayStudioProps {
  sessionId: number;
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

  // Build markers from analysis snapshots (empty for now — populated in Story 6.3)
  const markers = useMemo<TimelineMarker[]>(() => [], []);

  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, tabId: TabId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab(tabId);
    }
  }, []);

  // --- Loading state ---
  if (replayStatus === 'loading') {
    return (
      <div className="relative h-dvh w-screen bg-background">
        <StatusBar />
        <div className="fixed right-4 top-12 z-30">
          <ModeSwitcher />
        </div>
        <div className="flex h-full pt-10 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div
              className="h-1 w-48 bg-[#1A1A1A] overflow-hidden"
              role="progressbar"
              aria-label="Loading session"
            >
              <div className="h-full w-1/3 bg-[#7CB9E8] animate-[shimmer_1.2s_ease-in-out_infinite]" />
            </div>
            <p
              className="font-mono text-xs tracking-widest uppercase text-[#7CB9E8]/60"
              aria-live="polite"
            >
              Loading session...
            </p>
          </div>
        </div>
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </div>
    );
  }

  // --- Error state ---
  if (replayStatus === 'error') {
    return (
      <div className="relative h-dvh w-screen bg-background">
        <StatusBar />
        <div className="fixed right-4 top-12 z-30">
          <ModeSwitcher />
        </div>
        <div className="flex h-full pt-10 items-center justify-center">
          <div className="max-w-md px-6 text-center">
            <div className="mb-4 font-mono text-lg text-[#D4A43C]" aria-live="polite">
              Session not found
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              It may have been deleted or not yet synced.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Success state: three-panel layout ---
  return (
    <div className="relative h-dvh w-screen bg-background">
      <StatusBar />

      <div className="fixed right-4 top-12 z-30">
        <ModeSwitcher />
      </div>

      {/* Main grid: canvas + detail panel, then timeline below */}
      <div className="flex flex-col h-full pt-10">
        {/* Upper region: canvas + right panel */}
        <div
          className="flex-1 min-h-0 grid transition-all duration-300"
          style={{ gridTemplateColumns: '3fr 1fr' }}
        >
          {/* Canvas area */}
          <div className="min-w-0 h-full">
            <VisualizationCanvas />
          </div>

          {/* Right detail panel */}
          <div className="flex flex-col h-full border-l border-[#1A1A1A] min-w-0 bg-[#0F0F0F]">
            {/* Tab bar */}
            <div
              className="flex shrink-0 border-b border-[#1A1A1A]"
              role="tablist"
              aria-label="Replay details"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                  className={`
                    relative flex-1 px-4 py-3
                    text-xs uppercase tracking-[0.12em] font-medium
                    transition-colors duration-200
                    ${activeTab === tab.id ? 'text-[#7CB9E8]' : 'text-[#666] hover:text-[#999]'}
                  `}
                >
                  {tab.label}
                  {/* Active underline */}
                  {activeTab === tab.id && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-px bg-[#7CB9E8]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* Insights panel */}
              <div
                role="tabpanel"
                id="panel-insights"
                aria-labelledby="tab-insights"
                hidden={activeTab !== 'insights'}
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
              >
                {activeTab === 'sessions' && (
                  <div className="p-4">
                    <p className="text-xs text-[#555] font-mono tracking-wide">
                      Session list — coming in Story 6.2
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline scrubber — bottom anchored */}
        <TimelineScrubber
          position={replayPosition}
          totalDuration={totalDurationMs}
          playbackState={replayState}
          speed={replaySpeed}
          markers={markers}
          onPositionChange={setReplayPosition}
          onPlayPause={togglePlayback}
          onSpeedChange={setPlaybackSpeed}
        />
      </div>
    </div>
  );
}

// --- Insights Panel ---

function InsightsPanel({
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
          <div key={metric.label} className="bg-[#141414] border border-[#1A1A1A] p-3">
            <span className="block text-[10px] uppercase tracking-[0.1em] text-[#555] mb-1">
              {metric.label}
            </span>
            <span
              className={`block text-sm text-foreground truncate ${metric.mono ? 'font-mono' : ''}`}
            >
              {metric.value}
              {metric.unit && <span className="text-[10px] text-[#555] ml-1">{metric.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
