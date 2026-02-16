'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { REPLAY_SPEEDS, SCRUB_STEP_SMALL_MS, SCRUB_STEP_LARGE_MS } from '@/lib/constants';

// --- Types ---

export interface TimelineMarker {
  timestamp: number;
  type: 'snapshot' | 'drill' | 'insight';
  summary: string;
}

export interface TimelineScrubberProps {
  position: number;
  totalDuration: number;
  playbackState: 'paused' | 'playing';
  speed: number;
  markers: TimelineMarker[];
  onPositionChange: (positionMs: number) => void;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
  onRestart?: () => void;
}

// --- Helpers ---

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTimeAria(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (m > 0) parts.push(`${m} minute${m !== 1 ? 's' : ''}`);
  parts.push(`${s} second${s !== 1 ? 's' : ''}`);
  return parts.join(' ');
}

const MARKER_COLORS: Record<TimelineMarker['type'], string> = {
  snapshot: 'hsl(var(--primary))',
  drill: 'hsl(var(--accent-success))',
  insight: 'hsl(var(--accent-warm))',
};

// --- Component ---

export function TimelineScrubber({
  position,
  totalDuration,
  playbackState,
  speed,
  markers,
  onPositionChange,
  onPlayPause,
  onSpeedChange,
  onRestart,
}: TimelineScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const rafPending = useRef(false);
  const pendingPosition = useRef(0);
  const capturedPointerIdRef = useRef<number | null>(null);
  const savedUserSelectRef = useRef('');
  const markerListRef = useRef<HTMLDivElement>(null);
  const [hoveredMarker, setHoveredMarker] = useState<TimelineMarker | null>(null);
  const [speedAnnouncement, setSpeedAnnouncement] = useState('');

  const effectiveDuration = totalDuration || 1;
  const progressPercent = Math.min((position / effectiveDuration) * 100, 100);

  // --- Pixel-to-timestamp conversion ---
  const pixelToTimestamp = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * effectiveDuration;
    },
    [effectiveDuration]
  );

  // --- rAF-throttled position update ---
  const commitPosition = useCallback(
    (clientX: number) => {
      pendingPosition.current = pixelToTimestamp(clientX);
      if (!rafPending.current) {
        rafPending.current = true;
        requestAnimationFrame(() => {
          rafPending.current = false;
          onPositionChange(pendingPosition.current);
        });
      }
    },
    [pixelToTimestamp, onPositionChange]
  );

  // --- Pointer event handlers ---
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const track = trackRef.current;
      if (!track) return;
      track.setPointerCapture(e.pointerId);
      capturedPointerIdRef.current = e.pointerId;
      isDragging.current = true;
      savedUserSelectRef.current = document.body.style.userSelect;
      document.body.style.userSelect = 'none';
      onPositionChange(pixelToTimestamp(e.clientX));
    },
    [pixelToTimestamp, onPositionChange]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      commitPosition(e.clientX);
    },
    [commitPosition]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    capturedPointerIdRef.current = null;
    document.body.style.userSelect = savedUserSelectRef.current;
  }, []);

  // --- Keyboard handler for slider ---
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newPos = position;
      switch (e.key) {
        case 'ArrowLeft':
          newPos = Math.max(0, position - SCRUB_STEP_SMALL_MS);
          break;
        case 'ArrowRight':
          newPos = Math.min(effectiveDuration, position + SCRUB_STEP_SMALL_MS);
          break;
        case 'PageUp':
          newPos = Math.max(0, position - SCRUB_STEP_LARGE_MS);
          break;
        case 'PageDown':
          newPos = Math.min(effectiveDuration, position + SCRUB_STEP_LARGE_MS);
          break;
        case 'Home':
          newPos = 0;
          break;
        case 'End':
          newPos = effectiveDuration;
          break;
        default:
          return;
      }
      e.preventDefault();
      onPositionChange(newPos);
    },
    [position, effectiveDuration, onPositionChange]
  );

  // --- Arrow key navigation for marker buttons (UI-H11) ---
  const handleMarkerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    e.stopPropagation();
    const container = markerListRef.current;
    if (!container) return;
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
    if (buttons.length === 0) return;
    const currentIndex = buttons.indexOf(e.target as HTMLButtonElement);
    if (currentIndex === -1) return;
    const nextIndex =
      e.key === 'ArrowRight'
        ? Math.min(currentIndex + 1, buttons.length - 1)
        : Math.max(currentIndex - 1, 0);
    buttons[nextIndex].focus();
  }, []);

  // --- Speed change with announcement ---
  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      onSpeedChange(newSpeed);
      setSpeedAnnouncement(`Playback speed: ${newSpeed}x`);
    },
    [onSpeedChange]
  );

  // --- Cleanup pointer capture on unmount ---
  useEffect(() => {
    return () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.userSelect = savedUserSelectRef.current;
        const track = trackRef.current;
        if (track && capturedPointerIdRef.current !== null) {
          try {
            track.releasePointerCapture(capturedPointerIdRef.current);
          } catch {
            // Already released
          }
        }
        capturedPointerIdRef.current = null;
      }
    };
  }, []);

  // --- Global spacebar for play/pause ---
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        onPlayPause();
      }
    }
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [onPlayPause]);

  return (
    <div
      className="shrink-0 border-t border-surface-light bg-background"
      role="region"
      aria-label="Playback timeline"
    >
      {/* Track area — the scrubber itself */}
      <div className="relative px-4 pt-3 pb-1">
        {/* The interactive track */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Session timeline"
          aria-valuemin={0}
          aria-valuemax={totalDuration}
          aria-valuenow={Math.round(position)}
          aria-valuetext={formatTimeAria(position)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={handleKeyDown}
          className="relative h-6 cursor-pointer group
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        >
          {/* Track background (unfilled) */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-surface-light" />

          {/* Track filled portion */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-primary/20"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Scrub head */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-primary
              transition-[box-shadow] duration-150
              group-hover:shadow-[0_0_6px_rgba(124,185,232,0.4)]"
            style={{ left: `calc(${progressPercent}% - 2px)` }}
            aria-hidden="true"
          />

          {/* Current time floating label — clamped to avoid overflow */}
          <div
            className="absolute -top-5 font-mono text-sm text-primary tabular-nums
              pointer-events-none select-none whitespace-nowrap"
            style={{
              left: `${progressPercent}%`,
              transform: `translateX(${progressPercent < 10 ? '0%' : progressPercent > 90 ? '-100%' : '-50%'})`,
            }}
            aria-hidden="true"
          >
            {formatTime(position)}
          </div>

          {/* Event markers — semantic list with arrow key navigation (UI-H11) */}
          {markers.length > 0 && (
            <div
              ref={markerListRef}
              role="list"
              aria-label="Timeline markers"
              onKeyDown={handleMarkerKeyDown}
            >
              {markers.map((marker, i) => {
                const markerPercent = (marker.timestamp / effectiveDuration) * 100;
                const markerColor = MARKER_COLORS[marker.type];
                return (
                  <div
                    key={`${marker.type}-${marker.timestamp}-${i}`}
                    role="listitem"
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-[var(--z-overlay)]"
                    style={{ left: `${markerPercent}%` }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPositionChange(marker.timestamp);
                      }}
                      onMouseEnter={() => setHoveredMarker(marker)}
                      onMouseLeave={() => setHoveredMarker(null)}
                      onFocus={() => setHoveredMarker(marker)}
                      onBlur={() => setHoveredMarker(null)}
                      aria-label={`${marker.type}: ${marker.summary}`}
                      className="flex items-center justify-center w-4 h-4
                        cursor-pointer hover:scale-150 transition-transform duration-100"
                    >
                      <span
                        className="block w-2 h-2"
                        style={{ backgroundColor: markerColor }}
                        aria-hidden="true"
                      />
                    </button>

                    {/* Tooltip */}
                    {hoveredMarker === marker && (
                      <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                          px-2 py-1 bg-card border border-surface-border
                          font-mono text-[10px] text-foreground whitespace-nowrap
                          pointer-events-none z-[var(--z-banner)]"
                        role="tooltip"
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 mr-1.5 align-middle"
                          style={{ backgroundColor: markerColor }}
                          aria-hidden="true"
                        />
                        {marker.summary}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-1 font-mono text-xs">
        {/* Play / Pause */}
        <button
          onClick={onPlayPause}
          aria-label={playbackState === 'playing' ? 'Pause' : 'Play'}
          className="flex items-center justify-center w-8 h-8
            text-primary hover:text-white
            border border-surface-light hover:border-surface-border
            bg-transparent transition-colors duration-150"
        >
          {playbackState === 'playing' ? (
            <Pause className="w-3.5 h-3.5" strokeWidth={1.5} />
          ) : (
            <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
          )}
        </button>

        {/* Restart */}
        {onRestart && (
          <button
            onClick={onRestart}
            aria-label="Restart playback"
            className="flex items-center justify-center w-8 h-8
              text-muted-foreground hover:text-primary
              border border-surface-light hover:border-surface-border
              bg-transparent transition-colors duration-150"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        )}

        {/* Speed controls */}
        <div className="flex items-center gap-1">
          {REPLAY_SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              aria-label={`Set speed to ${s}x`}
              aria-pressed={speed === s}
              className={`
                px-2 py-1 text-[11px] tabular-nums
                border transition-colors duration-150
                ${
                  speed === s
                    ? 'text-primary border-primary/30 bg-primary/5'
                    : 'text-muted-foreground border-surface-light hover:text-foreground/70 hover:border-surface-border'
                }
              `}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Time display */}
        <span className="text-foreground/70 tabular-nums tracking-tight">
          {formatTime(position)}
          <span className="text-muted-foreground mx-1">/</span>
          {formatTime(totalDuration)}
        </span>
      </div>

      {/* Screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {speedAnnouncement}
      </div>
    </div>
  );
}
