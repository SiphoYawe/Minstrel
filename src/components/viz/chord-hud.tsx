'use client';

import { useEffect, useReducer } from 'react';
import { useSessionStore } from '@/stores/session-store';
import type { ChordQuality, DetectedChord } from '@/features/analysis/analysis-types';

/** Harmonic function color mapping */
const FUNCTION_COLORS = {
  tonic: '#7CB9E8',
  dominant: '#E8C77B',
  subdominant: '#B4A7D6',
  default: '#666666',
} as const;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ENHARMONIC: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Fb: 'E',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
  'E#': 'F',
  'B#': 'C',
};

/** Seconds of silence before showing "last detected" dimmed state. */
const IDLE_THRESHOLD_MS = 30_000;
/** Duration of the highlight glow on chord detection (ms). */
const HIGHLIGHT_DURATION_MS = 400;

function noteIndex(name: string): number {
  return NOTE_NAMES.indexOf(ENHARMONIC[name] ?? name);
}

function getColor(chordRoot: string, keyRoot: string | null): string {
  if (!keyRoot) return FUNCTION_COLORS.default;
  const ki = noteIndex(keyRoot);
  const ci = noteIndex(chordRoot);
  if (ki < 0 || ci < 0) return FUNCTION_COLORS.default;
  const interval = (((ci - ki) % 12) + 12) % 12;
  if (interval === 0 || interval === 4 || interval === 9) return FUNCTION_COLORS.tonic;
  if (interval === 5 || interval === 2) return FUNCTION_COLORS.subdominant;
  if (interval === 7 || interval === 11) return FUNCTION_COLORS.dominant;
  return FUNCTION_COLORS.default;
}

function qualityAbbrev(q: ChordQuality): string {
  switch (q) {
    case 'Major':
      return '';
    case 'Minor':
      return 'm';
    case 'Dominant7':
      return '7';
    case 'Minor7':
      return 'm7';
    case 'Major7':
      return 'M7';
    case 'Diminished':
      return '\u00B0';
    case 'Augmented':
      return '+';
    case 'Sus2':
      return 'sus2';
    case 'Sus4':
      return 'sus4';
    default:
      return '';
  }
}

type HudState = {
  isIdle: boolean;
  justDetected: boolean;
  prevChordCount: number;
  lastDetectionTime: number;
};

type HudAction =
  | { type: 'chord_detected'; count: number }
  | { type: 'highlight_end' }
  | { type: 'idle' };

function hudReducer(state: HudState, action: HudAction): HudState {
  switch (action.type) {
    case 'chord_detected':
      return {
        ...state,
        isIdle: false,
        justDetected: true,
        prevChordCount: action.count,
        lastDetectionTime: Date.now(),
      };
    case 'highlight_end':
      return { ...state, justDetected: false };
    case 'idle':
      return state.isIdle ? state : { ...state, isIdle: true };
  }
}

const INITIAL_HUD_STATE: HudState = {
  isIdle: false,
  justDetected: false,
  prevChordCount: 0,
  lastDetectionTime: 0,
};

/**
 * Chord HUD — React overlay replacing canvas-drawn chord indicator.
 * Positioned at top-center of the canvas area, shows current chord
 * with quality block and roman numeral. Clean HTML prevents ghosting.
 *
 * Story 23.4: Added empty/waiting/idle states:
 * - "Play a chord..." placeholder before first detection
 * - Brief highlight animation on chord detection
 * - Dimmed "last detected" state after 30s of silence
 */
export function ChordHud() {
  const detectedChords = useSessionStore((s) => s.detectedChords);
  const currentKey = useSessionStore((s) => s.currentKey);
  const harmonicFunction = useSessionStore((s) => s.currentHarmonicFunction);

  const latest: DetectedChord | null =
    detectedChords.length > 0 ? detectedChords[detectedChords.length - 1] : null;

  const [hud, dispatch] = useReducer(hudReducer, INITIAL_HUD_STATE);

  // Track new chord detection for highlight animation
  useEffect(() => {
    if (detectedChords.length > hud.prevChordCount) {
      dispatch({ type: 'chord_detected', count: detectedChords.length });
      const timer = setTimeout(() => dispatch({ type: 'highlight_end' }), HIGHLIGHT_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [detectedChords.length, hud.prevChordCount]);

  // Idle detection: after 30s of silence, dim the HUD
  useEffect(() => {
    if (!latest || hud.lastDetectionTime === 0) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - hud.lastDetectionTime;
      if (elapsed >= IDLE_THRESHOLD_MS) {
        dispatch({ type: 'idle' });
      }
    }, 5_000);
    return () => clearInterval(interval);
  }, [latest, hud.lastDetectionTime]);

  // Empty state: no chord ever detected
  if (!latest) {
    return (
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-[var(--z-overlay)] pointer-events-none"
        role="status"
        aria-live="polite"
        aria-label="Waiting for chord detection"
      >
        <div className="flex items-center justify-center min-w-[44px] h-[28px] px-2.5">
          <span
            className="font-mono text-[12px] leading-none"
            style={{ color: 'rgba(255, 255, 255, 0.3)' }}
          >
            Play a chord...
          </span>
        </div>
      </div>
    );
  }

  const keyRoot = currentKey?.root ?? null;
  const color = getColor(latest.root, keyRoot);
  const label = `${latest.root}${qualityAbbrev(latest.quality)}`;
  const isMajor = latest.quality === 'Major';
  const isMinor = latest.quality === 'Minor';

  // Dim opacity when idle
  const containerOpacity = hud.isIdle ? 0.4 : 1;

  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-[var(--z-overlay)] flex flex-col items-center gap-1 pointer-events-none transition-opacity duration-500"
      style={{ opacity: containerOpacity }}
      role="status"
      aria-live="polite"
      aria-label={`Current chord: ${label}${hud.isIdle ? ' (last detected)' : ''}${harmonicFunction ? `, ${harmonicFunction.romanNumeral}` : ''}`}
    >
      {/* Chord quality block + label */}
      <div
        className="flex items-center justify-center min-w-[44px] h-[28px] px-2.5 transition-shadow duration-300"
        style={{
          backgroundColor: isMajor ? `${color}b3` : 'transparent',
          border: isMinor ? `1.5px solid ${color}b3` : isMajor ? 'none' : `1px solid ${color}80`,
          ...(!isMajor && !isMinor ? { backgroundColor: `${color}40` } : {}),
          // Brief highlight glow on new detection
          boxShadow: hud.justDetected ? `0 0 12px ${color}80` : 'none',
        }}
      >
        <span
          className="font-mono text-[13px] leading-none"
          style={{ color: 'rgba(255, 255, 255, 0.85)' }}
        >
          {label}
        </span>
      </div>

      {/* Roman numeral */}
      {harmonicFunction && (
        <div className="px-1.5 py-0.5" style={{ backgroundColor: 'rgba(15, 15, 15, 0.7)' }}>
          <span className="font-mono text-[11px] leading-none" style={{ color: `${color}cc` }}>
            {harmonicFunction.romanNumeral}
          </span>
        </div>
      )}

      {/* Idle indicator */}
      {hud.isIdle && (
        <span
          className="font-mono text-[10px] leading-none"
          style={{ color: 'rgba(255, 255, 255, 0.25)' }}
        >
          (last detected)
        </span>
      )}
    </div>
  );
}
