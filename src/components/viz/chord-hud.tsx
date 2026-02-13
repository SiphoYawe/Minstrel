'use client';

import { useSessionStore } from '@/stores/session-store';
import type { ChordQuality } from '@/features/analysis/analysis-types';

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

/**
 * Chord HUD — React overlay replacing canvas-drawn chord indicator.
 * Positioned at top-center of the canvas area, shows current chord
 * with quality block and roman numeral. Clean HTML prevents ghosting.
 */
export function ChordHud() {
  const detectedChords = useSessionStore((s) => s.detectedChords);
  const currentKey = useSessionStore((s) => s.currentKey);
  const harmonicFunction = useSessionStore((s) => s.currentHarmonicFunction);

  const latest = detectedChords.length > 0 ? detectedChords[detectedChords.length - 1] : null;
  if (!latest) return null;

  const keyRoot = currentKey?.root ?? null;
  const color = getColor(latest.root, keyRoot);
  const label = `${latest.root}${qualityAbbrev(latest.quality)}`;
  const isMajor = latest.quality === 'Major';
  const isMinor = latest.quality === 'Minor';

  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-[var(--z-overlay)] flex flex-col items-center gap-1 pointer-events-none"
      role="status"
      aria-live="polite"
      aria-label={`Current chord: ${label}${harmonicFunction ? `, ${harmonicFunction.romanNumeral}` : ''}`}
    >
      {/* Chord quality block + label */}
      <div
        className="flex items-center justify-center min-w-[44px] h-[28px] px-2.5"
        style={{
          backgroundColor: isMajor ? `${color}b3` : 'transparent',
          border: isMinor ? `1.5px solid ${color}b3` : isMajor ? 'none' : `1px solid ${color}80`,
          ...(!isMajor && !isMinor ? { backgroundColor: `${color}40` } : {}),
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
    </div>
  );
}
